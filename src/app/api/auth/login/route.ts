import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authSchema } from "@/lib/validators";
import { setAuthCookie, verifyPassword } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { isRateLimited } from "@/lib/rate-limit";
import { ZodError } from "zod";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Requete refusee" }, { status: 403 });
  }


  const rate = isRateLimited(req, {
    keyPrefix: "login",
    limit: 10,
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

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    await setAuthCookie({ id: user.id, email: user.email });
    return NextResponse.json({
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Impossible de se connecter" },
      { status: 500 }
    );
  }
}

