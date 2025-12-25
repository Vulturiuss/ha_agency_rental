'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AssetForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "photobooth",
    purchasePrice: "",
    purchaseDate: "",
    status: "AVAILABLE",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          purchasePrice: Number(form.purchasePrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la creation");
        return;
      }
      setForm({
        name: "",
        category: "photobooth",
        purchasePrice: "",
        purchaseDate: "",
        status: "AVAILABLE",
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
        <label className="label">Nom</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="label">Categorie</label>
          <input
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="label">Statut</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="AVAILABLE">Disponible</option>
            <option value="RENTED">Loue</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="label">Prix d'achat (EUR)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={form.purchasePrice}
            onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="label">Date d'achat</label>
          <input
            className="input"
            type="date"
            value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
            required
          />
        </div>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button className="btn-primary w-full" disabled={loading} type="submit">
        {loading ? "Creation..." : "Ajouter l'asset"}
      </button>
    </form>
  );
}
