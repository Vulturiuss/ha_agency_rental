import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth";
import { serializeMoney, toNumber } from "@/lib/serializers";
import { isSameOrigin } from "@/lib/csrf";
import { ZodError } from "zod";
import { revalidateTag } from "next/cache";

export async function GET() {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const expenses = await prisma.expense.findMany({
    include: {
      location: { include: { asset: true } },
      template: {
        include: {
          createdBy: { select: { email: true } },
          updatedBy: { select: { email: true } },
        },
      },
      createdBy: { select: { email: true } },
      updatedBy: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    expenses: expenses.map((e) => ({
      ...serializeMoney(e),
      cost: toNumber(e.cost),
      location: e.location,
      template: e.template
        ? {
            ...serializeMoney(e.template),
            defaultCost:
              e.template.defaultCost !== null
                ? toNumber(e.template.defaultCost)
                : null,
          }
        : null,
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
    const parsed = expenseSchema.parse(body);

    let name = parsed.name;
    let cost = parsed.cost;

    if (parsed.templateId) {
      const template = await prisma.expenseTemplate.findFirst({
        where: { id: parsed.templateId },
      });
      if (!template) {
        return NextResponse.json(
          { error: "Template non autorisé" },
          { status: 403 }
        );
      }
      name = name ?? template.name;
      cost =
        cost ??
        (template.defaultCost !== null ? toNumber(template.defaultCost) : 0);
    }

    if (!name || cost === undefined) {
      return NextResponse.json(
        { error: "Nom ou coût manquant" },
        { status: 400 }
      );
    }

    if (parsed.locationId) {
      const location = await prisma.location.findFirst({
        where: { id: parsed.locationId },
      });
      if (!location) {
        return NextResponse.json(
          { error: "Location non autorisée" },
          { status: 403 }
        );
      }
    }

    const created = await prisma.expense.create({
      data: {
        name,
        cost,
        templateId: parsed.templateId ?? null,
        locationId: parsed.locationId ?? null,
        createdById: user.id,
        updatedById: user.id,
      },
    });

    revalidateTag("expenses");
    revalidateTag("locations");
    revalidateTag("assets");
    revalidateTag("dashboard");

    return NextResponse.json({
      expense: { ...serializeMoney(created), cost: toNumber(created.cost) },
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Impossible de créer la charge" },
      { status: 500 }
    );
  }
}
