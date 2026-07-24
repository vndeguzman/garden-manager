import type { ElevationPointDto } from "@garden/shared";

export interface ContourSegment {
  level: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function interpolate(
  pointA: { x: number; y: number; value: number },
  pointB: { x: number; y: number; value: number },
  level: number,
): { x: number; y: number } {
  const span = pointB.value - pointA.value;
  const ratio = span === 0 ? 0.5 : Math.max(0, Math.min(1, (level - pointA.value) / span));
  return {
    x: pointA.x + (pointB.x - pointA.x) * ratio,
    y: pointA.y + (pointB.y - pointA.y) * ratio,
  };
}

export function estimateElevation(
  points: ElevationPointDto[],
  x: number,
  y: number,
): number | null {
  if (points.length === 0) return null;
  let weightedValue = 0;
  let totalWeight = 0;
  for (const point of points) {
    const distanceSquared = (point.x - x) ** 2 + (point.y - y) ** 2;
    if (distanceSquared < 0.000001) return point.elevation;
    const weight = 1 / distanceSquared;
    weightedValue += point.elevation * weight;
    totalWeight += weight;
  }
  return weightedValue / totalWeight;
}

export function generateContourSegments(
  points: ElevationPointDto[],
  width: number,
  height: number,
  interval: number,
  columns = 24,
  rows = 16,
): ContourSegment[] {
  if (points.length < 3 || interval <= 0) return [];
  const minimum = Math.min(...points.map((point) => point.elevation));
  const maximum = Math.max(...points.map((point) => point.elevation));
  if (minimum === maximum) return [];

  const firstLevel = Math.ceil(minimum / interval) * interval;
  const levels: number[] = [];
  for (let level = firstLevel; level <= maximum; level += interval) {
    levels.push(Number(level.toFixed(6)));
  }

  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const grid = Array.from({ length: rows + 1 }, (_, row) =>
    Array.from({ length: columns + 1 }, (_, column) => ({
      x: column * cellWidth,
      y: row * cellHeight,
      value: estimateElevation(points, column * cellWidth, row * cellHeight) ?? minimum,
    })),
  );

  const segments: ContourSegment[] = [];
  for (const level of levels) {
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const topLeft = grid[row]?.[column];
        const topRight = grid[row]?.[column + 1];
        const bottomRight = grid[row + 1]?.[column + 1];
        const bottomLeft = grid[row + 1]?.[column];
        if (!topLeft || !topRight || !bottomRight || !bottomLeft) continue;

        const crossings: Array<{ x: number; y: number }> = [];
        const edges = [
          [topLeft, topRight],
          [topRight, bottomRight],
          [bottomRight, bottomLeft],
          [bottomLeft, topLeft],
        ] as const;
        for (const [pointA, pointB] of edges) {
          const crosses =
            (pointA.value < level && pointB.value >= level) ||
            (pointB.value < level && pointA.value >= level);
          if (crosses) crossings.push(interpolate(pointA, pointB, level));
        }
        if (crossings.length === 2) {
          segments.push({
            level,
            x1: crossings[0]!.x,
            y1: crossings[0]!.y,
            x2: crossings[1]!.x,
            y2: crossings[1]!.y,
          });
        } else if (crossings.length === 4) {
          segments.push({
            level,
            x1: crossings[0]!.x,
            y1: crossings[0]!.y,
            x2: crossings[1]!.x,
            y2: crossings[1]!.y,
          });
          segments.push({
            level,
            x1: crossings[2]!.x,
            y1: crossings[2]!.y,
            x2: crossings[3]!.x,
            y2: crossings[3]!.y,
          });
        }
      }
    }
  }
  return segments;
}

export function elevationHeadPressureKpa(
  sourceElevationMeters: number,
  destinationElevationMeters: number,
): number {
  return (sourceElevationMeters - destinationElevationMeters) * 9.80665;
}
