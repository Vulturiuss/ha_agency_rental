"use client";

import { useEffect, useState } from "react";

type UserItem = {
  id: number;
  email: string;
  createdAt: string;
};

export function LicenseManager() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (res.ok) setUsers(data.users || []);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur inconnue");
      setLoading(false);
      return;
    }

    setEmail("");
    setPassword("");
    setSuccess("Licence ajoutee.");
    await loadUsers();
    setLoading(false);
  };

  return (
    <div className="card space-y-4 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Acces</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">Gestion des licences</h3>
        <p className="mt-1 text-sm text-slate-600">
          Ajoutez un compte autorise a acceder a l'application.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-2">
          <label className="label" htmlFor="license-email">
            Email
          </label>
          <input
            id="license-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="label" htmlFor="license-password">
            Mot de passe
          </label>
          <input
            id="license-password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {loading ? "Ajout..." : "Ajouter une licence"}
        </button>
      </form>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Comptes</p>
        {users.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun compte enregistre.</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-700">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2"
              >
                <span className="font-medium text-slate-900">{u.email}</span>
                <span className="text-xs text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
