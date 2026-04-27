import { formatCoord, calculateAxisLimits } from './math.js';

export function generateLatexTemplate({ series, title, xlabel, ylabel, legendPos, caption, pointLabelTemplate, lang, font, smooth }) {
  // Об'єднуємо всі точки для розрахунку меж осей
  const allPoints = series.flatMap(s => s.points);
  const limits = calculateAxisLimits(allPoints);
  const xPadding = (limits.xmax - limits.xmin) * 0.1;
  const yPadding = (limits.ymax - limits.ymin) * 0.1;
  const decimalSep = (lang === 'ukrainian' || lang === 'russian') ? '{,}' : '.';

  const plots = series.map((s, sIdx) => {
    const coords = s.points.map((p) => `(${formatCoord(p.x)}, ${formatCoord(p.y)})`).join(' ');
    
    const plotOptions = [
      smooth && 'smooth',
      smooth && 'tension=0.5',
      'thick',
      s.color,
      'mark=*',
      `mark options={fill=white, draw=${s.color}}`,
      'mark size=2pt'
    ].filter(Boolean).join(', ');

    const labels = s.points.length <= 10
      ? s.points.map((p, pIdx) => {
          const xVal = String(p.originalX).replace('.', decimalSep);
          const yVal = String(p.originalY).replace('.', decimalSep);
          const labelText = pointLabelTemplate.replace('{x}', xVal).replace('{y}', yVal);
          // Змінюємо положення підпису, щоб вони не накладалися (північ/південь)
          const anchor = pIdx % 2 === 0 ? 'south west' : 'north east';
          return `\\node[anchor=${anchor}, font=\\tiny, text=${s.color}] at (axis cs:${formatCoord(p.x)}, ${formatCoord(p.y)}) {${labelText}};`;
        }).join('\n        ')
      : '';

    return `
        \\addplot [${plotOptions}] coordinates { ${coords} };
        \\addlegendentry{${s.legend}}
        ${labels}
    `;
  }).join('\n');

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
        ${plots}
        \\end{axis}
    \\end{tikzpicture}
    ${caption ? `\\caption*{${caption}}` : ''}
\\end{figure}
\\end{document}`;
}
