#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { parseCSV, getColumns } from './parser.js';
import { transformData } from './math.js';
import { generateLatexTemplate } from './template.js';
import { compileLatex } from './compile.js';

const argv = yargs(hideBin(process.argv))
  .option('input', { alias: 'i', type: 'string', description: 'Input CSV file', demandOption: true })
  .option('x', { type: 'string', description: 'X column name', demandOption: true })
  .option('y', { type: 'string', description: 'Y column name', demandOption: true })
  .option('xfunc', { type: 'string', default: 'id', choices: ['id', 'ln', 'log10', 'sqrt', 'sq', 'diff'] })
  .option('yfunc', { type: 'string', default: 'id', choices: ['id', 'ln', 'log10', 'sqrt', 'sq', 'diff'] })
  .option('smooth', { type: 'boolean', default: false })
  .option('title', { type: 'string', default: 'Graph' })
  .option('xlabel', { type: 'string', default: 'X' })
  .option('ylabel', { type: 'string', default: 'Y' })
  .option('legend', { type: 'string' })
  .option('caption', { type: 'string' })
  // Отут сама суть: шаблон для підпису точок
  .option('point-label', { 
    type: 'string', 
    default: '$x = {x}, y = {y}$',
    description: 'Template for point labels. Use {x} and {y} as placeholders.'
  })
  .option('lang', { type: 'string', default: 'ukrainian' })
  .option('font', { type: 'string', default: 'DejaVu Serif' })
  .option('output', { alias: 'o', type: 'string', default: 'graph.pdf' })
  .help().parseSync();

const data = parseCSV(argv.input);
const points = transformData(data, argv.x, argv.y, argv.xfunc, argv.yfunc);

const latexCode = generateLatexTemplate({
  points,
  title: argv.title,
  xlabel: argv.xlabel,
  ylabel: argv.ylabel,
  legend: argv.legend || argv.title,
  caption: argv.caption || argv.title,
  pointLabelTemplate: argv.pointLabel,
  lang: argv.lang,
  font: argv.font,
  smooth: argv.smooth,
});

const success = compileLatex(latexCode, argv.output);
if (success) console.log(`PDF saved to: ${argv.output}`);
else process.exit(1);
