import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { locationSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth";
import { serializeMoney, toNumber } from "@/lib/serializers";
import { isSameOrigin } from "@/lib/csrf";
import { parseIdParam } from "@/lib/route-params";
import { ZodError } from "zod";
import { revalidateTag } from "next/cache";

const notFound = NextResponse.json({ error: "Location introuvable" }, { status: 404 });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (!id) {
    return NextResponse.json({ error: "Id invalide" }, { status: 400 });
  }

  const location = await prisma.location.findFirst({
    where: { id },
    include: {
      asset: true,
      expenses: {
        include: {
          createdBy: { select: { email: true } },
          updatedBy: { select: { email: true } },
        },
      },
      createdBy: { select: { email: true } },
      updatedBy: { select: { email: true } },
    },
  });
  if (!location) return notFound;

  return NextResponse.json({
    location: {
      ...serializeMoney(location),
      price: toNumber(location.price),
      expenses: location.expenses.map((e) => ({
        ...serializeMoney(e),
        cost: toNumber(e.cost),
      })),
    },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Requete refusée" }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (!id) {
    return NextResponse.json({ error: "Id invalide" }, { status: 400 });
  }

  try {
    const existing = await prisma.location.findFirst({
      where: { id },
    });
    if (!existing) return notFound;

    const body = await req.json();
    const parsed = locationSchema.partial().parse(body);

    if (parsed.assetId) {
      const asset = await prisma.asset.findFirst({
        where: { id: parsed.assetId },
      });
      if (!asset) {
        return NextResponse.json(
          { error: "Asset non autorisé" },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.location.update({
      where: { id },
      data: { ...parsed, updatedById: user.id },
    });

    revalidateTag("locations");
    revalidateTag("assets");
    revalidateTag("expenses");
    revalidateTag("dashboard");

    return NextResponse.json({
      location: {
        ...serializeMoney(updated),
        price: toNumber(updated.price),
      },
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Impossible de mettre à jour la location" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Requete refusée" }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (!id) {
    return NextResponse.json({ error: "Id invalide" }, { status: 400 });
  }

  try {
    const existing = await prisma.location.findFirst({
      where: { id },
    });
    if (!existing) return notFound;

    await prisma.location.delete({ where: { id } });
    revalidateTag("locations");
    revalidateTag("assets");
    revalidateTag("expenses");
    revalidateTag("dashboard");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de supprimer la location" },
      { status: 500 }
    );
  }
}
