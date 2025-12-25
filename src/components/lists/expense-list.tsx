"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: number; label: string };
type TemplateOption = { id: number; name: string };

type ExpenseItem = {
  id: number;
  name: string;
  cost: number;
  createdAtLabel: string;
  locationId: number | null;
  locationLabel: string;
  templateId: number | null;
  templateName: string | null;
};

function ExpenseCard({
  expense,
  locations,
  templates,
}: {
  expense: ExpenseItem;
  locations: Option[];
  templates: TemplateOption[];
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: expense.name,
    cost: String(expense.cost),
    locationId: expense.locationId ? String(expense.locationId) : "",
    templateId: expense.templateId ? String(expense.templateId) : "",
  });

  const onSave = async () => {
    if (!window.confirm("Confirmer la modification ?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || undefined,
          cost: form.cost ? Number(form.cost) : undefined,
          locationId: form.locationId ? Number(form.locationId) : null,
          templateId: form.templateId ? Number(form.templateId) : null,
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
      const res = await fetch(`/api/expenses/${expense.id}`, {
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
          <p className="text-sm font-semibold text-slate-900">{expense.name}</p>
          <p className="text-xs text-slate-500">
            {expense.createdAtLabel} - {expense.locationLabel}
          </p>
          {expense.templateName && (
            <p className="text-xs text-slate-500">
              Template: {expense.templateName}
            </p>
          )}
        </div>
        <div className="text-sm font-semibold text-rose-700">
          -{expense.cost.toFixed(2)} EUR
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
          <div className="space-y-2">
            <label className="label">Template (optionnel)</label>
            <select
              className="input"
              value={form.templateId}
              onChange={(e) =>
                setForm({ ...form, templateId: e.target.value })
              }
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
            />
          </div>
          <div className="space-y-2">
            <label className="label">Associer a une location (optionnel)</label>
            <select
              className="input"
              value={form.locationId}
              onChange={(e) =>
                setForm({ ...form, locationId: e.target.value })
              }
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

export function ExpenseList({
  expenses,
  locations,
  templates,
}: {
  expenses: ExpenseItem[];
  locations: Option[];
  templates: TemplateOption[];
}) {
  if (expenses.length === 0) {
    return (
      <div className="card-muted p-5 text-sm text-slate-500">
        Aucune charge enregistree.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          locations={locations}
          templates={templates}
        />
      ))}
    </div>
  );
}
