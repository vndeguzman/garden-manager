import { Router } from "express";
import { z } from "zod";
import {
  completeCareTaskSchema,
  createPlotTaskSchema,
  updatePlotTaskSchema,
} from "@garden/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getPlot } from "../plots/plots.service.js";
import * as plotTasksService from "./plotTasks.service.js";

export const plotTasksRouter = Router({ mergeParams: true });
plotTasksRouter.use(requireAuth);

const params = z.object({
  gardenId: z.string().uuid(),
  plotId: z.string().uuid(),
  plotTaskId: z.string().uuid().optional(),
});

plotTasksRouter.get(
  "/",
  validateParams(params),
  asyncHandler(async (req, res) => {
    res.json(await plotTasksService.listPlotTasks(req.user!.id, req.params.plotId!));
  }),
);

plotTasksRouter.get(
  "/templates",
  validateParams(params),
  asyncHandler(async (req, res) => {
    const plot = await getPlot(req.user!.id, req.params.gardenId!, req.params.plotId!);
    res.json(plotTasksService.getRecommendedTemplates(plot.irrigationType));
  }),
);

plotTasksRouter.post(
  "/recommended",
  validateParams(params),
  asyncHandler(async (req, res) => {
    res.status(201).json(await plotTasksService.addRecommendedPlotTasks(req.user!.id, req.params.plotId!));
  }),
);

plotTasksRouter.post(
  "/",
  validateParams(params),
  validateBody(createPlotTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await plotTasksService.createPlotTask(req.user!.id, req.params.plotId!, req.body);
    res.status(201).json(task);
  }),
);

plotTasksRouter.patch(
  "/:plotTaskId",
  validateParams(params),
  validateBody(updatePlotTaskSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await plotTasksService.updatePlotTask(
        req.user!.id,
        req.params.plotId!,
        req.params.plotTaskId!,
        req.body,
      ),
    );
  }),
);

plotTasksRouter.post(
  "/:plotTaskId/complete",
  validateParams(params),
  validateBody(completeCareTaskSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await plotTasksService.completePlotTask(
        req.user!.id,
        req.params.plotId!,
        req.params.plotTaskId!,
        req.body.completedAt,
        req.body.note,
      ),
    );
  }),
);

plotTasksRouter.delete(
  "/:plotTaskId",
  validateParams(params),
  asyncHandler(async (req, res) => {
    await plotTasksService.deletePlotTask(req.user!.id, req.params.plotId!, req.params.plotTaskId!);
    res.status(204).send();
  }),
);
