import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authSchema } from "@/lib/validators";
import { hashPassword, requireApiUser } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { isRateLimited } from "@/lib/rate-limit";
import { ZodError } from "zod";

export async function GET() {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, createdAt: true },
    orderBy: { email: "asc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Requete refusee" }, { status: 403 });
  }

  const rate = isRateLimited(req, {
    keyPrefix: "users-create",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (rate.limited) {
    return NextResponse.json(
      { error: "Trop de tentatives. Reessayez plus tard." },
      { status: 429 }
    );
  }


  try {
    const body = await req.json();
    const { email, password } = authSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "Utilisateur deja existant" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const created = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });

    return NextResponse.json({ user: created });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Impossible de creer l'utilisateur" },
      { status: 500 }
    );
  }
}
