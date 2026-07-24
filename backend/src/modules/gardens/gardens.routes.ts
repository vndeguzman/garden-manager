import { Router } from "express";
import { z } from "zod";
import { createGardenSchema, updateGardenSchema } from "@garden/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as gardensService from "./gardens.service.js";
import { plotsRouter } from "../plots/plots.routes.js";
import * as careTasksService from "../careTasks/careTasks.service.js";
import { operationsRouter } from "../operations/operations.routes.js";

export const gardensRouter = Router();
gardensRouter.use(requireAuth);

const idParams = z.object({ gardenId: z.string().uuid() });

gardensRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const gardens = await gardensService.listGardens(req.user!.id);
    res.json(gardens);
  }),
);

gardensRouter.post(
  "/",
  validateBody(createGardenSchema),
  asyncHandler(async (req, res) => {
    const garden = await gardensService.createGarden(req.user!.id, req.body);
    res.status(201).json(garden);
  }),
);

gardensRouter.get(
  "/:gardenId",
  validateParams(idParams),
  asyncHandler(async (req, res) => {
    const garden = await gardensService.getGarden(req.user!.id, req.params.gardenId!);
    res.json(garden);
  }),
);

gardensRouter.patch(
  "/:gardenId",
  validateParams(idParams),
  validateBody(updateGardenSchema),
  asyncHandler(async (req, res) => {
    const garden = await gardensService.updateGarden(req.user!.id, req.params.gardenId!, req.body);
    res.json(garden);
  }),
);

gardensRouter.delete(
  "/:gardenId",
  validateParams(idParams),
  asyncHandler(async (req, res) => {
    await gardensService.deleteGarden(req.user!.id, req.params.gardenId!);
    res.status(204).send();
  }),
);

gardensRouter.get(
  "/:gardenId/due-tasks",
  validateParams(idParams),
  asyncHandler(async (req, res) => {
    const tasks = await careTasksService.listDueTasksForGarden(req.user!.id, req.params.gardenId!);
    res.json(tasks);
  }),
);

// Plots are nested under a garden: /gardens/:gardenId/plots
gardensRouter.use("/:gardenId/plots", plotsRouter);
gardensRouter.use("/:gardenId/workspace", operationsRouter);
