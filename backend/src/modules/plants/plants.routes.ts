import { Router } from "express";
import { z } from "zod";
import {
  createMediaSchema,
  createPlantSchema,
  updateMediaSchema,
  updatePlantSchema,
} from "@garden/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as plantsService from "./plants.service.js";
import { careTasksRouter } from "../careTasks/careTasks.routes.js";
import { observationsRouter } from "../observations/observations.routes.js";
import * as plantMediaService from "./plantMedia.service.js";

export const plantsRouter = Router({ mergeParams: true });
plantsRouter.use(requireAuth);

const params = z.object({
  gardenId: z.string().uuid(),
  plotId: z.string().uuid(),
  plantId: z.string().uuid().optional(),
  mediaId: z.string().uuid().optional(),
});

plantsRouter.get(
  "/",
  validateParams(params),
  asyncHandler(async (req, res) => {
    const plants = await plantsService.listPlants(req.user!.id, req.params.plotId!);
    res.json(plants);
  }),
);

plantsRouter.post(
  "/",
  validateParams(params),
  validateBody(createPlantSchema.omit({ plotId: true })),
  asyncHandler(async (req, res) => {
    const plant = await plantsService.createPlant(req.user!.id, req.params.plotId!, {
      ...req.body,
      plotId: req.params.plotId!,
    });
    res.status(201).json(plant);
  }),
);

plantsRouter.get(
  "/:plantId",
  validateParams(params),
  asyncHandler(async (req, res) => {
    const plant = await plantsService.getPlant(req.user!.id, req.params.plotId!, req.params.plantId!);
    res.json(plant);
  }),
);

plantsRouter.patch(
  "/:plantId",
  validateParams(params),
  validateBody(updatePlantSchema),
  asyncHandler(async (req, res) => {
    const plant = await plantsService.updatePlant(
      req.user!.id,
      req.params.plotId!,
      req.params.plantId!,
      req.body,
    );
    res.json(plant);
  }),
);

plantsRouter.delete(
  "/:plantId",
  validateParams(params),
  asyncHandler(async (req, res) => {
    await plantsService.deletePlant(req.user!.id, req.params.plotId!, req.params.plantId!);
    res.status(204).send();
  }),
);

plantsRouter.get(
  "/:plantId/media",
  validateParams(params),
  asyncHandler(async (req, res) => {
    await plantsService.getPlant(req.user!.id, req.params.plotId!, req.params.plantId!);
    res.json(await plantMediaService.listPlantMedia(req.params.plantId!));
  }),
);

plantsRouter.post(
  "/:plantId/media",
  validateParams(params),
  validateBody(createMediaSchema),
  asyncHandler(async (req, res) => {
    await plantsService.getPlant(req.user!.id, req.params.plotId!, req.params.plantId!);
    const media = await plantMediaService.createPlantMedia(req.params.plantId!, req.body);
    res.status(201).json(media);
  }),
);

plantsRouter.patch(
  "/:plantId/media/:mediaId",
  validateParams(params),
  validateBody(updateMediaSchema),
  asyncHandler(async (req, res) => {
    await plantsService.getPlant(req.user!.id, req.params.plotId!, req.params.plantId!);
    res.json(await plantMediaService.updatePlantMedia(req.params.plantId!, req.params.mediaId!, req.body));
  }),
);

plantsRouter.delete(
  "/:plantId/media/:mediaId",
  validateParams(params),
  asyncHandler(async (req, res) => {
    await plantsService.getPlant(req.user!.id, req.params.plotId!, req.params.plantId!);
    await plantMediaService.deletePlantMedia(req.params.plantId!, req.params.mediaId!);
    res.status(204).send();
  }),
);

// Care tasks and observations are nested under a plant
plantsRouter.use("/:plantId/care-tasks", careTasksRouter);
plantsRouter.use("/:plantId/observations", observationsRouter);
