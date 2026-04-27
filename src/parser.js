import fs from 'fs';
import { parse } from 'csv/sync';

export function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
}

export function getColumns(records) {
  if (records.length === 0) return [];
  return Object.keys(records[0]);
}