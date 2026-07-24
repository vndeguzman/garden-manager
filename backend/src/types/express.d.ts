import type { UserRole } from "@garden/shared";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

// Module augmentation (the same technique from the exercises, applied for
// real): rather than casting `req as any` everywhere to read `req.user`,
// we merge our own field into Express's ambient `Request` interface once,
// here, and every route handler in the app gets it typed for free.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
