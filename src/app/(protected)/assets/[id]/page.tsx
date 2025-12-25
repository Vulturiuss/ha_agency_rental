import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { toNumber } from "@/lib/serializers";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function AssetDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return notFound();
  }

  const [asset, assetsCount, globalExpensesAgg] = await Promise.all([
    prisma.asset.findFirst({
      where: { id },
      include: {
        locations: {
          include: { expenses: true },
          orderBy: { date: "desc" },
        },
      },
    }),
    prisma.asset.count(),
    prisma.expense.aggregate({
      where: { locationId: null },
      _sum: { cost: true },
    }),
  ]);

  if (!asset) return notFound();

  const revenue = asset.locations.reduce(
    (sum, loc) => sum + toNumber(loc.price),
    0
  );
  const expenses = asset.locations.reduce(
    (sum, loc) =>
      sum + loc.expenses.reduce((s, e) => s + toNumber(e.cost), 0),
    0
  );
  const globalExpensesTotal = toNumber(globalExpensesAgg._sum.cost);
  const globalShare = assetsCount > 0 ? globalExpensesTotal / assetsCount : 0;
  const totalExpenses = expenses + globalShare;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chip">Asset</span>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">{asset.name}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Statut: {asset.status.toLowerCase()} - Achat: {toNumber(asset.purchasePrice).toFixed(2)} EUR
          </p>
        </div>
        <Link href="/assets" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
          Retour aux assets
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Revenu</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{revenue.toFixed(2)} EUR</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Charges</p>
          <p className="mt-3 text-3xl font-semibold text-rose-700">{totalExpenses.toFixed(2)} EUR</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Benefice net</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {(revenue - totalExpenses - toNumber(asset.purchasePrice)).toFixed(2)} EUR
          </p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Historique</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Locations</h3>
          </div>
          <Link
            href="/locations"
            className="text-sm font-semibold text-slate-900 hover:text-slate-700"
          >
            Gerer les locations
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {asset.locations.length === 0 && (
            <p className="text-sm text-slate-500">Aucune location liee pour l'instant.</p>
          )}
          {asset.locations.map((loc) => {
            const locExpenses = loc.expenses.reduce(
              (sum, e) => sum + toNumber(e.cost),
              0
            );
            return (
              <div
                key={loc.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {format(loc.date, "dd MMM yyyy", { locale: fr })} - {loc.locationStatus.toLowerCase()}
                    </p>
                    {loc.clientName && (
                      <p className="text-xs text-slate-500">Client: {loc.clientName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {toNumber(loc.price).toFixed(2)} EUR
                    </p>
                    <p className="text-xs text-rose-600">
                      Charges: {locExpenses.toFixed(2)} EUR
                    </p>
                  </div>
                </div>
                {loc.expenses.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500">
                    {loc.expenses.map((e) => e.name).join(" - ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
