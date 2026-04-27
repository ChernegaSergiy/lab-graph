export const transforms = {
  id: (x) => Number(x),
  ln: (x) => Math.log(Number(x)),
  log10: (x) => Math.log10(Number(x)),
  sqrt: (x) => Math.sqrt(Number(x)),
  sq: (x) => Math.pow(Number(x), 2),
  diff: (arr, key) => {
    return arr.map((val, i) => {
      if (i === 0) return NaN;
      return Number(val[key]) - Number(arr[i - 1][key]);
    });
  },
};

export function transformData(data, xKey, yKey, xFunc, yFunc) {
  const xTransform = transforms[xFunc] || transforms.id;
  const yTransform = transforms[yFunc] || transforms.id;

  return data.map((row) => ({
    x: xTransform(row[xKey]),
    y: yTransform(row[yKey]),
    originalX: row[xKey],
    originalY: row[yKey],
  })).filter(p => !isNaN(p.x) && !isNaN(p.y));
}

export function getSeriesColor(index) {
  const colors = ['red', 'blue', 'green', 'orange', 'purple', 'cyan', 'magenta'];
  return colors[index % colors.length];
}

export function formatCoord(value, decimals = 4) {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  return value.toFixed(decimals);
}

export function calculateAxisLimits(points) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);

  return {
    xmin: Math.min(...xs),
    xmax: Math.max(...xs),
    ymin: Math.min(...ys),
    ymax: Math.max(...ys),
  };
}

export function getSmartLegendPos(points) {
  if (points.length === 0) return 'north east';

  const limits = calculateAxisLimits(points);
  const midX = (limits.xmin + limits.xmax) / 2;
  const midY = (limits.ymin + limits.ymax) / 2;

  const counts = {
    'north east': 0, // Top-right
    'north west': 0, // Top-left
    'south east': 0, // Bottom-right
    'south west': 0  // Bottom-left
  };

  points.forEach(p => {
    if (p.x >= midX && p.y >= midY) counts['north east']++;
    else if (p.x < midX && p.y >= midY) counts['north west']++;
    else if (p.x >= midX && p.y < midY) counts['south east']++;
    else counts['south west']++;
  });

  // Знаходимо квадрант з мінімальною кількістю точок
  return Object.keys(counts).reduce((a, b) => counts[a] <= counts[b] ? a : b);
}