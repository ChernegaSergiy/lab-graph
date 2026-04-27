import fs from 'fs';
import { parse } from 'csv/sync';

export function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: "${filePath}"`);
    process.exit(1);
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Error: Cannot read file "${filePath}": ${err.message}`);
    process.exit(1);
  }

  let records;
  try {
    records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    console.error(`Error: Failed to parse CSV "${filePath}": ${err.message}`);
    process.exit(1);
  }

  if (records.length === 0) {
    console.error(`Error: CSV file "${filePath}" is empty or has no data rows.`);
    process.exit(1);
  }

  return records;
}

export function getColumns(records) {
  if (records.length === 0) return [];
  return Object.keys(records[0]);
}
