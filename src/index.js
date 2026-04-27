#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { parseCSV, getColumns } from './parser.js';
import { transformData } from './math.js';
import { generateLatexTemplate } from './template.js';
import { compileLatex } from './compile.js';

const argv = yargs(hideBin(process.argv))
  .option('input', {
    alias: 'i',
    type: 'string',
    description: 'Input CSV file',
    demandOption: true,
  })
  .option('x', {
    type: 'string',
    description: 'X column name',
    demandOption: true,
  })
  .option('y', {
    type: 'string',
    description: 'Y column name',
    demandOption: true,
  })
  .option('xfunc', {
    type: 'string',
    default: 'id',
    choices: ['id', 'ln', 'log10', 'sqrt', 'sq', 'diff'],
    description: 'Function to apply to X values',
  })
  .option('yfunc', {
    type: 'string',
    default: 'id',
    choices: ['id', 'ln', 'log10', 'sqrt', 'sq', 'diff'],
    description: 'Function to apply to Y values',
  })
  .option('smooth', {
    type: 'boolean',
    default: false,
    description: 'Use smooth curve',
  })
  .option('title', {
    type: 'string',
    description: 'Graph title',
  })
  .option('xlabel', {
    type: 'string',
    description: 'X axis label',
  })
  .option('ylabel', {
    type: 'string',
    description: 'Y axis label',
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    default: 'graph.pdf',
    description: 'Output PDF file',
  })
  .help()
  .alias('help', 'h')
  .parseSync();

const data = parseCSV(argv.input);
const columns = getColumns(data);

if (!columns.includes(argv.x)) {
  console.error(`Error: Column '${argv.x}' not found. Available: ${columns.join(', ')}`);
  process.exit(1);
}
if (!columns.includes(argv.y)) {
  console.error(`Error: Column '${argv.y}' not found. Available: ${columns.join(', ')}`);
  process.exit(1);
}

const points = transformData(data, argv.x, argv.y, argv.xfunc, argv.yfunc);

const latexCode = generateLatexTemplate({
  points,
  title: argv.title,
  xlabel: argv.xlabel,
  ylabel: argv.ylabel,
  smooth: argv.smooth,
});

const success = compileLatex(latexCode, argv.output);

if (success) {
  console.log(`PDF saved to: ${argv.output}`);
} else {
  console.error('Failed to compile PDF');
  process.exit(1);
}