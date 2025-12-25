import { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { NavLinks } from "@/components/nav-links";
import { LogoutButton } from "@/components/logout-button";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(900px_420px_at_15%_-10%,rgba(59,130,246,0.16),transparent),radial-gradient(900px_420px_at_85%_-20%,rgba(14,165,233,0.12),transparent)]" />
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              HA Agency Rental
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              Suivi operations
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NavLinks />
            <div className="hidden h-6 w-px bg-slate-200 md:block" />
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-sm text-slate-700 shadow-sm">
              <span className="font-medium">{user.email}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8 animate-enter">{children}</main>
    </div>
  );
}
