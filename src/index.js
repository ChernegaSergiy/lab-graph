import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { parseCSV, getColumns } from './parser.js';
import { transformData, getSeriesColor, getSmartLegendPos } from './math.js';
import { checkXelatex, compileLatex } from './compile.js';
import { generateLatexTemplate } from './template.js';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: lab-graph -i <csv> -x <col> -y <col> [options]')
  .option('input',   { alias: 'i', type: 'string', demandOption: true, description: 'Path to CSV file' })
  .option('output',  { alias: 'o', type: 'string', default: 'graph.pdf', description: 'Output PDF path' })
  .option('latex-only', { type: 'boolean', default: false, description: 'Only generate .tex file, do not compile' })
  .option('x',       { type: 'string', demandOption: true, description: 'X column name' })
  .option('y',       { type: 'array',  demandOption: true, description: 'Y column name(s)' })
  .option('xfunc',   {
    type: 'string',
    choices: ['id', 'ln', 'log10', 'sqrt', 'sq', 'diff'],
    default: 'id',
    description: 'Transform applied to X values',
  })
  .option('yfunc',   {
    type: 'string',
    choices: ['id', 'ln', 'log10', 'sqrt', 'sq', 'diff'],
    default: 'id',
    description: 'Transform applied to Y values',
  })
  .option('smooth',  { type: 'boolean', default: false, description: 'Draw smooth curves' })
  .option('fit',     {
    type: 'string',
    choices: ['none', 'linear'],
    default: 'none',
    description: 'Add a regression line: none | linear',
  })
  .option('title',   { type: 'string', default: 'Graph', description: 'Chart title' })
  .option('xlabel',  { type: 'string', default: 'X',     description: 'X-axis label' })
  .option('ylabel',  { type: 'string', default: 'Y',     description: 'Y-axis label' })
  .option('xunit',   { type: 'string', description: 'Unit for X axis (e.g. cm)' })
  .option('yunit',   { type: 'string', description: 'Unit for Y axis (e.g. s)' })
  .option('legend',  { type: 'array',  description: 'Legend labels for each Y series' })
  .option('legend-pos', {
    type: 'string',
    default: 'auto',
    choices: ['auto', 'north east', 'north west', 'south east', 'south west', 'outer north east'],
    description: 'Legend position (auto = smart placement)',
  })
  .option('caption', { type: 'string', description: 'Figure caption (defaults to title)' })
  .option('point-label', {
    type: 'string',
    default: '${xn} = {x}$',
    description: 'Point label template. Use {xn}, {x} and {y} as placeholders.',
  })
  .option('labels', { type: 'boolean', default: true, description: 'Enable point labels (use --no-labels to disable)' })
  .option('lang',  { type: 'string', default: 'ukrainian', description: 'babel language' })
  .option('font',  { type: 'string', default: 'DejaVu Serif', description: 'Main font (fontspec name)' })

  .group(['input', 'output', 'latex-only'], 'Input / Output:')
  .group(['x', 'y', 'xfunc', 'yfunc'], 'Columns & Transforms:')
  .group(
    ['smooth', 'fit', 'title', 'xlabel', 'ylabel', 'xunit', 'yunit', 'legend', 'legend-pos', 'caption', 'point-label', 'labels', 'lang', 'font'], 
    'Appearance:'
  )

  .version()
  .help()
  .parseSync();

// ── xelatex availability check ───────────────────────────────────────────────
if (!argv.latexOnly && !checkXelatex()) {
  console.error(
    'Error: xelatex not found in PATH.\n' +
    'Install TeX Live / MiKTeX, or use --latex-only to generate a .tex file instead.'
  );
  process.exit(1);
}

// ── Parse CSV ────────────────────────────────────────────────────────────────
const data = parseCSV(argv.input);
const columns = getColumns(data);

if (!columns.includes(argv.x)) {
  console.error(`Error: X column "${argv.x}" not found. Available columns: ${columns.join(', ')}`);
  process.exit(1);
}

// ── LaTeX Transform Mapping ──────────────────────────────────────────────────
const LATEX_TRANSFORMS = {
  id:    (n) => n,
  ln:    (n) => `\\ln ${n}`,
  log10: (n) => `\\log_{10} ${n}`,
  sqrt:  (n) => `\\sqrt{${n}}`,
  sq:    (n) => `${n}^2`,
  diff:  (n) => `\\Delta ${n}`,
};

const formatMath = (name, func) => (LATEX_TRANSFORMS[func] || ((n) => `\\${func} ${n}`))(name);

// ── Build series ─────────────────────────────────────────────────────────────
const series = argv.y.map((yKey, index) => {
  if (!columns.includes(yKey)) {
    console.error(`Error: Y column "${yKey}" not found. Available columns: ${columns.join(', ')}`);
    process.exit(1);
  }

  const points = transformData(data, argv.x, yKey, argv.xfunc, argv.yfunc);
  if (points.length === 0) {
    console.error(`Error: No valid data points for series "${yKey}" after applying transforms.`);
    process.exit(1);
  }

  let autoLegend = yKey;
  if (argv.xfunc !== 'id' || argv.yfunc !== 'id') {
    autoLegend = `$${formatMath(yKey, argv.yfunc)} = f(${formatMath(argv.x, argv.xfunc)})$`;
  }

  return {
    name:   yKey,
    legend: (argv.legend && argv.legend[index]) || autoLegend,
    points,
    color:  getSeriesColor(index),
  };
});

// ── Smart Axis Labels ────────────────────────────────────────────────────────
const formatLabel = (base, unit) => {
  if (!unit) return base;
  const unitPart = (unit.includes('$') || unit.includes('\\')) ? unit : `\\text{${unit}}`;
  return `${base}, ${unitPart}`;
};

const xlabel = argv.xlabel !== 'X' 
  ? argv.xlabel 
  : `$${formatLabel(formatMath(argv.x, argv.xfunc), argv.xunit)}$`;

const ylabel = argv.ylabel !== 'Y' 
  ? argv.ylabel 
  : `$${formatLabel(formatMath(series[0].name, argv.yfunc), argv.yunit)}$`;

// ── Legend position ───────────────────────────────────────────────────────────
const legendPos = argv.legendPos === 'auto'
  ? getSmartLegendPos(series[0].points)
  : argv.legendPos;

// ── Generate LaTeX ────────────────────────────────────────────────────────────
const latexCode = generateLatexTemplate({
  series,
  title:              argv.title,
  xlabel,
  ylabel,
  legendPos,
  caption:            argv.caption || argv.title,
  pointLabelTemplate: argv.labels ? argv.pointLabel : '',
  xName:              argv.x,
  xfunc:              argv.xfunc,
  yfunc:              argv.yfunc,
  lang:               argv.lang,
  font:               argv.font,
  smooth:             argv.smooth,
  fit:                argv.fit,
});

// ── Output ────────────────────────────────────────────────────────────────────
try {
  compileLatex(latexCode, argv.output);
  console.log(`PDF saved to: ${argv.output}`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
