import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AuthResponseDto, LoginInput, RegisterInput } from "@garden/shared";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { ConflictError, UnauthorizedError } from "../../utils/errors.js";

const SALT_ROUNDS = 12;

function issueToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export async function register(input: RegisterInput): Promise<AuthResponseDto> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email: input.email, name: input.name, passwordHash },
  });

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token: issueToken(user),
  };
}

export async function login(input: LoginInput): Promise<AuthResponseDto> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token: issueToken(user),
  };
}
