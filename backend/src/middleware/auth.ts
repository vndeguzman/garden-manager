import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@garden/shared";
import { env } from "../config/env.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";
import type { AuthUser } from "../types/express.js";

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing bearer token");
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user: AuthUser = { id: payload.sub, email: payload.email, role: payload.role };
    req.user = user;
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
};

// Curried middleware factory — matches the curried-function typing you've
// been practicing: `requireRole("OWNER")` returns a fully-typed middleware,
// so this composes with Express's router the same way the exercises'
// curried validators compose.
export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Requires role: ${roles.join(" or ")}`);
    }
    next();
  };
