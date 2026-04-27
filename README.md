# lab-graph

[![License: CSSM Unlimited License v2.0](https://img.shields.io/badge/License-CSSM%20Unlimited%20License%20v2.0-blue.svg?logo=opensourceinitiative)](LICENSE)

A CLI tool that generates publication-ready PDF graphs from CSV data via LaTeX/pgfplots. Designed for lab reports and scientific work.

## Features

- **CSV Input**: Reads any CSV file with named columns — no code required.
- **Multiple Series**: Plot several Y columns on one graph with automatic color assignment.
- **Data Transforms**: Built-in transforms for X and Y axes: `id`, `ln`, `log10`, `sqrt`, `sq`, `diff`.
- **Linear Regression**: Optional least-squares fit line with equation and R² value rendered directly on the plot (`--fit linear`).
- **Smart Legend Placement**: Automatically places the legend in the least-crowded quadrant.
- **Point Labels**: Configurable per-point labels with `{x}` and `{y}` placeholders.
- **Smooth Curves**: Optional curve smoothing via pgfplots tension splines (`--smooth`).
- **Localization**: babel language and fontspec font are fully configurable.
- **PDF Output**: Compiles directly to PDF via XeLaTeX — no intermediate steps.

## Technologies Used

- **Node.js**: Runtime
- **pgfplots / XeLaTeX**: Graph rendering and PDF compilation
- **csv** (`csv/sync`): CSV parsing
- **yargs**: CLI argument handling

## Prerequisites

- Node.js ≥ 18
- A TeX Live or MiKTeX installation with `xelatex` available in PATH

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/ChernegaSergiy/lab-graph.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run against your CSV:
   ```bash
   node src/index.js -i data.csv -x l -y T --title "Pendulum Period" --xlabel "l, cm" --ylabel "T, s" -o graph.pdf
   ```

## CSV Format

The first row must be a header with column names. Example (`examples/data.csv`):

```
l,T
20.0,1.183
32.4,1.333
40.0,1.485
52.1,1.693
```

## Usage

```
Usage: lab-graph -i <csv> -x <col> -y <col> [options]

Input / Output:
  -i, --input    Path to CSV file                          [string] [required]
  -o, --output   Output PDF path               [string] [default: "graph.pdf"]

Columns & Transforms:
  -x             X column name                             [string] [required]
  -y             Y column name(s)                           [array] [required]
  --xfunc        Transform for X values
                 [choices: id, ln, log10, sqrt, sq, diff]  [default: "id"]
  --yfunc        Transform for Y values
                 [choices: id, ln, log10, sqrt, sq, diff]  [default: "id"]

Appearance:
  --smooth       Draw smooth curves                  [boolean] [default: false]
  --fit          Regression line: none | linear       [string] [default: "none"]
  --title        Chart title                        [string] [default: "Graph"]
  --xlabel       X-axis label                           [string] [default: "X"]
  --ylabel       Y-axis label                           [string] [default: "Y"]
  --legend       Legend labels for each Y series                       [array]
  --legend-pos   Legend position (auto = smart placement)
                 [choices: auto, north east, north west, south east,
                  south west, outer north east]          [default: "auto"]
  --caption      Figure caption (defaults to title)                   [string]
  --point-label  Label template. Placeholders: {x}, {y}
                 [string] [default: "$x = {x},\\; y = {y}$"]
  --lang         babel language                  [string] [default: "ukrainian"]
  --font         Main font (fontspec name)    [string] [default: "DejaVu Serif"]
```

## Examples

**Basic plot:**
```bash
node src/index.js -i examples/data.csv -x l -y T \
  --xlabel "l, cm" --ylabel "T, s" --title "Pendulum"
```

**Log-log transform with regression:**
```bash
node src/index.js -i examples/data.csv -x l -y T \
  --xfunc ln --yfunc ln --fit linear \
  --xlabel "ln(l)" --ylabel "ln(T)" --title "Pendulum (log-log)"
```

**Multiple series:**
```bash
node src/index.js -i data.csv -x t -y v1 v2 v3 \
  --legend "Run 1" "Run 2" "Run 3" --title "Velocity Comparison"
```

## Contributing

Contributions are welcome and appreciated! Here's how you can contribute:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please make sure to adhere to the existing coding style.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
