import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { LicenseManager } from "@/components/settings/license-manager";
import { PasswordForm } from "@/components/settings/password-form";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function SettingsPage() {
  const user = await requireUser();
  const [assets, locations, expenses, templates] = await Promise.all([
    prisma.asset.findMany({
      select: {
        id: true,
        name: true,
        updatedAt: true,
        updatedBy: { select: { email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.location.findMany({
      select: {
        id: true,
        updatedAt: true,
        asset: { select: { name: true } },
        updatedBy: { select: { email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.expense.findMany({
      select: {
        id: true,
        name: true,
        updatedAt: true,
        updatedBy: { select: { email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.expenseTemplate.findMany({
      select: {
        id: true,
        name: true,
        updatedAt: true,
        updatedBy: { select: { email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const auditItems = [
    ...assets.map((a) => ({
      id: `asset-${a.id}`,
      label: `Asset: ${a.name}`,
      updatedAt: a.updatedAt,
      updatedBy: a.updatedBy?.email ?? "Inconnu",
    })),
    ...locations.map((l) => ({
      id: `location-${l.id}`,
      label: `Location: ${l.asset.name}`,
      updatedAt: l.updatedAt,
      updatedBy: l.updatedBy?.email ?? "Inconnu",
    })),
    ...expenses.map((e) => ({
      id: `expense-${e.id}`,
      label: `Charge: ${e.name}`,
      updatedAt: e.updatedAt,
      updatedBy: e.updatedBy?.email ?? "Inconnu",
    })),
    ...templates.map((t) => ({
      id: `template-${t.id}`,
      label: `Template: ${t.name}`,
      updatedAt: t.updatedAt,
      updatedBy: t.updatedBy?.email ?? "Inconnu",
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 10);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chip">Settings</span>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Parametres</h2>
          <p className="mt-2 text-sm text-slate-600">
            Gestion des comptes et suivi des modifications recentes.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-6">
          <div className="card p-5 space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Compte</p>
            <div className="text-sm text-slate-700">Email: {user.email}</div>
            <div className="text-sm text-slate-700">ID utilisateur: {user.id}</div>
          </div>

          <PasswordForm />
          <LicenseManager />
        </div>

        <div className="card p-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Audit</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Audit rapide</h3>
          </div>
          {auditItems.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune modification recente.</p>
          ) : (
            <ul className="space-y-2">
              {auditItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">Modifie par {item.updatedBy}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {format(item.updatedAt, "dd MMM yyyy HH:mm", { locale: fr })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
