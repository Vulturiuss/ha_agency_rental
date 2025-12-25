import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assetSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth";
import { serializeMoney, toNumber } from "@/lib/serializers";
import { isSameOrigin } from "@/lib/csrf";
import { ZodError } from "zod";
import { revalidateTag } from "next/cache";

export async function GET() {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const assets = await prisma.asset.findMany({
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
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = assets.map((asset) => {
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
    const profitability = revenue - expenses;

    return {
      ...serializeMoney(asset),
      purchasePrice: toNumber(asset.purchasePrice),
      locations: asset.locations.map((loc) => ({
        ...serializeMoney(loc),
        price: toNumber(loc.price),
        expenses: loc.expenses.map((e) => ({
          ...serializeMoney(e),
          cost: toNumber(e.cost),
        })),
      })),
      revenue,
      expenses,
      profitability,
    };
  });

  return NextResponse.json({ assets: data });
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Requête refusée" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = assetSchema.parse(body);

    const asset = await prisma.asset.create({
      data: {
        name: parsed.name,
        category: parsed.category,
        purchasePrice: parsed.purchasePrice,
        purchaseDate: parsed.purchaseDate,
        status: parsed.status ?? "AVAILABLE",
        createdById: user.id,
        updatedById: user.id,
      },
    });

    revalidateTag("assets");
    revalidateTag("dashboard");
    revalidateTag("locations");
    revalidateTag("expenses");

    return NextResponse.json({
      asset: { ...serializeMoney(asset), purchasePrice: toNumber(asset.purchasePrice) },
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Impossible de créer l'asset" },
      { status: 500 }
    );
  }
}
