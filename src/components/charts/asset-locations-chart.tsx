"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LocationPoint = {
  date: string;
  assetName: string;
};

type GroupBy = "month" | "year";

type Bucket = {
  key: string;
  label: string;
};

const COLOR_POOL = ["#0F172A", "#2563EB", "#38BDF8", "#94A3B8", "#F59E0B"];

function buildBuckets(points: LocationPoint[], groupBy: GroupBy): Bucket[] {
  if (points.length === 0) return [];

  const dates = points.map((p) => new Date(p.date));
  const min = new Date(Math.min(...dates.map((d) => d.getTime())));
  const max = new Date(Math.max(...dates.map((d) => d.getTime())));

  const buckets: Bucket[] = [];
  const cursor = new Date(min);
  cursor.setDate(1);

  while (cursor <= max) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const key = groupBy === "month" ? `${year}-${month}` : `${year}`;
    const label =
      groupBy === "month" ? `${month}/${String(year).slice(-2)}` : `${year}`;
    if (buckets.length === 0 || buckets[buckets.length - 1].key != key) {
      buckets.push({ key, label });
    }
    if (groupBy === "month") {
      cursor.setMonth(cursor.getMonth() + 1);
    } else {
      cursor.setFullYear(cursor.getFullYear() + 1);
    }
  }

  return buckets;
}

function buildSeries(points: LocationPoint[], groupBy: GroupBy) {
  const buckets = buildBuckets(points, groupBy);
  if (buckets.length === 0) return { buckets, data: [], keys: [] as string[] };

  const totalsByAsset: Record<string, number> = {};
  const map: Record<string, Record<string, number>> = {};

  points.forEach((loc) => {
    const date = new Date(loc.date);
    const key =
      groupBy === "month"
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : `${date.getFullYear()}`;
    map[key] = map[key] || {};
    map[key][loc.assetName] = (map[key][loc.assetName] || 0) + 1;
    totalsByAsset[loc.assetName] = (totalsByAsset[loc.assetName] || 0) + 1;
  });

  const assetNames = Object.entries(totalsByAsset)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const primary = assetNames.slice(0, 4);
  const hasOther = assetNames.length > 4;
  if (hasOther) primary.push("Autres");

  const data = buckets.map((bucket) => {
    const entries = map[bucket.key] || {};
    const row: Record<string, number | string> = { label: bucket.label };
    primary.forEach((name) => {
      if (name === "Autres") {
        row[name] = assetNames
          .slice(4)
          .reduce((sum, asset) => sum + (entries[asset] || 0), 0);
      } else {
        row[name] = entries[name] || 0;
      }
    });
    return row;
  });

  return { buckets, data, keys: primary };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || payload.length == 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-6">
          <span>{entry.dataKey}</span>
          <span className="font-semibold text-slate-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AssetLocationsChart({ locations }: { locations: LocationPoint[] }) {
  const [groupBy, setGroupBy] = useState<GroupBy>("month");

  const chart = useMemo(() => buildSeries(locations, groupBy), [locations, groupBy]);

  if (locations.length === 0) {
    return (
      <div className="card-muted p-4 text-sm text-slate-500">
        Aucune location disponible pour afficher le graphe.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">Periode: Depuis toujours</div>
        <div className="flex items-center gap-2">
          <label className="label">Vue</label>
          <select
            className="input w-auto"
            value={groupBy}
            onChange={(event) => setGroupBy(event.target.value as GroupBy)}
          >
            <option value="month">Par mois</option>
            <option value="year">Par an</option>
          </select>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart.data} barCategoryGap={16} barGap={4}>
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
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", color: "#64748B" }}
            />
            {chart.keys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="locations"
                fill={COLOR_POOL[index % COLOR_POOL.length]}
                radius={[6, 6, 6, 6]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
