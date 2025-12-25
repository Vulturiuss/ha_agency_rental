"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TemplateItem = {
  id: number;
  name: string;
  defaultCost: number | null;
};

function TemplateCard({ template }: { template: TemplateItem }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: template.name,
    defaultCost: template.defaultCost === null ? "" : String(template.defaultCost),
  });

  const onSave = async () => {
    if (!window.confirm("Confirmer la modification ?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          defaultCost: form.defaultCost === "" ? undefined : Number(form.defaultCost),
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
      const res = await fetch(`/api/expenses/templates/${template.id}`, {
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
    <div className="card-muted p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{template.name}</p>
          <p className="text-xs text-slate-500">
            Cout par defaut: {template.defaultCost !== null ? `${template.defaultCost.toFixed(2)} EUR` : "N/A"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
      </div>

      {isEditing && (
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <label className="label">Nom</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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

export function TemplateList({ templates }: { templates: TemplateItem[] }) {
  if (templates.length === 0) {
    return (
      <div className="card-muted p-4 text-sm text-slate-500">
        Aucun template disponible.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}
