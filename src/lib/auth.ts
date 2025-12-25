import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const TOKEN_COOKIE = "ha_token";

type JwtPayload = {
  sub: number;
  email: string;
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET non defini dans les variables d'environnement");
  }
  return secret;
};

export async function hashPassword(password: string) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAuthToken(payload: JwtPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(user: { id: number; email: string }) {
  const token = signAuthToken({ sub: user.id, email: user.email });
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return token;
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
}

export async function getUserFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyAuthToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, createdAt: true },
  });
  return user;
}

export async function requireUser() {
  const user = await getUserFromCookies();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireApiUser() {
  const user = await getUserFromCookies();
  if (!user) {
    return null;
  }
  return user;
}


