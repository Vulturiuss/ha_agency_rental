import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expenseTemplateSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth";
import { serializeMoney, toNumber } from "@/lib/serializers";
import { isSameOrigin } from "@/lib/csrf";
import { ZodError } from "zod";
import { revalidateTag } from "next/cache";

export async function GET() {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const templates = await prisma.expenseTemplate.findMany({
    include: {
      createdBy: { select: { email: true } },
      updatedBy: { select: { email: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    templates: templates.map((t) => ({
      ...serializeMoney(t),
      defaultCost: t.defaultCost !== null ? toNumber(t.defaultCost) : null,
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
    const parsed = expenseTemplateSchema.parse(body);

    const template = await prisma.expenseTemplate.create({
      data: {
        name: parsed.name,
        defaultCost: parsed.defaultCost ?? null,
        createdById: user.id,
        updatedById: user.id,
      },
    });

    revalidateTag("expenses");

    return NextResponse.json({
      template: {
        ...serializeMoney(template),
        defaultCost: template.defaultCost !== null ? toNumber(template.defaultCost) : null,
      },
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Impossible de créer le template de charge" },
      { status: 500 }
    );
  }
}
