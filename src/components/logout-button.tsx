'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="btn-secondary"
      disabled={loading}
      type="button"
    >
      {loading ? "Deconnexion..." : "Deconnexion"}
    </button>
  );
}
