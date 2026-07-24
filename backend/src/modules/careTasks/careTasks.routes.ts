import { Router } from "express";
import { z } from "zod";
import {
  completeCareTaskSchema,
  createCareTaskSchema,
  createMediaSchema,
  updateCareTaskSchema,
  updateMediaSchema,
} from "@garden/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as careTasksService from "./careTasks.service.js";
import { careTaskMediaService } from "./careTaskMedia.service.js";

export const careTasksRouter = Router({ mergeParams: true });
careTasksRouter.use(requireAuth);

const params = z.object({
  gardenId: z.string().uuid(),
  plotId: z.string().uuid(),
  plantId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  mediaId: z.string().uuid().optional(),
});

careTasksRouter.get(
  "/",
  validateParams(params),
  asyncHandler(async (req, res) => {
    const tasks = await careTasksService.listCareTasksForPlant(req.user!.id, req.params.plantId!);
    res.json(tasks);
  }),
);

careTasksRouter.get(
  "/:taskId",
  validateParams(params),
  validateBody(updateCareTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await careTasksService.getCareTaskById(req.user!.id, req.params.plantId!, req.params.taskId!);
    const media = await careTaskMediaService.findByTaskId(req.params.taskId!);
    res.json({ ...task, media });
  }),
);

careTasksRouter.post(
  "/",
  validateParams(params),
  (req, _res, next) => {
    req.body = { ...req.body, plantId: req.params.plantId! };
    next();
  },
  validateBody(createCareTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await careTasksService.createCareTask(req.user!.id, req.params.plantId!, req.body);
    res.status(201).json(task);
  }),
);

careTasksRouter.patch(
  "/:taskId",
  validateParams(params),
  asyncHandler(async (req, res) => {
    const task = await careTasksService.updateCareTask(req.user!.id, req.params.plantId!, req.params.taskId!, req.body);
    res.json(task);
  }),
);

careTasksRouter.post(
  "/:taskId/complete",
  validateParams(params),
  validateBody(completeCareTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await careTasksService.completeCareTask(
      req.user!.id,
      req.params.plantId!,
      req.params.taskId!,
      req.body,
    );
    res.json(task);
  }),
);

careTasksRouter.post(
  "/:taskId/media",
  validateParams(params),
  validateBody(createMediaSchema),
  asyncHandler(async (req, res) => {
    await careTasksService.getCareTaskById(req.user!.id, req.params.plantId!, req.params.taskId!);
    const media = await careTaskMediaService.create({
      careTaskId: req.params.taskId!,
      ...req.body,
    });
    res.status(201).json(media);
  }),
);

careTasksRouter.patch(
  "/:taskId/media/:mediaId",
  validateParams(params),
  validateBody(updateMediaSchema),
  asyncHandler(async (req, res) => {
    await careTasksService.getCareTaskById(req.user!.id, req.params.plantId!, req.params.taskId!);
    const media = await careTaskMediaService.update(req.params.mediaId!, req.params.taskId!, req.body);
    res.json(media);
  }),
);

careTasksRouter.get(
  "/:taskId/media",
  validateParams(params),
  asyncHandler(async (req, res) => {
    const media = await careTaskMediaService.findByTaskId(req.params.taskId!);
    res.json(media);
  }),
);

careTasksRouter.delete(
  "/:taskId",
  validateParams(params),
  asyncHandler(async (req, res) => {
    await careTasksService.deleteCareTask(req.user!.id, req.params.plantId!, req.params.taskId!);
    res.status(204).send();
  }),
);

careTasksRouter.delete(
  "/:taskId/media/:mediaId",
  validateParams(params),
  asyncHandler(async (req, res) => {
    await careTasksService.getCareTaskById(req.user!.id, req.params.plantId!, req.params.taskId!);
    await careTaskMediaService.delete(req.params.mediaId!, req.params.taskId!);
    res.status(204).send();
  }),
);
