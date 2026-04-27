export const transforms = {
  id: (x) => x,
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

  if (xFunc === 'diff' || yFunc === 'diff') {
    const xDiff = xFunc === 'diff' ? transforms.diff(data, xKey) : data.map(row => Number(row[xKey]));
    const yDiff = yFunc === 'diff' ? transforms.diff(data, yKey) : data.map(row => Number(row[yKey]));

    return data.map((row, i) => ({
      x: xDiff[i],
      y: yDiff[i],
      originalX: row[xKey],
      originalY: row[yKey],
    })).filter(point => !isNaN(point.x) && !isNaN(point.y));
  }

  return data.map((row) => ({
    x: xTransform(row[xKey]),
    y: yTransform(row[yKey]),
    originalX: row[xKey],
    originalY: row[yKey],
  }));
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