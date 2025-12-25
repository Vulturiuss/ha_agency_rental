import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { toNumber } from "@/lib/serializers";
import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function DonutChart({
  slices,
}: {
  slices: { label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 120 120" className="h-28 w-28">
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="12"
        />
        {slices.map((slice) => {
          const fraction = slice.value / total;
          const dash = 2 * Math.PI * 44 * fraction;
          const gap = 2 * Math.PI * 44 - dash;
          const circle = (
            <circle
              key={slice.label}
              cx="60"
              cy="60"
              r="44"
              fill="none"
              stroke={slice.color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="space-y-2 text-sm">
        {slices.map((slice) => (
          <div key={slice.label} className="flex items-center gap-3">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: slice.color }}
            />
            <span className="text-slate-600">{slice.label}</span>
            <span className="font-semibold text-slate-900">
              {slice.value.toFixed(2)} EUR
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StackedBar({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {items.map((item) => (
          <div
            key={item.label}
            className="h-full"
            style={{ width: `${(item.value / total) * 100}%`, background: item.color }}
          />
        ))}
      </div>
      <div className="grid gap-2 text-xs text-slate-500">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: item.color }}
              />
              <span>{item.label}</span>
            </div>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  const start = new Date();
  start.setMonth(start.getMonth() - 11, 1);
  start.setHours(0, 0, 0, 0);

  const [
    assetsCount,
    revenueAgg,
    expensesAgg,
    purchaseAgg,
    trendLocations,
  ] = await Promise.all([
    prisma.asset.count({ where: { createdById: user.id } }),
    prisma.location.aggregate({
      where: { createdById: user.id },
      _sum: { price: true },
    }),
    prisma.expense.aggregate({
      where: { createdById: user.id },
      _sum: { cost: true },
    }),
    prisma.asset.aggregate({
      where: { createdById: user.id },
      _sum: { purchasePrice: true },
    }),
    prisma.location.findMany({
      select: {
        date: true,
        price: true,
        locationStatus: true,
        asset: { select: { name: true } },
      },
      where: { createdById: user.id, date: { gte: start } },
      orderBy: { date: "asc" },
    }),
  ]);

  const revenueTotal = toNumber(revenueAgg._sum.price);
  const expensesTotal = toNumber(expensesAgg._sum.cost);
  const purchaseTotal = toNumber(purchaseAgg._sum.purchasePrice);

  const revenueByAsset = trendLocations.reduce((acc, loc) => {
    acc[loc.asset.name] = (acc[loc.asset.name] || 0) + toNumber(loc.price);
    return acc;
  }, {} as Record<string, number>);

  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(start);
    date.setMonth(start.getMonth() + index);
    const key = format(date, "yyyy-MM");
    return { key, label: format(date, "MMM", { locale: fr }), revenue: 0 };
  });

  trendLocations.forEach((loc) => {
    const key = format(loc.date, "yyyy-MM");
    const index = months.findIndex((m) => m.key === key);
    if (index >= 0) months[index].revenue += toNumber(loc.price);
  });

  const assetSlices = Object.entries(revenueByAsset)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, value], index) => ({
      label,
      value,
      color: ["#0F172A", "#2563EB", "#38BDF8", "#94A3B8"][index] || "#0F172A",
    }));

  const statusCounts = trendLocations.reduce(
    (acc, loc) => {
      acc[loc.locationStatus] = (acc[loc.locationStatus] || 0) + 1;
      return acc;
    },
    { PLANNED: 0, COMPLETED: 0, CANCELLED: 0 }
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chip">Overview</span>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Dashboard</h2>
          <p className="mt-2 text-sm text-slate-600">
            Vue synthetique des revenus, charges et locations recentes.
          </p>
        </div>
        <div className="card-muted px-4 py-3 text-xs text-slate-600">
          Derniere mise a jour: {format(new Date(), "dd MMM yyyy HH:mm", { locale: fr })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenu total" value={`${revenueTotal.toFixed(2)} EUR`} hint="Locations confirmees" />
        <StatCard
          label="Charges totales"
          value={`${expensesTotal.toFixed(2)} EUR`}
          hint="Inclut charges globales"
        />
        <StatCard
          label="Benefice net"
          value={`${(revenueTotal - expensesTotal - purchaseTotal).toFixed(2)} EUR`}
          hint="Apres achats"
        />
        <StatCard label="Assets suivis" value={String(assetsCount)} hint="Parc actif" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Repartition</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Revenus par asset</h3>
            <p className="mt-1 text-sm text-slate-600">12 derniers mois</p>
          </div>
          <div className="mt-5">
            {assetSlices.length === 0 ? (
              <div className="card-muted p-4 text-sm text-slate-500">
                Aucun revenu sur la periode.
              </div>
            ) : (
              <DonutChart slices={assetSlices} />
            )}
          </div>
        </div>

        <div className="card p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Qualite</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Statut des locations</h3>
            <p className="mt-1 text-sm text-slate-600">12 derniers mois</p>
          </div>
          <div className="mt-5">
            <StackedBar
              items={[
                { label: "Terminees", value: statusCounts.COMPLETED, color: "#0F172A" },
                { label: "Planifiees", value: statusCounts.PLANNED, color: "#94A3B8" },
                { label: "Annulees", value: statusCounts.CANCELLED, color: "#EF4444" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rentabilite</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">Revenus par mois</h3>
          <p className="mt-1 text-sm text-slate-600">12 derniers mois</p>
        </div>
        <div className="mt-5">
          <MonthlyRevenueChart data={months.map(({ label, revenue }) => ({ label, revenue }))} />
        </div>
      </div>
    </div>
  );
}
