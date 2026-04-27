#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { parseCSV, getColumns } from './parser.js';
import { transformData, getSmartLegendPos, getSeriesColor } from './math.js';
import { generateLatexTemplate } from './template.js';
import { compileLatex } from './compile.js';

const argv = yargs(hideBin(process.argv))
  .option('input', { alias: 'i', type: 'string', demandOption: true })
  .option('x', { type: 'string', demandOption: true })
  .option('y', { 
    type: 'array', // Дозволяємо масив значень для Y
    demandOption: true,
    description: 'One or more Y columns'
  })
  .option('xfunc', { type: 'string', default: 'id' })
  .option('yfunc', { type: 'string', default: 'id' })
  .option('smooth', { type: 'boolean', default: false })
  .option('title', { type: 'string', default: 'Graph' })
  .option('xlabel', { type: 'string', default: 'X' })
  .option('ylabel', { type: 'string', default: 'Y' })
  .option('legend', { type: 'array', description: 'Legend labels for each Y column' })
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
const columns = getColumns(data);

// Перевірка колонок
if (!columns.includes(argv.x)) {
  console.error(`Error: X Column '${argv.x}' not found.`);
  process.exit(1);
}

const series = argv.y.map((yKey, index) => {
  if (!columns.includes(yKey)) {
    console.error(`Error: Y Column '${yKey}' not found.`);
    process.exit(1);
  }

  return {
    name: yKey,
    legend: (argv.legend && argv.legend[index]) || yKey,
    points: transformData(data, argv.x, yKey, argv.xfunc, argv.yfunc),
    color: getSeriesColor(index)
  };
});

// Для розумної легенди використовуємо першу серію або об'єднану (спростимо до першої)
const legendPos = argv.legendPos === 'auto' 
  ? getSmartLegendPos(series[0].points) 
  : argv.legendPos;

const latexCode = generateLatexTemplate({
  series, // Передаємо масив серій замість одного масиву точок
  title: argv.title,
  xlabel: argv.xlabel,
  ylabel: argv.ylabel,
  legendPos,
  caption: argv.caption || argv.title,
  pointLabelTemplate: argv.pointLabel,
  lang: argv.lang,
  font: argv.font,
  smooth: argv.smooth,
});

const success = compileLatex(latexCode, argv.output);
if (success) console.log(`PDF saved to: ${argv.output}`);
else process.exit(1);
