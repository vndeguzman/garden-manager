import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type Target = "body" | "query" | "params";

// Generic + curried: `validate("body")(schema)` returns middleware whose
// `req.body` is narrowed to the schema's inferred type inside the handler
// that follows it, without needing a manual cast. This is the same
// generic-inference shape as the curried validators in the exercises,
// wired into real Express middleware.
export const validate =
  <T extends Target>(target: T) =>
  <S extends ZodSchema>(schema: S) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(result.error);
      return;
    }
    req[target] = result.data;
    next();
  };

export const validateBody = validate("body");
export const validateQuery = validate("query");
export const validateParams = validate("params");
