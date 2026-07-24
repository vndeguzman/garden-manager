import { describe, expect, it } from "vitest";
import type { ElevationPointDto } from "@garden/shared";
import {
  elevationHeadPressureKpa,
  estimateElevation,
  generateContourSegments,
} from "../lib/contours";

function point(x: number, y: number, elevation: number): ElevationPointDto {
  return {
    id: `${x}-${y}`,
    gardenMapId: "map",
    x,
    y,
    elevation,
    unit: "m",
    datum: "RELATIVE",
    source: "USER_ESTIMATE",
    accuracy: null,
    measuredAt: new Date(0).toISOString(),
    confidence: 50,
    notes: null,
  };
}

describe("terrain helpers", () => {
  it("returns an exact sampled elevation at a known point", () => {
    expect(estimateElevation([point(0, 0, 2), point(10, 0, 1)], 0, 0)).toBe(2);
  });

  it("creates contour segments for a sloped surface", () => {
    const segments = generateContourSegments(
      [point(0, 0, 2), point(10, 0, 1), point(0, 10, 2), point(10, 10, 1)],
      10,
      10,
      0.25,
      8,
      8,
    );
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.some((segment) => segment.level === 1.5)).toBe(true);
  });

  it("converts elevation head to ideal static pressure", () => {
    expect(elevationHeadPressureKpa(3, 1)).toBeCloseTo(19.6133, 3);
  });
});
