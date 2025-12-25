"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AssetOption = {
  id: number;
  name: string;
};

type LocationItem = {
  id: number;
  assetId: number;
  assetName: string;
  date: string;
  dateLabel: string;
  price: number;
  clientName: string | null;
  locationStatus: "PLANNED" | "COMPLETED" | "CANCELLED";
  expensesTotal: number;
  expenseNames: string[];
};

function LocationCard({
  location,
  assets,
}: {
  location: LocationItem;
  assets: AssetOption[];
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    assetId: location.assetId,
    date: location.date,
    price: String(location.price),
    clientName: location.clientName ?? "",
    locationStatus: location.locationStatus,
  });

  const onSave = async () => {
    if (!window.confirm("Confirmer la modification ?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: Number(form.assetId),
          date: form.date || undefined,
          price: Number(form.price),
          clientName: form.clientName.trim() === "" ? null : form.clientName,
          locationStatus: form.locationStatus,
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
      const res = await fetch(`/api/locations/${location.id}`, {
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {location.assetName}
          </p>
          <p className="text-xs text-slate-500">
            {location.dateLabel} - {location.locationStatus.toLowerCase()}
          </p>
          {location.clientName && (
            <p className="text-xs text-slate-500">
              Client: {location.clientName}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">
            {location.price.toFixed(2)} EUR
          </p>
          <p className="text-xs text-rose-600">
            Charges: {location.expensesTotal.toFixed(2)} EUR
          </p>
        </div>
      </div>
      {location.expenseNames.length > 0 && (
        <div className="mt-2 text-xs text-slate-500">
          {location.expenseNames.join(" - ")}
        </div>
      )}

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
          <div className="space-y-2">
            <label className="label">Asset</label>
            <select
              className="input"
              value={form.assetId}
              onChange={(e) =>
                setForm({ ...form, assetId: Number(e.target.value) })
              }
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="label">Prix (EUR)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="label">Nom du client (optionnel)</label>
            <input
              className="input"
              value={form.clientName}
              onChange={(e) =>
                setForm({ ...form, clientName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="label">Statut</label>
            <select
              className="input"
              value={form.locationStatus}
              onChange={(e) =>
                setForm({
                  ...form,
                  locationStatus: e.target.value as LocationItem["locationStatus"],
                })
              }
            >
              <option value="PLANNED">Planifiee</option>
              <option value="COMPLETED">Terminee</option>
              <option value="CANCELLED">Annulee</option>
            </select>
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

export function LocationList({
  locations,
  assets,
}: {
  locations: LocationItem[];
  assets: AssetOption[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = locations.filter((loc) => {
    if (query.trim()) {
      const client = (loc.clientName ?? "").toLowerCase();
      if (!client.includes(query.trim().toLowerCase())) return false;
    }
    if (status && loc.locationStatus !== status) return false;
    if (dateFrom && loc.date < dateFrom) return false;
    if (dateTo && loc.date > dateTo) return false;
    return true;
  });

  if (locations.length === 0) {
    return (
      <div className="card-muted p-5 text-sm text-slate-500">
        Aucune location pour l'instant.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card-muted p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="label">Client</label>
            <input
              className="input"
              placeholder="Nom du client"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="label">Statut</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="PLANNED">Planifiee</option>
              <option value="COMPLETED">Terminee</option>
              <option value="CANCELLED">Annulee</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="label">Du</label>
            <input
              className="input"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="label">Au</label>
            <input
              className="input"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card-muted p-5 text-sm text-slate-500">
          Aucune location ne correspond aux filtres.
        </div>
      )}

      {filtered.map((location) => (
        <LocationCard
          key={location.id}
          location={location}
          assets={assets}
        />
      ))}
    </div>
  );
}
