import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { passwordChangeSchema } from "@/lib/validators";
import { hashPassword, requireApiUser, verifyPassword } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { isRateLimited } from "@/lib/rate-limit";
import { ZodError } from "zod";

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Requete refusee" }, { status: 403 });
  }

  const rate = isRateLimited(req, {
    keyPrefix: "password-change",
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
    const { currentPassword, newPassword } = passwordChangeSchema.parse(body);

    const current = await prisma.user.findUnique({ where: { id: user.id } });
    if (!current) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, current.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Impossible de mettre a jour le mot de passe" },
      { status: 500 }
    );
  }
}
