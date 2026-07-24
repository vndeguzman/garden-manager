import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import type { ApiErrorDto } from "@garden/shared";
import { AppError } from "../utils/errors.js";
import { logger } from "../lib/logger.js";

export const notFoundHandler = (req: Request, res: Response): void => {
  const body: ApiErrorDto = { message: `Route not found: ${req.method} ${req.path}`, code: "ROUTE_NOT_FOUND" };
  res.status(404).json(body);
};

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ZodError) {
    const body: ApiErrorDto = {
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      fieldErrors: err.flatten().fieldErrors as Record<string, string[]>,
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, err.message);
    }
    const body: ApiErrorDto = {
      message: err.message,
      code: err.code,
      ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
    };
    res.status(err.statusCode).json(body);
    return;
  }

  logger.error({ err, path: req.path }, "Unhandled error");
  const body: ApiErrorDto = { message: "Internal server error", code: "INTERNAL_ERROR" };
  res.status(500).json(body);
};
