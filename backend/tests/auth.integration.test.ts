import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import type { PrismaClient } from "@prisma/client";

// Integration test: hits a real (test) Postgres via Prisma. Run
// `docker compose up -d db` and `npm run db:migrate` before `npm test`,
// or point DATABASE_URL at a disposable test database. See README.
const hasDatabase = Boolean(process.env.DATABASE_URL && process.env.JWT_SECRET);
const integrationDescribe = hasDatabase ? describe : describe.skip;

integrationDescribe("POST /api/auth/register + /api/auth/login", () => {
  let app: Express;
  let prisma: PrismaClient;
  const credentials = { email: "integration-test@example.com", password: "correct-horse-battery", name: "Test User" };

  beforeAll(async () => {
    const [{ createApp }, prismaModule] = await Promise.all([
      import("../src/app.js"),
      import("../src/lib/prisma.js"),
    ]);
    app = createApp();
    prisma = prismaModule.prisma;
    await prisma.user.deleteMany({ where: { email: "integration-test@example.com" } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: "integration-test@example.com" } });
    await prisma.$disconnect();
  });

  it("registers a new user and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(credentials.email);
    expect(typeof res.body.token).toBe("string");
  });

  it("rejects duplicate registration with 409", async () => {
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CONFLICT");
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });

  it("rejects login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("rejects malformed registration payloads with a 400 and field errors", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "not-an-email", password: "x" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.fieldErrors).toBeDefined();
  });
});
