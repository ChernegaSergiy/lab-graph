#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { parseCSV } from './parser.js';
import { transformData, getSmartLegendPos } from './math.js';
import { generateLatexTemplate } from './template.js';
import { compileLatex } from './compile.js';

const argv = yargs(hideBin(process.argv))
  .option('input', { alias: 'i', type: 'string', demandOption: true })
  .option('x', { type: 'string', demandOption: true })
  .option('y', { type: 'string', demandOption: true })
  .option('xfunc', { type: 'string', default: 'id' })
  .option('yfunc', { type: 'string', default: 'id' })
  .option('smooth', { type: 'boolean', default: false })
  .option('title', { type: 'string', default: 'Graph' })
  .option('xlabel', { type: 'string', default: 'X' })
  .option('ylabel', { type: 'string', default: 'Y' })
  .option('legend', { type: 'string' })
  .option('legend-pos', {
    type: 'string',
    default: 'auto',
    choices: ['auto', 'north east', 'north west', 'south east', 'south west', 'outer north east']
  })
  .option('caption', { type: 'string' })
  .option('point-label', { type: 'string', default: '$x = {x}, y = {y}$' })
  .option('lang', { type: 'string', default: 'ukrainian' })
  .option('font', { type: 'string', default: 'DejaVu Serif' })
  .option('output', { alias: 'o', type: 'string', default: 'graph.pdf' })
  .help().parseSync();

const data = parseCSV(argv.input);
const points = transformData(data, argv.x, argv.y, argv.xfunc, argv.yfunc);

// Визначаємо позицію легенди
const legendPos = argv.legendPos === 'auto' 
  ? getSmartLegendPos(points) 
  : argv.legendPos;

const latexCode = generateLatexTemplate({
  points,
  title: argv.title,
  xlabel: argv.xlabel,
  ylabel: argv.ylabel,
  legend: argv.legend || argv.title,
  legendPos: legendPos,
  caption: argv.caption || argv.title,
  pointLabelTemplate: argv.pointLabel,
  lang: argv.lang,
  font: argv.font,
  smooth: argv.smooth,
});

const success = compileLatex(latexCode, argv.output);
if (success) console.log(`PDF saved to: ${argv.output}`);
else process.exit(1);
