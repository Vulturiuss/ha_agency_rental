import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assetSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth";
import { serializeMoney, toNumber } from "@/lib/serializers";
import { isSameOrigin } from "@/lib/csrf";
import { parseIdParam } from "@/lib/route-params";
import { ZodError } from "zod";

const notFound = NextResponse.json({ error: "Asset introuvable" }, { status: 404 });

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

  const asset = await prisma.asset.findFirst({
    where: { id },
    include: {
      createdBy: { select: { email: true } },
      updatedBy: { select: { email: true } },
      locations: {
        include: {
          createdBy: { select: { email: true } },
          updatedBy: { select: { email: true } },
          expenses: {
            include: {
              createdBy: { select: { email: true } },
              updatedBy: { select: { email: true } },
            },
          },
        },
        orderBy: { date: "desc" },
      },
    },
  });
  if (!asset) return notFound;

  const revenue = asset.locations.reduce(
    (sum, loc) => sum + toNumber(loc.price),
    0
  );
  const expenses = asset.locations.reduce(
    (sum, loc) =>
      sum +
      loc.expenses.reduce((s, e) => s + toNumber(e.cost), 0),
    0
  );

  return NextResponse.json({
    asset: {
      ...serializeMoney(asset),
      purchasePrice: toNumber(asset.purchasePrice),
      revenue,
      expenses,
      profitability: revenue - expenses,
      locations: asset.locations.map((loc) => ({
        ...serializeMoney(loc),
        price: toNumber(loc.price),
        expenses: loc.expenses.map((e) => ({
          ...serializeMoney(e),
          cost: toNumber(e.cost),
        })),
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
    const existing = await prisma.asset.findFirst({
      where: { id },
    });
    if (!existing) return notFound;

    const body = await req.json();
    const parsed = assetSchema.partial().parse(body);

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        ...parsed,
        updatedById: user.id,
      },
    });

    return NextResponse.json({
      asset: { ...serializeMoney(updated), purchasePrice: toNumber(updated.purchasePrice) },
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Impossible de mettre à jour l'asset" },
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
    const existing = await prisma.asset.findFirst({
      where: { id },
    });
    if (!existing) return notFound;

    await prisma.asset.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de supprimer l'asset" },
      { status: 500 }
    );
  }
}
