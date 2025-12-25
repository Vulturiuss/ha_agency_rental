import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { locationSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth";
import { serializeMoney, toNumber } from "@/lib/serializers";
import { isSameOrigin } from "@/lib/csrf";
import { ZodError } from "zod";

export async function GET() {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const locations = await prisma.location.findMany({
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
    orderBy: { date: "desc" },
  });

  return NextResponse.json({
    locations: locations.map((loc) => ({
      ...serializeMoney(loc),
      price: toNumber(loc.price),
      asset: loc.asset,
      expenses: loc.expenses.map((e) => ({
        ...serializeMoney(e),
        cost: toNumber(e.cost),
      })),
    })),
  });
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Requête refusée" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = locationSchema.parse(body);

    const asset = await prisma.asset.findFirst({
      where: { id: parsed.assetId },
    });
    if (!asset) {
      return NextResponse.json(
        { error: "Asset non autorisé" },
        { status: 403 }
      );
    }

    const created = await prisma.location.create({
      data: {
        assetId: parsed.assetId,
        date: parsed.date,
        price: parsed.price,
        clientName: parsed.clientName ?? null,
        locationStatus: parsed.locationStatus ?? "PLANNED",
        createdById: user.id,
        updatedById: user.id,
      },
    });

    return NextResponse.json({
      location: { ...serializeMoney(created), price: toNumber(created.price) },
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Impossible de créer la location" },
      { status: 500 }
    );
  }
}

