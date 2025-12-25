import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { toNumber } from "@/lib/serializers";
import { AssetForm } from "@/components/forms/asset-form";
import { AssetList } from "@/components/lists/asset-list";
import { unstable_cache } from "next/cache";

export default async function AssetsPage() {
  const user = await requireUser();
  const getAssetsData = unstable_cache(
    async () => {
      const [assets, globalExpensesAgg] = await Promise.all([
        prisma.asset.findMany({
          select: {
            id: true,
            name: true,
            category: true,
            status: true,
            purchasePrice: true,
            purchaseDate: true,
            locations: {
              select: { price: true, expenses: { select: { cost: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.expense.aggregate({
          where: { locationId: null },
          _sum: { cost: true },
        }),
      ]);
      return { assets, globalExpensesAgg };
    },
    ["assets-page"],
    { tags: ["assets"] }
  );

  const { assets, globalExpensesAgg } = await getAssetsData();
  const globalExpensesTotal = toNumber(globalExpensesAgg._sum.cost);
  const globalShare = assets.length > 0 ? globalExpensesTotal / assets.length : 0;

  const formatDate = (value: Date | string | null) => {
    if (!value) return "";
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const assetItems = assets.map((asset) => {
    const revenue = asset.locations.reduce(
      (sum, loc) => sum + toNumber(loc.price),
      0
    );
    const expenses = asset.locations.reduce(
      (sum, loc) =>
        sum + loc.expenses.reduce((s, e) => s + toNumber(e.cost), 0),
      0
    );

    return {
      id: asset.id,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      purchasePrice: toNumber(asset.purchasePrice),
      purchaseDate: formatDate(asset.purchaseDate ?? null),
      revenue,
      expenses: expenses + globalShare,
    };
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chip">Assets</span>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Assets</h2>
          <p className="mt-2 text-sm text-slate-600">
            Inventaire des equipements louables et rentabilite associee.
          </p>
        </div>
        <div className="card-muted px-4 py-3 text-xs text-slate-600">
          Charges globales par asset: {globalShare.toFixed(2)} EUR
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <AssetList assets={assetItems} />

        <div className="card p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nouveau</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Nouvel asset</h3>
            <p className="mt-1 text-sm text-slate-600">
              Enregistrez un nouveau materiel pour suivre sa rentabilite.
            </p>
          </div>
          <div className="mt-5">
            <AssetForm />
          </div>
        </div>
      </div>
    </div>
  );
}
