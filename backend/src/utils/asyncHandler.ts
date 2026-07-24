import type { NextFunction, Request, RequestHandler, Response } from "express";

// A small generic: it's typed to *whatever* handler shape you pass in
// (custom Request subtype, specific return type, etc.) and just forwards
// it, so you don't lose type information the way `RequestHandler` alone
// sometimes causes when inference gets defeated by the return type.
type AsyncRouteHandler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncHandler =
  <Req extends Request = Request>(handler: AsyncRouteHandler<Req>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req as Req, res, next)).catch(next);
  };
