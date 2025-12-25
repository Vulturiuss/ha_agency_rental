import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth";
import { serializeMoney, toNumber } from "@/lib/serializers";
import { isSameOrigin } from "@/lib/csrf";
import { parseIdParam } from "@/lib/route-params";
import { ZodError } from "zod";
import { revalidateTag } from "next/cache";

const notFound = NextResponse.json(
  { error: "Charge introuvable" },
  { status: 404 }
);

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "RequÇ¦te refusée" }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (!id) {
    return NextResponse.json({ error: "Id invalide" }, { status: 400 });
  }

  try {
    const existing = await prisma.expense.findFirst({
      where: { id },
    });
    if (!existing) return notFound;

    const body = await req.json();
    const parsed = expenseSchema.parse(body);

    let name = parsed.name ?? existing.name;
    let cost = parsed.cost ?? toNumber(existing.cost);
    const templateId = parsed.templateId ?? existing.templateId;
    const locationId = parsed.locationId ?? existing.locationId;

    if (templateId) {
      const template = await prisma.expenseTemplate.findFirst({
        where: { id: templateId },
      });
      if (!template) {
        return NextResponse.json(
          { error: "Template non autorisé" },
          { status: 403 }
        );
      }
      if (!parsed.name) name = template.name;
      if (parsed.cost === undefined && template.defaultCost !== null) {
        cost = toNumber(template.defaultCost);
      }
    }

    if (locationId) {
      const location = await prisma.location.findFirst({
        where: { id: locationId },
      });
      if (!location) {
        return NextResponse.json(
          { error: "Location non autorisée" },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        name,
        cost,
        templateId,
        locationId,
        updatedById: user.id,
      },
    });

    revalidateTag("expenses");
    revalidateTag("locations");
    revalidateTag("assets");
    revalidateTag("dashboard");

    return NextResponse.json({
      expense: { ...serializeMoney(updated), cost: toNumber(updated.cost) },
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Impossible de mettre à jour la charge" },
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
    return NextResponse.json({ error: "RequÇ¦te refusée" }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (!id) {
    return NextResponse.json({ error: "Id invalide" }, { status: 400 });
  }

  try {
    const existing = await prisma.expense.findFirst({
      where: { id },
    });
    if (!existing) return notFound;

    await prisma.expense.delete({ where: { id } });
    revalidateTag("expenses");
    revalidateTag("locations");
    revalidateTag("assets");
    revalidateTag("dashboard");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de supprimer la charge" },
      { status: 500 }
    );
  }
}
