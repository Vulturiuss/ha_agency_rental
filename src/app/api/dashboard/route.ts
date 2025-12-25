import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dateFilterSchema } from "@/lib/validators";
import { requireApiUser } from "@/lib/auth";
import { toNumber } from "@/lib/serializers";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const { start, end } = dateFilterSchema.parse({
    start: searchParams.get("start") ?? undefined,
    end: searchParams.get("end") ?? undefined,
  });

  const locationWhere: Prisma.LocationWhereInput = {};
  if (start || end) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (start) dateFilter.gte = start;
    if (end) dateFilter.lte = end;
    locationWhere.date = dateFilter;
  }

  const expenseWhere: Prisma.ExpenseWhereInput = {};
  if (start || end) {
    const createdFilter: Prisma.DateTimeFilter = {};
    if (start) createdFilter.gte = start;
    if (end) createdFilter.lte = end;
    expenseWhere.createdAt = createdFilter;
  }

  const [locations, expenses, assetsCount] = await Promise.all([
    prisma.location.findMany({
      where: locationWhere,
      select: { price: true, locationStatus: true },
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      select: { cost: true },
    }),
    prisma.asset.count(),
  ]);

  const revenue = locations.reduce((sum, loc) => sum + toNumber(loc.price), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + toNumber(e.cost), 0);

  return NextResponse.json({
    summary: {
      revenue,
      expenses: totalExpenses,
      net: revenue - totalExpenses,
      locations: locations.length,
      assets: assetsCount,
    },
  });
}

