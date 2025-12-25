"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AssetItem = {
  id: number;
  name: string;
  category: string;
  status: "AVAILABLE" | "RENTED" | "MAINTENANCE";
  purchasePrice: number;
  purchaseDate: string;
  revenue: number;
  expenses: number;
};

function AssetCard({ asset }: { asset: AssetItem }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: asset.name,
    category: asset.category,
    status: asset.status,
    purchasePrice: String(asset.purchasePrice),
    purchaseDate: asset.purchaseDate,
  });

  const onSave = async () => {
    if (!window.confirm("Confirmer la modification ?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          status: form.status,
          purchasePrice: Number(form.purchasePrice),
          purchaseDate: form.purchaseDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la mise a jour");
        return;
      }
      setIsEditing(false);
      router.refresh();
    } catch {
      setError("Erreur lors de la mise a jour");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la suppression");
        return;
      }
      router.refresh();
    } catch {
      setError("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {asset.category}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{asset.name}</h3>
          <p className="text-xs text-slate-500">
            Statut: {asset.status.toLowerCase()}
          </p>
          <Link
            href={`/assets/${asset.id}`}
            className="mt-3 inline-flex text-sm font-semibold text-slate-900 hover:text-slate-700"
          >
            Ouvrir la fiche
          </Link>
        </div>
        <div className="text-left lg:text-right">
          <p className="text-sm text-slate-600">
            Achat: {asset.purchasePrice.toFixed(2)} EUR
          </p>
          <p className="text-sm text-emerald-700">
            Revenu: {asset.revenue.toFixed(2)} EUR
          </p>
          <p className="text-sm text-rose-700">
            Charges: {asset.expenses.toFixed(2)} EUR
          </p>
          <p className="text-sm font-semibold text-slate-900">
            Net: {(asset.revenue - asset.expenses - asset.purchasePrice).toFixed(2)} EUR
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setIsEditing((prev) => !prev)}
          disabled={loading}
        >
          {isEditing ? "Annuler" : "Modifier"}
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onDelete}
          disabled={loading}
        >
          Supprimer
        </button>
      </div>

      {isEditing && (
        <div className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="label">Nom</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="label">Categorie</label>
              <input
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="label">Statut</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as AssetItem["status"],
                  })
                }
              >
                <option value="AVAILABLE">Disponible</option>
                <option value="RENTED">Loue</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="label">Prix d'achat (EUR)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm({ ...form, purchasePrice: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="label">Date d'achat</label>
            <input
              className="input"
              type="date"
              value={form.purchaseDate}
              onChange={(e) =>
                setForm({ ...form, purchaseDate: e.target.value })
              }
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            className="btn-primary w-full"
            onClick={onSave}
            disabled={loading}
          >
            {loading ? "Mise a jour..." : "Appliquer les modifications"}
          </button>
        </div>
      )}
    </div>
  );
}

export function AssetList({ assets }: { assets: AssetItem[] }) {
  if (assets.length === 0) {
    return (
      <div className="card-muted p-5 text-sm text-slate-500">
        Aucun asset pour le moment. Ajoutez votre premier photobooth.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
}
