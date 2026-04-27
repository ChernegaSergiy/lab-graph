export const transforms = {
  id:    (x) => Number(x),
  ln:    (x) => Math.log(Number(x)),
  log10: (x) => Math.log10(Number(x)),
  sqrt:  (x) => Math.sqrt(Number(x)),
  sq:    (x) => Math.pow(Number(x), 2),
};

/**
 * Applies a transform function to every row and returns {x, y, originalX, originalY}.
 * The special 'diff' transform computes finite differences across rows.
 */
export function transformData(data, xKey, yKey, xFunc, yFunc) {
  const xTransform = transforms[xFunc] || transforms.id;
  const yTransform = transforms[yFunc] || transforms.id;

  let rows = data.map((row, i) => {
    let xVal = xTransform(row[xKey]);
    let yVal;

    if (yFunc === 'diff') {
      yVal = i === 0 ? NaN : Number(row[yKey]) - Number(data[i - 1][yKey]);
    } else {
      yVal = yTransform(row[yKey]);
    }

    if (xFunc === 'diff') {
      xVal = i === 0 ? NaN : Number(row[xKey]) - Number(data[i - 1][xKey]);
    }

    return {
      x: xVal,
      y: yVal,
      originalX: row[xKey],
      originalY: row[yKey],
    };
  });

  return rows.filter(p => !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y));
}

/**
 * Linear regression via Ordinary Least Squares.
 * Returns { slope, intercept, r2 } or null if not enough points.
 */
export function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;

  const sumX  = points.reduce((s, p) => s + p.x, 0);
  const sumY  = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const slope     = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const meanY  = sumY / n;
  const ssTot  = points.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0);
  const ssRes  = points.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
  const r2     = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

export function getSeriesColor(index) {
  const colors = ['red', 'blue', 'green!60!black', 'orange!80!black', 'violet', 'cyan!70!black', 'magenta!80!black'];
  return colors[index % colors.length];
}

export function formatCoord(value, decimals = 4) {
  if (typeof value !== 'number' || !isFinite(value)) return '0';
  return value.toFixed(decimals);
}

/**
 * Automatically picks the number of decimal places needed to distinguish
 * adjacent values (min 2, max 6).
 */
export function autoDecimals(points) {
  if (points.length < 2) return 4;
  const diffs = [];
  const sorted = [...points].sort((a, b) => a.x - b.x);
  for (let i = 1; i < sorted.length; i++) {
    const d = Math.abs(sorted[i].x - sorted[i - 1].x);
    if (d > 0) diffs.push(d);
  }
  if (diffs.length === 0) return 4;
  const minDiff = Math.min(...diffs);
  const dec = Math.max(2, Math.min(6, Math.ceil(-Math.log10(minDiff)) + 1));
  return dec;
}

export function calculateAxisLimits(points) {
  if (!points || points.length === 0) {
    return { xmin: 0, xmax: 1, ymin: 0, ymax: 1 };
  }

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const ymin = Math.min(...ys), ymax = Math.max(...ys);

  return {
    xmin: isFinite(xmin) ? xmin : 0,
    xmax: isFinite(xmax) ? xmax : 1,
    ymin: isFinite(ymin) ? ymin : 0,
    ymax: isFinite(ymax) ? ymax : 1,
  };
}

/**
 * Chooses the legend quadrant with the fewest data points (most free space).
 * Falls back to 'north east' for ties.
 */
export function getSmartLegendPos(points) {
  if (points.length === 0) return 'north east';

  const limits = calculateAxisLimits(points);
  const midX = (limits.xmin + limits.xmax) / 2;
  const midY = (limits.ymin + limits.ymax) / 2;

  const counts = { 'north east': 0, 'north west': 0, 'south east': 0, 'south west': 0 };

  points.forEach(p => {
    if      (p.x >= midX && p.y >= midY) counts['north east']++;
    else if (p.x <  midX && p.y >= midY) counts['north west']++;
    else if (p.x >= midX && p.y <  midY) counts['south east']++;
    else                                 counts['south west']++;
  });

  return Object.entries(counts).reduce(
    (best, [pos, cnt]) => cnt < best.cnt ? { pos, cnt } : best,
    { pos: 'north east', cnt: Infinity }
  ).pos;
}
