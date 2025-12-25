'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

type AssetOption = {
  id: number;
  name: string;
};

export function LocationForm({ assets }: { assets: AssetOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    assetId: assets[0]?.id ?? 0,
    date: "",
    price: "300",
    clientName: "",
    locationStatus: "COMPLETED",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          assetId: Number(form.assetId),
          price: Number(form.price),
          clientName: form.clientName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la creation");
        return;
      }
      setForm({
        assetId: assets[0]?.id ?? 0,
        date: "",
        price: "300",
        clientName: "",
        locationStatus: "COMPLETED",
      });
      router.refresh();
    } catch {
      setError("Erreur lors de la creation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="label">Asset</label>
        <select
          className="input"
          value={form.assetId}
          onChange={(e) => setForm({ ...form, assetId: Number(e.target.value) })}
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
            required
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
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="label">Nom du client (optionnel)</label>
        <input
          className="input"
          value={form.clientName}
          onChange={(e) => setForm({ ...form, clientName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label className="label">Statut</label>
        <select
          className="input"
          value={form.locationStatus}
          onChange={(e) => setForm({ ...form, locationStatus: e.target.value })}
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
      <button className="btn-primary w-full" disabled={loading || assets.length === 0}>
        {assets.length === 0
          ? "Ajoutez un asset d'abord"
          : loading
            ? "Creation..."
            : "Ajouter la location"}
      </button>
    </form>
  );
}
