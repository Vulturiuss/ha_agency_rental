"use client";

import { useState } from "react";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/users/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur inconnue");
      setLoading(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setSuccess("Mot de passe mis a jour.");
    setLoading(false);
  };

  return (
    <div className="card space-y-4 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Securite</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">
          Changer le mot de passe
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Mettez a jour le mot de passe du compte connecte.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-2">
          <label className="label" htmlFor="current-password">
            Mot de passe actuel
          </label>
          <input
            id="current-password"
            type="password"
            className="input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="label" htmlFor="new-password">
            Nouveau mot de passe
          </label>
          <input
            id="new-password"
            type="password"
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Mise a jour..." : "Mettre a jour"}
        </button>
      </form>
    </div>
  );
}
