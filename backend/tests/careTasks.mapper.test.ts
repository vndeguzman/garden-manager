import { describe, expect, it } from "vitest";
import { toPrismaCreateData } from "../src/modules/careTasks/careTasks.mapper.js";

describe("toPrismaCreateData", () => {
  it("keeps only waterAmountLiters populated for WATER tasks", () => {
    const result = toPrismaCreateData({
      type: "WATER",
      plantId: "plant-1",
      intervalDays: 2,
      waterAmountLiters: 4,
    });
    expect(result).toMatchObject({
      type: "WATER",
      waterAmountLiters: 4,
    });
    expect(result.fertilizerName).toBeUndefined();
    expect(result.method).toBeUndefined();
  });

  it("keeps only fertilizerName populated for FERTILIZE tasks", () => {
    const result = toPrismaCreateData({
      type: "FERTILIZE",
      plantId: "plant-1",
      intervalDays: 14,
      fertilizerName: "Chelated iron",
    });
    expect(result).toMatchObject({
      type: "FERTILIZE",
      fertilizerName: "Chelated iron",
    });
    expect(result.waterAmountLiters).toBeUndefined();
    expect(result.method).toBeUndefined();
  });

  it("leaves all type-specific metadata columns empty for PRUNE tasks", () => {
    const result = toPrismaCreateData({
      type: "PRUNE",
      plantId: "plant-1",
      intervalDays: 7,
    });
    expect(result.waterAmountLiters).toBeUndefined();
    expect(result.fertilizerName).toBeUndefined();
    expect(result.method).toBeUndefined();
  });
});
