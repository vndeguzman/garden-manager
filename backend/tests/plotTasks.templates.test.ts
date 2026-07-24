import { describe, expect, it } from "vitest";
import { getRecommendedTemplates } from "../src/modules/plotTasks/plotTasks.templates.js";

describe("plot task templates", () => {
  it("adds drip-system maintenance for drip-irrigated plots", () => {
    const types = getRecommendedTemplates("DRIP").map((template) => template.type);
    expect(types).toContain("DRIP_INSPECTION");
    expect(types).toContain("FILTER_CLEAN");
    expect(types).toContain("DRIP_FLUSH");
  });

  it("does not add drip-system maintenance to manual plots", () => {
    const types = getRecommendedTemplates("MANUAL").map((template) => template.type);
    expect(types).not.toContain("DRIP_FLUSH");
    expect(types).toContain("CHECK_MOISTURE");
  });

  it("always includes general preventive work", () => {
    const types = getRecommendedTemplates("NONE").map((template) => template.type);
    expect(types).toEqual(expect.arrayContaining(["PEST_SCOUT", "WEED", "MULCH_CHECK", "SOIL_TEST"]));
  });
});
