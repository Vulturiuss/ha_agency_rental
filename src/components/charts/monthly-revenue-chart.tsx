"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenuePoint = {
  label: string;
  revenue: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
      <div className="flex items-center justify-between gap-6">
        <span>Revenus</span>
        <span className="font-semibold text-slate-900">
          {payload[0].value.toFixed(2)} EUR
        </span>
      </div>
    </div>
  );
}

export function MonthlyRevenueChart({ data }: { data: RevenuePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="card-muted p-4 text-sm text-slate-500">
        Aucune location disponible pour afficher le graphe.
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap={16}>
          <XAxis
            dataKey="label"
            tick={{ fill: "#94A3B8", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#94A3B8", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
          <Bar dataKey="revenue" fill="#0F172A" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
