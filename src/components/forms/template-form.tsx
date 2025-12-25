'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TemplateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", defaultCost: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          defaultCost: form.defaultCost ? Number(form.defaultCost) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la creation");
        return;
      }
      setForm({ name: "", defaultCost: "" });
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
        <label className="label">Nom du template</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="label">Cout par defaut (EUR)</label>
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          value={form.defaultCost}
          onChange={(e) => setForm({ ...form, defaultCost: e.target.value })}
        />
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Creation..." : "Ajouter le template"}
      </button>
    </form>
  );
}
