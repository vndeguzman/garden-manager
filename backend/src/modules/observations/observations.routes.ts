import { Router } from "express";
import { z } from "zod";
import {
  createMediaSchema,
  createObservationSchema,
  updateMediaSchema,
  updateObservationSchema,
} from "@garden/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as observationsService from "./observations.service.js";
import { observationMediaService } from "./observationMedia.service.js";

export const observationsRouter = Router({ mergeParams: true });
observationsRouter.use(requireAuth);

const params = z.object({
  gardenId: z.string().uuid(),
  plotId: z.string().uuid(),
  plantId: z.string().uuid(),
  observationId: z.string().uuid().optional(),
  mediaId: z.string().uuid().optional(),
});

observationsRouter.get(
  "/",
  validateParams(params),
  asyncHandler(async (req, res) => {
    const observations = await observationsService.listObservations(req.user!.id, req.params.plantId!);
    res.json(observations);
  }),
);

observationsRouter.get(
  "/:observationId",
  validateParams(params),
  validateBody(updateObservationSchema),
  asyncHandler(async (req, res) => {
    const observation = await observationsService.getObservationById(
      req.user!.id,
      req.params.plantId!,
      req.params.observationId!,
    );
    const media = await observationMediaService.findByObservationId(req.params.observationId!);
    res.json({ ...observation, media });
  }),
);

observationsRouter.post(
  "/",
  validateParams(params),
  (req, _res, next) => {
    req.body = { ...req.body, plantId: req.params.plantId! };
    next();
  },
  validateBody(createObservationSchema),
  asyncHandler(async (req, res) => {
    const observation = await observationsService.createObservation(
      req.user!.id,
      req.params.plantId!,
      req.user!.id,
      req.body,
    );
    res.status(201).json(observation);
  }),
);

observationsRouter.patch(
  "/:observationId",
  validateParams(params),
  asyncHandler(async (req, res) => {
    const observation = await observationsService.updateObservation(
      req.user!.id,
      req.params.plantId!,
      req.params.observationId!,
      req.body,
    );
    res.json(observation);
  }),
);

observationsRouter.post(
  "/:observationId/media",
  validateParams(params),
  validateBody(createMediaSchema),
  asyncHandler(async (req, res) => {
    await observationsService.getObservationById(req.user!.id, req.params.plantId!, req.params.observationId!);
    const media = await observationMediaService.create({
      observationId: req.params.observationId!,
      ...req.body,
    });
    res.status(201).json(media);
  }),
);

observationsRouter.patch(
  "/:observationId/media/:mediaId",
  validateParams(params),
  validateBody(updateMediaSchema),
  asyncHandler(async (req, res) => {
    await observationsService.getObservationById(req.user!.id, req.params.plantId!, req.params.observationId!);
    const media = await observationMediaService.update(
      req.params.mediaId!,
      req.params.observationId!,
      req.body,
    );
    res.json(media);
  }),
);

observationsRouter.get(
  "/:observationId/media",
  validateParams(params),
  asyncHandler(async (req, res) => {
    const media = await observationMediaService.findByObservationId(req.params.observationId!);
    res.json(media);
  }),
);

observationsRouter.delete(
  "/:observationId",
  validateParams(params),
  asyncHandler(async (req, res) => {
    await observationsService.deleteObservation(req.user!.id, req.params.plantId!, req.params.observationId!);
    res.status(204).send();
  }),
);

observationsRouter.delete(
  "/:observationId/media/:mediaId",
  validateParams(params),
  asyncHandler(async (req, res) => {
    await observationsService.getObservationById(req.user!.id, req.params.plantId!, req.params.observationId!);
    await observationMediaService.delete(req.params.mediaId!, req.params.observationId!);
    res.status(204).send();
  }),
);
