import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { TemplateForm } from "@/components/forms/template-form";
import { ExpenseForm } from "@/components/forms/expense-form";
import { toNumber } from "@/lib/serializers";
import { ExpenseList } from "@/components/lists/expense-list";
import { TemplateList } from "@/components/lists/template-list";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { unstable_cache } from "next/cache";

export default async function ExpensesPage() {
  const user = await requireUser();
  const getExpensesData = unstable_cache(
    async () => {
      const [templates, expenses, locations] = await Promise.all([
        prisma.expenseTemplate.findMany({
          orderBy: { name: "asc" },
        }),
        prisma.expense.findMany({
          select: {
            id: true,
            name: true,
            cost: true,
            createdAt: true,
            locationId: true,
            templateId: true,
            location: {
              select: { id: true, asset: { select: { name: true } } },
            },
            template: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.location.findMany({
          select: { id: true, assetId: true, asset: { select: { name: true } } },
          orderBy: { date: "desc" },
        }),
      ]);
      return { templates, expenses, locations };
    },
    ["expenses-page"],
    { tags: ["expenses"] }
  );

  const { templates, expenses, locations } = await getExpensesData();

  const templateItems = templates.map((tpl) => ({
    id: tpl.id,
    name: tpl.name,
    defaultCost: tpl.defaultCost !== null ? toNumber(tpl.defaultCost) : null,
  }));

  const locationOptions = Array.from(
    new Map(locations.map((loc) => [loc.assetId, loc])).values()
  ).map((loc) => ({
    id: loc.id,
    label: loc.asset.name,
  }));

  const expenseItems = expenses.map((exp) => ({
    id: exp.id,
    name: exp.name,
    cost: toNumber(exp.cost),
    createdAtLabel: format(exp.createdAt, "dd MMM yyyy", { locale: fr }),
    locationId: exp.locationId ?? null,
    locationLabel: exp.location ? `Location ${exp.location.asset.name}` : "Charge globale",
    templateId: exp.templateId ?? null,
    templateName: exp.template ? exp.template.name : null,
  }));

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="chip">Charges</span>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Charges</h2>
          <p className="mt-2 text-sm text-slate-600">
            Gere les templates reutilisables et les charges liees aux locations.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
        <div className="order-2 space-y-3 lg:order-2">
          <ExpenseList
            expenses={expenseItems}
            locations={locationOptions}
            templates={templateItems}
          />
        </div>

        <div className="order-1 space-y-6 lg:order-1">
          <div className="card p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Template</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Template de charge</h3>
              <p className="mt-1 text-sm text-slate-600">
                Creez un modele reutilisable (ex: transport, encre).
              </p>
            </div>
            <div className="mt-5">
              <TemplateForm />
            </div>
            <TemplateList templates={templateItems} />
          </div>

          <div className="card p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nouveau</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Nouvelle charge</h3>
              <p className="mt-1 text-sm text-slate-600">
                Utilisez un template ou saisissez un montant personnalise.
              </p>
            </div>
            <div className="mt-5">
              <ExpenseForm locations={locationOptions} templates={templateItems} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
