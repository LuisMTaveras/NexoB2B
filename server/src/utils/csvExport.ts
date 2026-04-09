import { Parser } from 'json2csv';
import { Response } from 'express';
import { logger } from '../lib/logger';

/**
 * Utility to convert JSON data to CSV and send it as a download response.
 */
export function exportToCsv(res: Response, filename: string, data: any[], fields?: string[]) {
  try {
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`${filename}.csv`);
    return res.send(csv);
  } catch (err) {
    logger.error('Failed to export CSV', { filename, error: err });
    return res.status(500).json({ success: false, error: 'Failed to generate CSV export' });
  }
}
