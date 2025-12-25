import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expenseTemplateSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth";
import { serializeMoney, toNumber } from "@/lib/serializers";
import { isSameOrigin } from "@/lib/csrf";
import { parseIdParam } from "@/lib/route-params";
import { ZodError } from "zod";
import { revalidateTag } from "next/cache";

const notFound = NextResponse.json(
  { error: "Template introuvable" },
  { status: 404 }
);

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifiЧИ" }, { status: 401 });

  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "RequЧ¦te refusЧИe" }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (!id) {
    return NextResponse.json({ error: "Id invalide" }, { status: 400 });
  }

  try {
    const existing = await prisma.expenseTemplate.findFirst({
      where: { id },
    });
    if (!existing) return notFound;

    const body = await req.json();
    const parsed = expenseTemplateSchema.partial().parse(body);

    const updated = await prisma.expenseTemplate.update({
      where: { id },
      data: { ...parsed, updatedById: user.id },
    });

    revalidateTag("expenses");

    return NextResponse.json({
      template: {
        ...serializeMoney(updated),
        defaultCost:
          updated.defaultCost !== null ? toNumber(updated.defaultCost) : null,
      },
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Impossible de mettre Чџ jour le template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifiЧИ" }, { status: 401 });

  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "RequЧ¦te refusЧИe" }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (!id) {
    return NextResponse.json({ error: "Id invalide" }, { status: 400 });
  }

  try {
    const existing = await prisma.expenseTemplate.findFirst({
      where: { id },
    });
    if (!existing) return notFound;

    await prisma.expenseTemplate.delete({ where: { id } });
    revalidateTag("expenses");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de supprimer le template" },
      { status: 500 }
    );
  }
}
