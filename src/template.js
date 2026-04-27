import { formatCoord, calculateAxisLimits } from './math.js';

export function generateLatexTemplate({ points, title, xlabel, ylabel, smooth }) {
  const limits = calculateAxisLimits(points);

  const xPadding = (limits.xmax - limits.xmin) * 0.1;
  const yPadding = (limits.ymax - limits.ymin) * 0.1;

  const coords = points
    .map((p) => `            (${formatCoord(p.x)}, ${formatCoord(p.y)})`)
    .join('\n');

  const labels = points
    .map(
      (p) => {
        const xVal = String(p.originalX).replace('.', '{,}');
        const yVal = String(p.originalY).replace('.', '{,}');
        return `        \\node[anchor=south west, font=\\small] at (axis cs:${formatCoord(p.x)}, ${formatCoord(p.y)})\n            {$x = ${xVal}$, $y = ${yVal}$};`;
      }
    )
    .join('\n');

  const smoothOption = smooth ? 'smooth,\n            tension=0.5,' : '';

  return `\\documentclass{article}
\\usepackage[a5paper, landscape, margin=1.5cm]{geometry}
\\usepackage{pgfplots}
\\usepackage{fontspec}
\\usepackage{amsmath}
\\usepackage[ukrainian]{babel}

\\setmainfont{DejaVu Serif}
\\pgfplotsset{
    compat=1.18,
    every axis plot/.append style={line join=round, line cap=round}
}
\\pagestyle{empty}

\\begin{document}

\\begin{figure}[htbp]
    \\centering
    \\begin{tikzpicture}
        \\begin{axis}[
            title={${title || 'Залежність'}},
            xlabel={${xlabel || 'X'}},
            ylabel={${ylabel || 'Y'}},
            grid=both,
            grid style={line width=.1pt, draw=gray!20},
            major grid style={line width=.2pt, draw=gray!50},
            legend pos=north west,
            width=\\textwidth,
            height=0.85\\textheight,
            xmin=${formatCoord(limits.xmin - xPadding)}, xmax=${formatCoord(limits.xmax + xPadding)},
            ymin=${formatCoord(limits.ymin - yPadding)}, ymax=${formatCoord(limits.ymax + yPadding)},
        ]

        \\addplot+[
            ${smoothOption}
            mark=*,
            mark options={fill=white, draw=red},
            mark size=3.5pt,
            thick,
            red
        ] coordinates {
${coords}
        };
        \\addlegendentry{${title || 'f(x)'}}

${labels}

        \\end{axis}
    \\end{tikzpicture}
    \\caption{${title || 'Графік залежності'}.}
\\end{figure}

\\end{document}
`;
}