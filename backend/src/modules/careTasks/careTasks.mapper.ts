import type { CareTaskType, CreateCareTaskInput } from "@garden/shared";

/** Flattens a narrowed union member down to the nullable columns Prisma expects. */
export function toPrismaCreateData(input: CreateCareTaskInput): {
  type: CareTaskType;
  intervalDays: number;
  notes?: string;
  waterAmountLiters?: number;
  waterIntakeMM?: number;
  fertilizerName?: string;
  method?: string;
} {
  const base = {
    type: input.type,
    intervalDays: input.intervalDays,
    ...(input.notes ? { notes: input.notes } : {}),
  };

  // Exhaustive switch: if a new CareTaskType is ever added to the union in
  // shared/src/enums.ts without a matching case here, TypeScript's
  // never-check on the `default` branch fails the build — the same
  // exhaustiveness pattern from the conditional-types exercises, guarding
  // real application logic instead of a toy type.
  switch (input.type) {
    case "WATER":
      return { ...base, waterAmountLiters: input.waterAmountLiters };
    case "FERTILIZE":
      return { ...base, fertilizerName: input.fertilizerName };
    case "PEST_CONTROL":
      return { ...base, method: input.method };
    case "DRIP_MAINTENANCE":
      return {
        ...base,
        ...(input.waterIntakeMM !== undefined ? { waterIntakeMM: input.waterIntakeMM } : {}),
        ...(input.method ? { method: input.method } : {}),
      };
    case "SOIL_TEST":
    case "POLLINATE":
      return { ...base, ...(input.method ? { method: input.method } : {}) };
    case "PRUNE":
    case "HARVEST":
    case "OBSERVE":
    case "WEED":
    case "MULCH":
    case "TRANSPLANT":
    case "TRELLIS":
      return base;
    default: {
      const _exhaustive: never = input;
      throw new Error(`Unhandled care task type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
