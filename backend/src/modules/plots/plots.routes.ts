import { Router } from "express";
import { z } from "zod";
import {
  createMediaSchema,
  createPlotSchema,
  updateMediaSchema,
  updatePlotSchema,
} from "@garden/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as plotsService from "./plots.service.js";
import { plantsRouter } from "../plants/plants.routes.js";
import * as plotMediaService from "./plotMedia.service.js";
import { plotTasksRouter } from "../plotTasks/plotTasks.routes.js";

export const plotsRouter = Router({ mergeParams: true });
plotsRouter.use(requireAuth);

const params = z.object({
  gardenId: z.string().uuid(),
  plotId: z.string().uuid().optional(),
  mediaId: z.string().uuid().optional(),
});

plotsRouter.get(
  "/",
  validateParams(params),
  asyncHandler(async (req, res) => {
    const plots = await plotsService.listPlots(req.user!.id, req.params.gardenId!);
    res.json(plots);
  }),
);

plotsRouter.post(
  "/",
  validateParams(params),
  validateBody(createPlotSchema),
  asyncHandler(async (req, res) => {
    const plot = await plotsService.createPlot(req.user!.id, req.params.gardenId!, req.body);
    res.status(201).json(plot);
  }),
);

plotsRouter.get(
  "/:plotId",
  validateParams(params),
  asyncHandler(async (req, res) => {
    const plot = await plotsService.getPlot(req.user!.id, req.params.gardenId!, req.params.plotId!);
    res.json(plot);
  }),
);

plotsRouter.patch(
  "/:plotId",
  validateParams(params),
  validateBody(updatePlotSchema),
  asyncHandler(async (req, res) => {
    const plot = await plotsService.updatePlot(req.user!.id, req.params.gardenId!, req.params.plotId!, req.body);
    res.json(plot);
  }),
);

plotsRouter.delete(
  "/:plotId",
  validateParams(params),
  asyncHandler(async (req, res) => {
    await plotsService.deletePlot(req.user!.id, req.params.gardenId!, req.params.plotId!);
    res.status(204).send();
  }),
);

plotsRouter.get(
  "/:plotId/media",
  validateParams(params),
  asyncHandler(async (req, res) => {
    await plotsService.getPlot(req.user!.id, req.params.gardenId!, req.params.plotId!);
    res.json(await plotMediaService.listPlotMedia(req.params.plotId!));
  }),
);

plotsRouter.post(
  "/:plotId/media",
  validateParams(params),
  validateBody(createMediaSchema),
  asyncHandler(async (req, res) => {
    await plotsService.getPlot(req.user!.id, req.params.gardenId!, req.params.plotId!);
    const media = await plotMediaService.createPlotMedia(req.params.plotId!, req.body);
    res.status(201).json(media);
  }),
);

plotsRouter.patch(
  "/:plotId/media/:mediaId",
  validateParams(params),
  validateBody(updateMediaSchema),
  asyncHandler(async (req, res) => {
    await plotsService.getPlot(req.user!.id, req.params.gardenId!, req.params.plotId!);
    res.json(await plotMediaService.updatePlotMedia(req.params.plotId!, req.params.mediaId!, req.body));
  }),
);

plotsRouter.delete(
  "/:plotId/media/:mediaId",
  validateParams(params),
  asyncHandler(async (req, res) => {
    await plotsService.getPlot(req.user!.id, req.params.gardenId!, req.params.plotId!);
    await plotMediaService.deletePlotMedia(req.params.plotId!, req.params.mediaId!);
    res.status(204).send();
  }),
);

plotsRouter.use("/:plotId/tasks", plotTasksRouter);

// Plants are nested under a plot: /gardens/:gardenId/plots/:plotId/plants
plotsRouter.use("/:plotId/plants", plantsRouter);
