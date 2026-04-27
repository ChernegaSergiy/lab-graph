import { formatCoord, calculateAxisLimits } from './math.js';

export function generateLatexTemplate({ points, title, xlabel, ylabel, legend, legendPos, caption, pointLabelTemplate, lang, font, smooth }) {
  const limits = calculateAxisLimits(points);
  const xPadding = (limits.xmax - limits.xmin) * 0.1;
  const yPadding = (limits.ymax - limits.ymin) * 0.1;
  const decimalSep = (lang === 'ukrainian' || lang === 'russian') ? '{,}' : '.';

  const coords = points.map((p) => `(${formatCoord(p.x)}, ${formatCoord(p.y)})`).join(' ');

  const labels = points.length <= 15
    ? points.map((p) => {
        const xVal = String(p.originalX).replace('.', decimalSep);
        const yVal = String(p.originalY).replace('.', decimalSep);
        const labelText = pointLabelTemplate
          .replace('{x}', xVal)
          .replace('{y}', yVal);
        return `\\node[anchor=south west, font=\\small] at (axis cs:${formatCoord(p.x)}, ${formatCoord(p.y)}) {${labelText}};`;
      }).join('\n        ')
    : '';

  const plotOptions = [
    smooth && 'smooth',
    smooth && 'tension=0.5',
    'thick',
    'red',
    'mark=*',
    'mark options={fill=white, draw=red}',
    'mark size=2pt'
  ].filter(Boolean).join(', ');

  const captionLine = caption ? `\\caption*{${caption}}` : '';

  return `\\documentclass{article}
\\usepackage[a5paper, landscape, margin=1.5cm]{geometry}
\\usepackage{pgfplots}
\\usepackage{fontspec}
\\usepackage{amsmath}
\\usepackage{caption}
\\usepackage[${lang}]{babel}
\\setmainfont{${font}}
\\pgfplotsset{compat=1.18, every axis plot/.append style={line join=round, line cap=round}}
\\pagestyle{empty}
\\begin{document}
\\begin{figure}[htbp]
    \\centering
    \\begin{tikzpicture}
        \\begin{axis}[
            title={${title}},
            xlabel={${xlabel}},
            ylabel={${ylabel}},
            grid=both,
            grid style={line width=.1pt, draw=gray!20},
            major grid style={line width=.2pt, draw=gray!50},
            legend pos=${legendPos},
            width=\\textwidth,
            height=0.85\\textheight,
            xmin=${formatCoord(limits.xmin - xPadding)}, xmax=${formatCoord(limits.xmax + xPadding)},
            ymin=${formatCoord(limits.ymin - yPadding)}, ymax=${formatCoord(limits.ymax + yPadding)},
        ]
        \\addplot [${plotOptions}] coordinates { ${coords} };
        \\addlegendentry{${legend}}
        ${labels}
        \\end{axis}
    \\end{tikzpicture}
    ${captionLine}
\\end{figure}
\\end{document}`;
}
