import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.plotTask.deleteMany();
  await prisma.plotMedia.deleteMany();
  await prisma.plantMedia.deleteMany();
  await prisma.observationMedia.deleteMany();
  await prisma.careTaskMedia.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.careTask.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.plot.deleteMany();
  await prisma.garden.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);
  const owner = await prisma.user.create({
    data: { email: "vic@example.com", name: "Vic", passwordHash, role: "OWNER" },
  });

  const garden = await prisma.garden.create({
    data: { name: "Backyard Garden", location: "Gapan, Central Luzon", ownerId: owner.id },
  });

  const dripPlot = await prisma.plot.create({
    data: {
      gardenId: garden.id,
      name: "Drip Bed A",
      areaSqMeters: 12,
      soilType: "Loam",
      irrigationType: "DRIP",
    },
  });

  const tomato = await prisma.plant.create({
    data: {
      plotId: dripPlot.id,
      species: "Tomato",
      scientificName: "Solanum lycopersicum",
      variety: "Roma",
      plantedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: "FLOWERING",
      positionLabel: "Row A · Plant 1",
      waterRequirement: "Deep, consistent root-zone moisture.",
      sunlightRequirement: "Full sun, 6–8 hours.",
      expectedYieldKg: 4.5,
      expectedHarvestAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    },
  });

  const eggplant = await prisma.plant.create({
    data: {
      plotId: dripPlot.id,
      species: "Eggplant",
      scientificName: "Solanum melongena",
      variety: "Black Beauty",
      plantedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      status: "GROWING",
      positionLabel: "Row A · Plant 2",
      waterRequirement: "Deep and consistent; avoid wet foliage late in the day.",
      sunlightRequirement: "Full sun, 6–8 hours.",
      expectedYieldKg: 3,
    },
  });

  await prisma.careTask.create({
    data: {
      plantId: tomato.id,
      type: "WATER",
      intervalDays: 2,
      waterAmountLiters: 3,
      nextDueAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // overdue
    },
  });

  await prisma.plotTask.createMany({
    data: [
      {
        plotId: dripPlot.id,
        type: "DRIP_INSPECTION",
        title: "Inspect drip emitters and leaks",
        intervalDays: 7,
        nextDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        notes: "Run the line and check every emitter.",
      },
      {
        plotId: dripPlot.id,
        type: "FILTER_CLEAN",
        title: "Clean drip filter",
        intervalDays: 14,
        nextDueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        plotId: dripPlot.id,
        type: "DRIP_FLUSH",
        title: "Flush drip lines",
        intervalDays: 30,
        nextDueAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  await prisma.careTask.create({
    data: {
      plantId: tomato.id,
      type: "FERTILIZE",
      intervalDays: 14,
      fertilizerName: "Chelated iron (foliar)",
      nextDueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.careTask.create({
    data: {
      plantId: eggplant.id,
      type: "PEST_CONTROL",
      intervalDays: 7,
      method: "Neem oil spray",
      nextDueAt: new Date(Date.now() + 10 * 60 * 60 * 1000), // due soon
    },
  });

  await prisma.observation.create({
    data: {
      plantId: tomato.id,
      healthStatus: "DEFICIENCY_SUSPECTED",
      note: "Interveinal chlorosis on lower leaves, consistent with magnesium excess blocking calcium uptake.",
      createdById: owner.id,
    },
  });

  const map = await prisma.gardenMap.create({
    data: {
      gardenId: garden.id,
      width: 30,
      height: 20,
      gridSize: 1,
      showContours: true,
      contourInterval: 0.25,
    },
  });

  const zone = await prisma.plotZone.create({
    data: {
      plotId: dripPlot.id,
      name: "Tomato and eggplant row",
      kind: "ROW",
      description: "Primary drip-fed production row.",
    },
  });

  const factors = await Promise.all(
    [
      ["WATER", "soil_moisture", "Soil moisture", "NUMERIC", ["%"], ["dry", "slightly dry", "moist", "wet"]],
      ["CHEMISTRY", "ph", "Root-zone pH", "NUMERIC", ["pH"], ["acidic", "near neutral", "alkaline"]],
      ["CHEMISTRY", "ec", "Electrical conductivity", "NUMERIC", ["mS/cm"], ["low", "moderate", "high"]],
      ["LIGHT", "lux", "Illuminance", "NUMERIC", ["lux"], ["shade", "partial sun", "full sun"]],
      ["AIR", "wind", "Wind level", "NUMERIC", ["m/s"], ["calm", "light", "moderate", "strong"]],
      ["NUTRIENT", "nitrogen", "Nitrogen status", "ORDINAL", [], ["deficient", "low", "adequate", "high"]],
      ["NUTRIENT", "phosphorus", "Phosphorus status", "ORDINAL", [], ["deficient", "low", "adequate", "high"]],
      ["NUTRIENT", "potassium", "Potassium status", "ORDINAL", [], ["deficient", "low", "adequate", "high"]],
      ["BIOLOGICAL", "beneficial_insects", "Beneficial insect activity", "ORDINAL", [], ["none", "low", "moderate", "high"]],
    ].map(([category, code, name, valueType, supportedUnits, qualitativeScale]) =>
      prisma.factorDefinition.create({
        data: {
          gardenId: garden.id,
          category: category as string,
          code: code as string,
          name: name as string,
          valueType: valueType as "NUMERIC" | "ORDINAL",
          supportedUnits,
          qualitativeScale,
        },
      }),
    ),
  );
  const factorByCode = new Map(factors.map((factor) => [factor.code, factor]));

  const profile = await prisma.requirementProfile.create({
    data: {
      gardenId: garden.id,
      name: "Roma tomato · outdoor loam",
      species: "Tomato",
      scientificName: "Solanum lycopersicum",
      variety: "Roma",
      growingMethod: "Outdoor drip-irrigated bed",
      source: "Illustrative local profile; verify values for the specific cultivar and conditions.",
      confidence: 60,
      requirements: {
        create: [
          {
            factorId: factorByCode.get("soil_moisture")!.id,
            targetMinimum: 55,
            targetMaximum: 75,
            criticalMinimum: 35,
            criticalMaximum: 90,
            preferredUnit: "%",
          },
          {
            factorId: factorByCode.get("ph")!.id,
            targetMinimum: 6,
            targetMaximum: 6.8,
            criticalMinimum: 5,
            criticalMaximum: 8,
            preferredUnit: "pH",
          },
          {
            factorId: factorByCode.get("ec")!.id,
            targetMinimum: 1.5,
            targetMaximum: 3,
            criticalMaximum: 5,
            preferredUnit: "mS/cm",
          },
          {
            factorId: factorByCode.get("lux")!.id,
            targetMinimum: 30000,
            targetMaximum: 80000,
            preferredUnit: "lux",
          },
          {
            factorId: factorByCode.get("wind")!.id,
            targetMinimum: 0,
            targetMaximum: 5,
            criticalMaximum: 12,
            preferredUnit: "m/s",
          },
        ],
      },
    },
  });

  const planting = await prisma.planting.create({
    data: {
      plotId: dripPlot.id,
      zoneId: zone.id,
      requirementProfileId: profile.id,
      name: "Roma tomato batch · July",
      species: "Tomato",
      scientificName: "Solanum lycopersicum",
      variety: "Roma",
      plantedAt: tomato.plantedAt,
      quantity: 1,
      trackingMode: "INDIVIDUAL",
      status: "FLOWERING",
      expectedYieldMin: 3.5,
      expectedYieldMax: 5,
      yieldUnit: "kg",
      expectedHarvestStart: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      expectedHarvestEnd: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.plant.update({ where: { id: tomato.id }, data: { plantingId: planting.id } });

  const [faucet, drum, dripLine, shadeStructure] = await Promise.all([
    prisma.gardenAsset.create({
      data: {
        gardenId: garden.id,
        category: "WATER",
        subtype: "FAUCET",
        name: "North faucet",
        baseElevation: 1.1,
      },
    }),
    prisma.gardenAsset.create({
      data: {
        gardenId: garden.id,
        category: "WATER",
        subtype: "DRUM",
        name: "Rainwater drum",
        capacity: 200,
        capacityUnit: "L",
        baseElevation: 1.4,
        topElevation: 2.3,
      },
    }),
    prisma.gardenAsset.create({
      data: {
        gardenId: garden.id,
        category: "IRRIGATION",
        subtype: "DRIP_LINE",
        name: "Drip line A",
        specifications: { emitterSpacingCm: 30, nominalFlowLph: 2 },
      },
    }),
    prisma.gardenAsset.create({
      data: {
        gardenId: garden.id,
        category: "STRUCTURE",
        subtype: "SHADE_FRAME",
        name: "Afternoon shade frame",
        specifications: { shadePercent: 30 },
      },
    }),
  ]);
  await prisma.assetConnection.createMany({
    data: [
      {
        fromAssetId: faucet.id,
        toAssetId: drum.id,
        connectionType: "FILL_HOSE",
        direction: "FORWARD",
        status: "ACTIVE",
      },
      {
        fromAssetId: drum.id,
        toAssetId: dripLine.id,
        connectionType: "GRAVITY_FEED",
        direction: "FORWARD",
        capacity: 120,
        capacityUnit: "L/h",
        status: "ACTIVE",
      },
    ],
  });

  const handTrowel = await prisma.tool.create({
    data: {
      gardenId: garden.id,
      name: "Hand trowel",
      category: "HAND_TOOL",
      condition: "GOOD",
      replacementValue: 350,
      storageLocation: "Tool rack",
    },
  });
  const phMeter = await prisma.tool.create({
    data: {
      gardenId: garden.id,
      name: "Portable pH/EC meter",
      category: "MEASUREMENT",
      condition: "GOOD",
      replacementValue: 2800,
      storageLocation: "Dry cabinet",
      maintenanceDueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.mapFeature.createMany({
    data: [
      {
        gardenMapId: map.id,
        entityType: "PLOT",
        entityId: dripPlot.id,
        label: dripPlot.name,
        geometryType: "RECTANGLE",
        geometry: { x: 5, y: 5, width: 14, height: 7 },
        style: { fill: "#5f8f54", stroke: "#365a35" },
        zIndex: 1,
      },
      {
        gardenMapId: map.id,
        entityType: "PLANT",
        entityId: tomato.id,
        label: "Roma tomato",
        geometryType: "CIRCLE",
        geometry: { x: 8, y: 7, radius: 0.5 },
        style: { fill: "#d5623c" },
        zIndex: 4,
      },
      {
        gardenMapId: map.id,
        entityType: "PLANT",
        entityId: eggplant.id,
        label: "Eggplant",
        geometryType: "CIRCLE",
        geometry: { x: 11, y: 7, radius: 0.5 },
        style: { fill: "#6d4b8e" },
        zIndex: 4,
      },
      {
        gardenMapId: map.id,
        entityType: "ASSET",
        entityId: drum.id,
        label: drum.name,
        geometryType: "CIRCLE",
        geometry: { x: 3, y: 4, radius: 0.8 },
        style: { fill: "#4888a8" },
        zIndex: 3,
      },
      {
        gardenMapId: map.id,
        entityType: "ASSET",
        entityId: dripLine.id,
        label: dripLine.name,
        geometryType: "LINE",
        geometry: { points: [{ x: 6, y: 7 }, { x: 18, y: 7 }] },
        style: { stroke: "#51a6cc", strokeWidth: 0.18 },
        zIndex: 3,
      },
      {
        gardenMapId: map.id,
        entityType: "ASSET",
        entityId: shadeStructure.id,
        label: shadeStructure.name,
        geometryType: "RECTANGLE",
        geometry: { x: 13, y: 4, width: 8, height: 9 },
        style: { fill: "#807a6c", opacity: 0.2, stroke: "#807a6c" },
        zIndex: 2,
      },
      {
        gardenMapId: map.id,
        entityType: "TOOL",
        entityId: handTrowel.id,
        label: handTrowel.name,
        geometryType: "POINT",
        geometry: { x: 24, y: 4 },
        zIndex: 5,
      },
      {
        gardenMapId: map.id,
        entityType: "TOOL",
        entityId: phMeter.id,
        label: phMeter.name,
        geometryType: "POINT",
        geometry: { x: 25, y: 4 },
        zIndex: 5,
      },
    ],
  });
  await prisma.environmentalInfluence.create({
    data: {
      assetId: shadeStructure.id,
      factorCode: "lux",
      effectType: "DECREASES",
      geometry: { x: 13, y: 4, width: 8, height: 9 },
      magnitude: 30,
      unitOrScale: "%",
      confidence: 65,
      evidence: "Shade-cloth rating; verify with readings at crop height.",
    },
  });
  await prisma.elevationPoint.createMany({
    data: [
      { gardenMapId: map.id, x: 0, y: 0, elevation: 1.9, source: "USER_ESTIMATE", confidence: 45 },
      { gardenMapId: map.id, x: 30, y: 0, elevation: 1.2, source: "USER_ESTIMATE", confidence: 45 },
      { gardenMapId: map.id, x: 0, y: 20, elevation: 1.5, source: "USER_ESTIMATE", confidence: 45 },
      { gardenMapId: map.id, x: 30, y: 20, elevation: 0.8, source: "USER_ESTIMATE", confidence: 45 },
      { gardenMapId: map.id, x: 15, y: 10, elevation: 1.25, source: "MANUAL_LEVEL", confidence: 70 },
    ],
  });

  const inputStorage = await prisma.inventoryLocation.create({
    data: { gardenId: garden.id, name: "Dry input cabinet" },
  });
  const compost = await prisma.material.create({
    data: {
      gardenId: garden.id,
      name: "Mature compost",
      category: "AMENDMENT",
      defaultUnit: "kg",
      composition: { organicMatter: "mixed, batch-specific" },
    },
  });
  const biocontrol = await prisma.material.create({
    data: {
      gardenId: garden.id,
      name: "Bacillus thuringiensis kurstaki",
      category: "BIOLOGICAL",
      formulation: "Wettable powder",
      defaultUnit: "g",
      profile: {
        activeOrganism: "Bacillus thuringiensis subsp. kurstaki",
        caution: "Follow the product label and local regulations.",
      },
    },
  });
  const fertilizer = await prisma.material.create({
    data: {
      gardenId: garden.id,
      name: "Complete fertilizer",
      category: "FERTILIZER",
      formulation: "Granular",
      defaultUnit: "kg",
      composition: { N: 14, P2O5: 14, K2O: 14 },
    },
  });
  const [compostLot, biocontrolLot, fertilizerLot] = await Promise.all([
    prisma.inventoryLot.create({
      data: {
        materialId: compost.id,
        locationId: inputStorage.id,
        lotNumber: "CMP-001",
        initialQuantity: 25,
        currentQuantity: 18,
        unit: "kg",
        unitCost: 18,
      },
    }),
    prisma.inventoryLot.create({
      data: {
        materialId: biocontrol.id,
        locationId: inputStorage.id,
        lotNumber: "BTK-001",
        initialQuantity: 100,
        currentQuantity: 16,
        unit: "g",
        unitCost: 2.5,
        expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.inventoryLot.create({
      data: {
        materialId: fertilizer.id,
        locationId: inputStorage.id,
        lotNumber: "NPK-001",
        initialQuantity: 10,
        currentQuantity: 7.5,
        unit: "kg",
        unitCost: 65,
      },
    }),
  ]);
  await prisma.inventoryTransaction.createMany({
    data: [
      {
        lotId: compostLot.id,
        type: "PURCHASE",
        quantity: compostLot.initialQuantity,
        unit: compostLot.unit,
        reference: "Seed opening balance",
      },
      {
        lotId: compostLot.id,
        type: "CONSUME",
        quantity: 7,
        unit: compostLot.unit,
        reference: "Seed usage record",
      },
      {
        lotId: biocontrolLot.id,
        type: "PURCHASE",
        quantity: biocontrolLot.initialQuantity,
        unit: biocontrolLot.unit,
        reference: "Seed opening balance",
      },
      {
        lotId: biocontrolLot.id,
        type: "CONSUME",
        quantity: 84,
        unit: biocontrolLot.unit,
        reference: "Seed usage record",
      },
      {
        lotId: fertilizerLot.id,
        type: "PURCHASE",
        quantity: fertilizerLot.initialQuantity,
        unit: fertilizerLot.unit,
        reference: "Seed opening balance",
      },
      {
        lotId: fertilizerLot.id,
        type: "CONSUME",
        quantity: 2.5,
        unit: fertilizerLot.unit,
        reference: "Seed usage record",
      },
    ],
  });

  const instrument = await prisma.instrument.create({
    data: {
      gardenId: garden.id,
      name: "Handheld pH/EC probe",
      type: "MULTIPARAMETER_PROBE",
      supportedFactors: ["ph", "ec"],
      supportedUnits: ["pH", "mS/cm"],
      accuracy: "Use device specification after calibration",
      calibrationIntervalDays: 14,
      nextCalibrationAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.measurement.createMany({
    data: [
      {
        gardenId: garden.id,
        factorId: factorByCode.get("ph")!.id,
        targetType: "PLOT",
        targetId: dripPlot.id,
        targetName: dripPlot.name,
        numericValue: 6.4,
        unit: "pH",
        mode: "MANUAL_INSTRUMENT",
        evidenceQuality: "CALIBRATED_INSTRUMENT",
        instrumentId: instrument.id,
        confidence: 85,
      },
      {
        gardenId: garden.id,
        factorId: factorByCode.get("soil_moisture")!.id,
        targetType: "PLOT",
        targetId: dripPlot.id,
        targetName: dripPlot.name,
        textValue: "Slightly dry at finger depth near the line end",
        mode: "QUALITATIVE_OBSERVATION",
        evidenceQuality: "SINGLE_MANUAL_OBSERVATION",
        confidence: 55,
      },
      {
        gardenId: garden.id,
        factorId: factorByCode.get("lux")!.id,
        targetType: "PLANT",
        targetId: tomato.id,
        targetName: "Roma tomato",
        numericValue: 42500,
        unit: "lux",
        mode: "MANUAL_INSTRUMENT",
        evidenceQuality: "UNCALIBRATED_INSTRUMENT",
        confidence: 65,
      },
      {
        gardenId: garden.id,
        factorId: factorByCode.get("wind")!.id,
        targetType: "PLOT",
        targetId: dripPlot.id,
        targetName: dripPlot.name,
        textValue: "Light breeze",
        mode: "QUALITATIVE_OBSERVATION",
        evidenceQuality: "SINGLE_MANUAL_OBSERVATION",
        confidence: 45,
      },
    ],
  });
  await prisma.factorAssessment.create({
    data: {
      gardenId: garden.id,
      factorId: factorByCode.get("nitrogen")!.id,
      targetType: "PLANT",
      targetId: tomato.id,
      targetName: "Roma tomato",
      status: "POSSIBLE_DEFICIENCY",
      evidence: "Lower-leaf yellowing was observed once. This is not a confirmed diagnosis.",
      confidence: 35,
      assumptions: { alternateCauses: ["root stress", "watering pattern", "natural leaf senescence"] },
      notes: "Confirm with repeated observation and an appropriate soil or tissue test before treatment.",
    },
  });

  await prisma.workTask.createMany({
    data: [
      {
        gardenId: garden.id,
        title: "Inspect drip emitters and line-end moisture",
        category: "IRRIGATION",
        targetType: "PLOT",
        targetId: dripPlot.id,
        targetName: dripPlot.name,
        completionMode: "PER_TARGET",
        priority: 75,
        dueAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        recurrenceDays: 7,
        requiredTools: [phMeter.id],
        notes: "Check every emitter, line pressure, leaks, and the driest point.",
      },
      {
        gardenId: garden.id,
        title: "Flush drip lateral",
        category: "IRRIGATION",
        targetType: "ASSET",
        targetId: dripLine.id,
        targetName: dripLine.name,
        priority: 60,
        dueAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        recurrenceDays: 30,
      },
      {
        gardenId: garden.id,
        title: "Calibrate pH/EC probe",
        category: "CALIBRATION",
        targetType: "TOOL",
        targetId: phMeter.id,
        targetName: phMeter.name,
        priority: 65,
        dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        recurrenceDays: 14,
      },
    ],
  });
  const groupTask = await prisma.workTask.findFirstOrThrow({
    where: { gardenId: garden.id, title: "Inspect drip emitters and line-end moisture" },
  });
  await prisma.workTaskProgress.createMany({
    data: [
      { taskId: groupTask.id, targetType: "PLANT", targetId: tomato.id, targetName: "Roma tomato" },
      { taskId: groupTask.id, targetType: "PLANT", targetId: eggplant.id, targetName: "Eggplant" },
      { taskId: groupTask.id, targetType: "ASSET", targetId: dripLine.id, targetName: dripLine.name },
    ],
  });

  const market = await prisma.market.create({
    data: {
      gardenId: garden.id,
      name: "Local farmgate reference",
      type: "FARMGATE",
      location: "Gapan",
      prices: {
        create: {
          commodity: "Tomato",
          variety: "Roma",
          typicalPrice: 80,
          minimumPrice: 60,
          maximumPrice: 100,
          quantityUnit: "kg",
          source: "Illustrative seed value; replace with a dated local observation.",
        },
      },
    },
  });
  await prisma.planting.update({
    where: { id: planting.id },
    data: { preferredMarketId: market.id, marketCommodity: "Tomato" },
  });
  await prisma.sale.create({
    data: {
      gardenId: garden.id,
      marketId: market.id,
      buyer: "Household",
      item: "Eggplant",
      quantity: 1,
      unit: "kg",
      unitPrice: 90,
      totalAmount: 90,
      notes: "Illustrative record.",
    },
  });

  await prisma.entityMedia.createMany({
    data: [
      {
        gardenId: garden.id,
        targetType: "PLOT",
        targetId: dripPlot.id,
        type: "IMAGE",
        url: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e",
        caption: "Example plot image; replace with your own hosted media.",
        isCover: true,
      },
      {
        gardenId: garden.id,
        targetType: "PLANT",
        targetId: tomato.id,
        type: "IMAGE",
        url: "https://images.unsplash.com/photo-1592841200221-a6898f307baa",
        caption: "Example plant image; replace with your own hosted media.",
        isCover: true,
      },
    ],
  });
  await prisma.notificationEndpoint.create({
    data: {
      gardenId: garden.id,
      userId: owner.id,
      channel: "EMAIL",
      label: "Vic email (disabled sample)",
      address: owner.email,
      enabled: false,
      minimumPriority: "P1",
    },
  });

  console.log("Seed complete.");
  console.log(`Login with: vic@example.com / password123`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
