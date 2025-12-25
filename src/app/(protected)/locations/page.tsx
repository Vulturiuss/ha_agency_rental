import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { LocationForm } from "@/components/forms/location-form";
import { toNumber } from "@/lib/serializers";
import { LocationList } from "@/components/lists/location-list";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { unstable_cache } from "next/cache";

export default async function LocationsPage() {
  const user = await requireUser();
  const getLocationsData = unstable_cache(
    async () => {
      const [locations, assets] = await Promise.all([
        prisma.location.findMany({
          include: {
            asset: { select: { id: true, name: true } },
            expenses: { select: { cost: true, name: true } },
          },
          orderBy: { date: "desc" },
        }),
        prisma.asset.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
      ]);
      return { locations, assets };
    },
    ["locations-page"],
    { tags: ["locations"] }
  );

  const { locations, assets } = await getLocationsData();

  const formatDate = (value: Date | string) => {
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const formatDateLabel = (value: Date | string) => {
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "";
    return format(date, "dd MMM yyyy", { locale: fr });
  };

  const assetOptions = assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
  }));

  const locationItems = locations.map((loc) => {
    const expensesTotal = loc.expenses.reduce(
      (sum, e) => sum + toNumber(e.cost),
      0
    );
    return {
      id: loc.id,
      assetId: loc.assetId,
      assetName: loc.asset.name,
      date: formatDate(loc.date),
      dateLabel: formatDateLabel(loc.date),
      price: toNumber(loc.price),
      clientName: loc.clientName ?? null,
      locationStatus: loc.locationStatus,
      expensesTotal,
      expenseNames: loc.expenses.map((e) => e.name),
    };
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chip">Locations</span>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Locations</h2>
          <p className="mt-2 text-sm text-slate-600">
            Suivi des evenements et association aux assets.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
        <div className="order-2 space-y-3 lg:order-2">
          <LocationList locations={locationItems} assets={assetOptions} />
        </div>

        <div className="card order-1 p-5 lg:order-1">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nouveau</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Nouvelle location</h3>
            <p className="mt-1 text-sm text-slate-600">
              Associez la location a un asset pour suivre la rentabilite.
            </p>
          </div>
          <div className="mt-5">
            <LocationForm assets={assets} />
          </div>
        </div>
      </div>
    </div>
  );
}
