'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: number; label: string };

export function ExpenseForm({
  locations,
  templates,
}: {
  locations: Option[];
  templates: { id: number; name: string; defaultCost: number | null }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    cost: "",
    locationId: "",
    templateId: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const template = templates.find((t) => String(t.id) === form.templateId);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || undefined,
          cost: form.cost ? Number(form.cost) : undefined,
          locationId: form.locationId ? Number(form.locationId) : undefined,
          templateId: form.templateId ? Number(form.templateId) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la creation");
        return;
      }
      setForm({
        name: "",
        cost: template?.defaultCost ? String(template.defaultCost) : "",
        locationId: "",
        templateId: "",
      });
      router.refresh();
    } catch {
      setError("Erreur lors de la creation");
    } finally {
      setLoading(false);
    }
  };

  const onTemplateChange = (value: string) => {
    const tpl = templates.find((t) => String(t.id) === value);
    setForm({
      ...form,
      templateId: value,
      name: tpl ? tpl.name : form.name,
      cost: tpl?.defaultCost ? String(tpl.defaultCost) : form.cost,
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="label">Template (optionnel)</label>
        <select
          className="input"
          value={form.templateId}
          onChange={(e) => onTemplateChange(e.target.value)}
        >
          <option value="">Aucun</option>
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="label">Nom de la charge</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required={!form.templateId}
        />
      </div>
      <div className="space-y-2">
        <label className="label">Cout (EUR)</label>
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          value={form.cost}
          onChange={(e) => setForm({ ...form, cost: e.target.value })}
          required={!form.templateId}
        />
      </div>
      <div className="space-y-2">
        <label className="label">Associer a une location (optionnel)</label>
        <select
          className="input"
          value={form.locationId}
          onChange={(e) => setForm({ ...form, locationId: e.target.value })}
        >
          <option value="">Charge globale</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Creation..." : "Ajouter la charge"}
      </button>
    </form>
  );
}
