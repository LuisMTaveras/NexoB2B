import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from './logger';

export type AuthMethod = 'API_KEY' | 'BEARER_TOKEN' | 'BASIC_AUTH' | 'OAUTH2';

export interface IntegrationCredentials {
  // API_KEY
  apiKey?: string;
  headerName?: string; // default: 'X-API-Key'
  // BEARER_TOKEN
  token?: string;
  // BASIC_AUTH
  username?: string;
  password?: string;
  // OAUTH2
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  accessToken?: string; // cached
}

export interface PaginationConfig {
  type: 'page' | 'offset' | 'cursor' | 'none';
  pageParam?: string;       // e.g. "page"
  pageSizeParam?: string;   // e.g. "limit"
  pageSize?: number;        // e.g. 100
  offsetParam?: string;     // for offset pagination
  cursorParam?: string;     // for cursor pagination
  nextCursorPath?: string;  // JSON path to next cursor in response
  dataPath?: string;        // JSON path to the array (e.g. "data.results")
  totalPath?: string;       // JSON path to total count
}

export interface FetchAllOptions {
  endpoint: string;
  pagination: PaginationConfig;
  queryParams?: Record<string, unknown>;
  headers?: Record<string, string>;
  onBatch?: (items: unknown[], page: number) => Promise<void>;
  maxPages?: number; // safety limit
}

/**
 * Resolves a JSON path like "data.results" from an object.
 */
export function resolvePath(obj: unknown, path?: string): unknown {
  if (!path) return obj;
  return path.split('.').reduce<unknown>((cur, key) => {
    if (cur && typeof cur === 'object') return (cur as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

/**
 * HTTP client for external ERP integrations.
 * Supports multiple auth methods and automatic pagination for large datasets.
 */
export class ErpClient {
  private http: AxiosInstance;
  private authMethod: AuthMethod;
  private credentials: IntegrationCredentials;

  constructor(baseUrl: string, authMethod: AuthMethod, credentials: IntegrationCredentials, extraHeaders?: Record<string, string>) {
    this.authMethod = authMethod;
    this.credentials = credentials;

    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...extraHeaders,
      },
    });

    this.http.interceptors.request.use(async (config) => {
      await this.injectAuth(config);
      return config;
    });

    this.http.interceptors.response.use(
      (res) => res,
      (err) => {
        logger.warn('ERP request failed', {
          url: err.config?.url,
          status: err.response?.status,
          message: err.message,
        });
        return Promise.reject(err);
      },
    );
  }

  private async injectAuth(config: AxiosRequestConfig): Promise<void> {
    const creds = this.credentials;
    switch (this.authMethod) {
      case 'API_KEY':
        const headerName = creds.headerName || 'X-API-Key';
        config.headers = { ...config.headers, [headerName]: creds.apiKey };
        break;
      case 'BEARER_TOKEN':
        config.headers = { ...config.headers, Authorization: `Bearer ${creds.token}` };
        break;
      case 'BASIC_AUTH':
        const encoded = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
        config.headers = { ...config.headers, Authorization: `Basic ${encoded}` };
        break;
      case 'OAUTH2':
        if (!creds.accessToken) {
          creds.accessToken = await this.fetchOAuthToken();
        }
        config.headers = { ...config.headers, Authorization: `Bearer ${creds.accessToken}` };
        break;
    }
  }

  private async fetchOAuthToken(): Promise<string> {
    const creds = this.credentials;
    const res = await axios.post(creds.tokenUrl!, {
      grant_type: 'client_credentials',
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
    });
    return res.data.access_token;
  }

  /**
   * Test connectivity by hitting the base URL or a test endpoint.
   */
  async testConnection(testEndpoint = '/'): Promise<{ ok: boolean; statusCode?: number; error?: string }> {
    try {
      const res = await this.http.get(testEndpoint);
      return { ok: true, statusCode: res.status };
    } catch (err: any) {
      return {
        ok: false,
        statusCode: err.response?.status,
        error: err.response?.data?.message || err.message,
      };
    }
  }

  /**
   * Fetch all records from a paginated endpoint.
   * Calls onBatch() for each page so memory stays bounded.
   */
  async fetchAll(options: FetchAllOptions): Promise<{ total: number; fetched: number }> {
    const { endpoint, pagination, queryParams = {}, headers = {}, onBatch, maxPages = 100 } = options;
    const pageSize = pagination.pageSize ?? 100;
    let fetched = 0;
    let total = 0;
    let page = 1;
    let offset = 0;
    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
      const params: Record<string, unknown> = { ...queryParams };

      if (pagination.type === 'page') {
        params[pagination.pageParam || 'page'] = page;
        params[pagination.pageSizeParam || 'limit'] = pageSize;
      } else if (pagination.type === 'offset') {
        params[pagination.offsetParam || 'offset'] = offset;
        params[pagination.pageSizeParam || 'limit'] = pageSize;
      } else if (pagination.type === 'cursor' && cursor) {
        params[pagination.cursorParam || 'cursor'] = cursor;
        params[pagination.pageSizeParam || 'limit'] = pageSize;
      }

      logger.info(`[ERP_DEBUG] Fetching ${endpoint} page ${page}, offset ${offset}, params:`, params);

      let responseData: any;
      try {
        const res = await this.http.get(endpoint, { params, headers });
        responseData = res.data;
      } catch (err: any) {
        throw new Error(`Failed to fetch page ${page} from ${endpoint}: ${err.message}`);
      }

      const items = resolvePath(responseData, pagination.dataPath);
      if (!Array.isArray(items)) {
        logger.info(`[ERP_DEBUG] No items array found in response for ${endpoint}`);
        // If no pagination configured or data is root array
        const rootItems = Array.isArray(responseData) ? responseData : [];
        fetched += rootItems.length;
        if (onBatch) await onBatch(rootItems, 1);
        break;
      }

      if (items.length === 0) {
        logger.info(`[ERP_DEBUG] Received empty array. stopping sync.`);
        break;
      }

      if (total === 0 && (pagination.totalPath || responseData.total !== undefined)) {
        const path = pagination.totalPath || 'total';
        total = Number(resolvePath(responseData, path)) || 0;
        logger.info(`[ERP_DEBUG] Total count detected: ${total}`);
      }

      fetched += items.length;
      logger.info(`[ERP_DEBUG] Fetched ${items.length} items. Total so far: ${fetched}/${total}`);
      if (onBatch) await onBatch(items, page);

      // Determine if more pages
      if (pagination.type === 'cursor') {
        const nextCursor = pagination.nextCursorPath
          ? resolvePath(responseData, pagination.nextCursorPath)
          : null;
        cursor = typeof nextCursor === 'string' ? nextCursor : null;
        hasMore = !!cursor && items.length === pageSize;
      } else if (pagination.type === 'none') {
        hasMore = false;
      } else {
        // Stop if we fetched everything according to the API's total count
        if (total > 0 && fetched >= total) {
          logger.info(`[ERP_DEBUG] Stopping: fetched all records (${fetched} >= ${total})`);
          hasMore = false;
        } else {
          hasMore = items.length === pageSize;
        }

        // If total is still 0 after first page and it returned less than page size, we stop
        if (total === 0 && items.length < pageSize) {
          hasMore = false;
        }
      }

      logger.info(`[ERP_DEBUG] hasMore: ${hasMore}, reason: ${items.length} === ${pageSize}`);

      page++;
      offset += items.length;

      // Safety: if we are at page > 1 but offset hasn't increased or we keep getting the same total...
      // (This is just a fallback)

      // Small delay to avoid rate-limiting
      if (hasMore) await new Promise((r) => setTimeout(r, 50));
    }

    if (page > maxPages) {
      logger.info(`[ERP_DEBUG] Emergency stop hit: maxPages (${maxPages}) reached`);
    }

    return { total: total || fetched, fetched };
  }

  getHttp() { return this.http; }
}

export function buildErpClient(
  baseUrl: string,
  authMethod: AuthMethod,
  credentials: IntegrationCredentials,
  extraHeaders?: Record<string, string>,
): ErpClient {
  return new ErpClient(baseUrl, authMethod, credentials as IntegrationCredentials, extraHeaders);
}
