import type { IrrigationType, PlotTaskTemplateDto } from "@garden/shared";

const GENERAL_TEMPLATES: PlotTaskTemplateDto[] = [
  { type: "PEST_SCOUT", title: "Scout for pests and disease", intervalDays: 7, notes: "Inspect leaf undersides, new growth, stems, and soil surface.", recommendedFor: "ALL" },
  { type: "WEED", title: "Remove weeds", intervalDays: 7, notes: "Remove weeds before flowering and note recurring problem areas.", recommendedFor: "ALL" },
  { type: "MULCH_CHECK", title: "Check mulch depth", intervalDays: 30, notes: "Top up thin areas while keeping mulch clear of stems.", recommendedFor: "ALL" },
  { type: "SOIL_TEST", title: "Check soil pH and fertility", intervalDays: 90, notes: "Record pH and any nutrient amendments before applying them.", recommendedFor: "ALL" },
];

const IRRIGATION_TEMPLATES: Record<IrrigationType, PlotTaskTemplateDto[]> = {
  DRIP: [
    { type: "DRIP_INSPECTION", title: "Inspect drip emitters and leaks", intervalDays: 7, notes: "Walk the line while running and check every emitter for clogging or leaks.", recommendedFor: "DRIP" },
    { type: "FILTER_CLEAN", title: "Clean drip filter", intervalDays: 14, notes: "Clean the filter and record sediment buildup.", recommendedFor: "DRIP" },
    { type: "DRIP_FLUSH", title: "Flush drip lines", intervalDays: 30, notes: "Open line ends and flush until the water runs clear.", recommendedFor: "DRIP" },
  ],
  SPRINKLER: [
    { type: "SPRINKLER_INSPECTION", title: "Inspect sprinkler coverage", intervalDays: 14, notes: "Check blocked nozzles, overspray, pressure, and dry spots.", recommendedFor: "SPRINKLER" },
  ],
  MANUAL: [
    { type: "CHECK_MOISTURE", title: "Check root-zone moisture", intervalDays: 2, notes: "Check below the soil surface before deciding how much to water.", recommendedFor: "MANUAL" },
  ],
  NONE: [],
};

export function getRecommendedTemplates(irrigationType: IrrigationType): PlotTaskTemplateDto[] {
  return [...IRRIGATION_TEMPLATES[irrigationType], ...GENERAL_TEMPLATES];
}
