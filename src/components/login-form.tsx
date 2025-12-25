'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
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
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="card w-full space-y-5 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Espace client
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Connexion</h1>
        <p className="mt-1 text-sm text-slate-600">
          Acces securise a votre tableau de bord.
        </p>
      </div>
      <div className="space-y-2">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="label" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <p className="text-xs text-slate-500">
          Minimum 6 caracteres. Les mots de passe sont hashes.
        </p>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Veuillez patienter..." : "Se connecter"}
      </button>
    </form>
  );
}
