import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

// In dev, tsx watch re-executes modules on every save. Without a singleton
// guard, each reload would open a fresh PrismaClient (and a fresh pool of
// DB connections) without closing the old one. Stashing it on `globalThis`
// survives the module reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
