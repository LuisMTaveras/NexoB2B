import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import axios from 'axios';
import { get } from 'lodash';
import { SyncDirection, Integration, IntegrationMapping } from '@prisma/client';
import { decrypt } from '../../lib/crypto';

export interface MappingConfig {
  [canonicalField: string]: string | { static: any } | { from: string };
}

export interface TransformConfig {
  [field: string]: {
    map?: Record<string, any>;
    format?: string;
    type?: 'string' | 'float' | 'int' | 'uppercase' | 'trim';
  };
}

export class IntegrationRuntime {
  /**
   * Transforms a raw ERP object into the NexoB2B Canonical Model (INBOUND)
   * or a Canonical Object into an ERP payload (OUTBOUND).
   */
  static transform(source: any, fieldMappings: any, transforms: any, direction: SyncDirection): any {
    const result: any = {};
    const mappings = fieldMappings as MappingConfig;
    const transConfig = (transforms || {}) as TransformConfig;

    for (const [targetPath, sourceConfig] of Object.entries(mappings)) {
      let value: any = null;

      if (typeof sourceConfig === 'string') {
        // Dot notation resolution for source paths
        value = get(source, sourceConfig);
      } else if ('static' in sourceConfig) {
        value = sourceConfig.static;
      } else if ('from' in sourceConfig) {
        // Level 2/3 resolution should be handled before transform() is called
        // if it depends on external context like Client or Order
        value = get(source, sourceConfig.from);
      }

      // Apply transforms if defined for this target field
      if (transConfig[targetPath]) {
        value = this.applyTransform(value, transConfig[targetPath]);
      }

      // Set nested property in result
      this.setNestedProperty(result, targetPath, value);
    }

    return result;
  }

  private static applyTransform(value: any, config: any): any {
    if (value === undefined || value === null) return value;

    let result = value;

    // 1. Value Mapping
    if (config.map && config.map[result] !== undefined) {
      result = config.map[result];
    }

    // 2. Type Conversions
    if (config.type) {
      switch (config.type) {
        case 'float': result = parseFloat(result); break;
        case 'int': result = parseInt(result, 10); break;
        case 'string': result = String(result); break;
        case 'uppercase': result = String(result).toUpperCase(); break;
        case 'trim': result = String(result).trim(); break;
      }
    }

    // 3. Date Formatting (Basic implementation)
    if (config.format && result instanceof Date) {
      // For now just basic ISO or string conversion. 
      // In a real app we'd use date-fns or dayjs here.
      if (config.format === 'ISO') result = result.toISOString();
      else if (config.format === 'YYYY-MM-DD') result = result.toISOString().split('T')[0];
    }

    return result;
  }

  private static setNestedProperty(obj: any, path: string, value: any) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (i === keys.length - 1) {
        current[key] = value;
      } else {
        current[key] = current[key] || {};
        current = current[key];
      }
    }
  }

  /**
   * Resolves the 3 levels of mandatory/optional fields for Outbound requests.
   * Level 1: Static (in mappings)
   * Level 2: Client erpMetadata
   * Level 3: Order extendedFields
   */
  static resolveOutboundContext(order: any, customer: any): any {
    return {
      order: {
        ...order,
        extendedFields: order.extendedFields || {}
      },
      client: {
        ...customer,
        erpMetadata: customer.erpMetadata || {}
      }
    };
  }

  /**
   * Executes a REST request to the ERP with configured Auth.
   */
  static async executeRequest(integration: Integration, mapping: IntegrationMapping | { externalEndpoint: string, method: string }, payload: any = null) {
    const url = `${integration.baseUrl}${mapping.externalEndpoint}`;
    const headers = this.resolveHeaders(integration);

    try {
      const response = await axios({
        method: mapping.method,
        url,
        data: payload,
        headers,
        timeout: 10000 // 10s default
      });

      return response.data;
    } catch (err: any) {
      logger.error(`ERP Request Failed: ${mapping.method} ${url}`, {
        error: err.response?.data || err.message,
        status: err.response?.status
      });
      throw err;
    }
  }

  /**
   * Fetches detailed data for a singular entity (e.g. Order Lines) on-demand.
   */
  static async fetchOnDemandDetail(integration: Integration, mapping: IntegrationMapping, externalId: string) {
    if (!mapping.detailEndpoint) return null;

    const endpoint = mapping.detailEndpoint.replace(/\{(externalId|id)\}/g, externalId);
    const url = `${integration.baseUrl}${endpoint}`;
    const headers = this.resolveHeaders(integration);

    try {
      const response = await axios({
        method: 'GET',
        url,
        headers,
        timeout: 8000
      });

      const rawData = response.data;
      const dataToProcess = (mapping as any).detailDataPath 
        ? get(rawData, (mapping as any).detailDataPath) 
        : rawData;
      
      // If we have a detail mapping, we transform the raw response
      if (mapping.detailFieldMappings && dataToProcess) {
        // If dataToProcess is an array, transform each item
        if (Array.isArray(dataToProcess)) {
          return dataToProcess.map(item => this.transform(item, mapping.detailFieldMappings, null, 'INBOUND'));
        }
        // If it's an object, transform it direct
        return this.transform(dataToProcess, mapping.detailFieldMappings, null, 'INBOUND');
      }

      return dataToProcess;
    } catch (err: any) {
      logger.warn(`On-Demand ERP Detail Fetch Failed: ${url}`, { error: err.message });
      throw err;
    }
  }

  private static resolveHeaders(integration: Integration): any {
    const headers: any = (integration.headers as any) || {};
    
    // Safety check for empty credentials
    if (!integration.credentials) return headers;

    try {
      const decoded = decrypt(integration.credentials as string);
      if (!decoded) return headers;
      
      const creds = JSON.parse(decoded);
      
      if (integration.authMethod === 'API_KEY' && creds.apiKey) {
        headers[creds.headerName || 'X-API-Key'] = creds.apiKey;
      } else if (integration.authMethod === 'BEARER_TOKEN' && creds.token) {
        headers['Authorization'] = `Bearer ${creds.token}`;
      } else if (integration.authMethod === 'BASIC_AUTH' && creds.username && creds.password) {
        const auth = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      }
    } catch (err) {
      logger.warn(`Failed to resolve headers for integration ${integration.name}: ${err.message}`);
    }

    return headers;
  }
}
