import { formatCoord, calculateAxisLimits, linearRegression } from './math.js';

const LATEX_TRANSFORMS = {
  id:    (n) => n,
  ln:    (n) => `\\ln ${n}`,
  log10: (n) => `\\log_{10} ${n}`,
  sqrt:  (n) => `\\sqrt{${n}}`,
  sq:    (n) => `${n}^2`,
  diff:  (n) => `\\Delta ${n}`,
};

const formatMath = (name, func) => (LATEX_TRANSFORMS[func] || ((n) => `\\${func} ${n}`))(name);

export function generateLatexTemplate({
  series,
  title,
  xlabel,
  ylabel,
  legendPos,
  caption,
  pointLabelTemplate,
  xName,
  xfunc,
  yfunc,
  lang,
  font,
  smooth,
  fit,
}) {
  const allPoints = series.flatMap(s => s.points);
  const limits = calculateAxisLimits(allPoints);

  const xRange = limits.xmax - limits.xmin || 1;
  const yRange = limits.ymax - limits.ymin || 1;
  const xPadding = xRange * 0.1;
  const yPadding = yRange * 0.1;

  const xmin = limits.xmin - xPadding;
  const xmax = limits.xmax + xPadding;
  const ymin = limits.ymin - yPadding;
  const ymax = limits.ymax + yPadding;

  const decimalSep = (lang === 'ukrainian' || lang === 'russian') ? '{,}' : '.';

  // Helper to wrap LaTeX commands in math mode if not already wrapped
  const ensureMath = (str) => {
    if (!str) return str;
    // If it contains \ but no $, wrap it. 
    // This is naive but handles things like "\ln T" -> "$\ln T$"
    // For mixed text like "Title \ln T", it's better if user provides $
    if (str.includes('\\') && !str.includes('$')) {
      return `$${str}$`;
    }
    return str;
  };

  const safeTitle = ensureMath(title).replace(/\.$/, '');
  const safeXLabel = ensureMath(xlabel);
  const safeYLabel = ensureMath(ylabel);
  const safeCaption = ensureMath(caption);

  // ── Data series ──────────────────────────────────────────────────────────────
  const plots = series.map((s) => {
    const coords = s.points
      .map(p => `(${formatCoord(p.x)}, ${formatCoord(p.y)})`)
      .join(' ');

    const plotOptions = [
      smooth ? 'smooth' : null,
      smooth ? 'tension=0.5' : null,
      'thick',
      s.color,
      'mark=*',
      `mark options={fill=white, draw=${s.color}}`,
      'mark size=2pt',
    ].filter(Boolean).join(', ');

    const labels = pointLabelTemplate
      ? s.points.map((p, pIdx) => {
          const xVal = String(p.originalX).replace('.', decimalSep);
          const yVal = String(p.originalY).replace('.', decimalSep);
          const labelText = pointLabelTemplate
            .replace('{xn}', xName)
            .replace('{x}', xVal)
            .replace('{y}', yVal);
          const anchor = pIdx % 2 === 0 ? 'south west' : 'north east';
          return `\\node[anchor=${anchor}, font=\\small, text=black] at (axis cs:${formatCoord(p.x)}, ${formatCoord(p.y)}) {${labelText}};`;
        }).join('\n        ')
      : '';

    return `
        \\addplot [${plotOptions}] coordinates { ${coords} };
        \\addlegendentry{${s.legend}}
        ${labels}`;
  }).join('\n');

  // ── Regression lines ─────────────────────────────────────────────────────────
  let regressionPlots = '';
  if (fit === 'linear') {
    regressionPlots = series.map((s) => {
      const reg = linearRegression(s.points);
      if (!reg) return '';

      const x1 = xmin;
      const x2 = xmax;
      const y1 = reg.slope * x1 + reg.intercept;
      const y2 = reg.slope * x2 + reg.intercept;

      const slopeStr     = formatCoord(reg.slope, 4);
      const interceptStr = formatCoord(Math.abs(reg.intercept), 4);
      const sign         = reg.intercept >= 0 ? '+' : '-';
      const r2Str        = reg.r2.toFixed(4);

      const xEq = formatMath(xName, xfunc);
      const yEq = formatMath(s.name, yfunc);

      const eqLabel = `$${yEq} = ${slopeStr}${xEq} ${sign} ${interceptStr},\\; R^2 = ${r2Str}$`;

      return `
        \\addplot [dashed, thick, ${s.color}, opacity=0.7] coordinates {
          (${formatCoord(x1)}, ${formatCoord(y1)}) (${formatCoord(x2)}, ${formatCoord(y2)})
        };
        \\addlegendentry{${eqLabel}}`;
    }).join('\n');
  }

  return `\\documentclass{article}
\\usepackage[a5paper, landscape, margin=1.5cm]{geometry}
\\usepackage{pgfplots}
\\usepackage{fontspec}
\\usepackage{amsmath}
\\usepackage{caption}
\\usepackage[${lang}]{babel}
\\setmainfont{${font}}
\\pgfplotsset{compat=1.18, every axis plot/.append style={line join=round, line cap=round}}
\\addto\\captionsukrainian{\\renewcommand{\\figurename}{Рис.}}
\\pagestyle{empty}
\\begin{document}
\\begin{figure}[htbp]
    \\centering
    \\begin{tikzpicture}
        \\begin{axis}[
            title={${safeTitle}},
            xlabel={${safeXLabel}},
            ylabel={${safeYLabel}},
            grid=both,
            grid style={line width=.1pt, draw=gray!20},
            major grid style={line width=.2pt, draw=gray!50},
            legend pos=${legendPos},
            legend style={font=\\small},
            width=\\textwidth,
            height=0.85\\textheight,
            xmin=${formatCoord(xmin)}, xmax=${formatCoord(xmax)},
            ymin=${formatCoord(ymin)}, ymax=${formatCoord(ymax)},
        ]
        ${plots}
        ${regressionPlots}
        \\end{axis}
    \\end{tikzpicture}
    ${safeCaption ? `\\caption{${safeCaption}}` : ''}
\\end{figure}
\\end{document}`;
}
