import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { TrendingDown, Activity } from "lucide-react";

const severityScore = { mild: 1, moderate: 2, severe: 3 };
const severityLabels = { 1: "Mild", 2: "Moderate", 3: "Severe" };

export default function DentalPainTrendChart({ painLogs = [] }) {
  const chartData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 2; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      months.push({
        start: monthStart,
        end: monthEnd,
        label: format(monthStart, "MMM yyyy"),
        logs: [],
      });
    }

    painLogs.forEach((log) => {
      const logDate = new Date(log.logged_at || log.created_date);
      for (const m of months) {
        if (isWithinInterval(logDate, { start: m.start, end: m.end })) {
          m.logs.push(log);
          break;
        }
      }
    });

    return months.map((m) => {
      const count = m.logs.length;
      const avgIntensity = count > 0
        ? m.logs.reduce((s, l) => s + (severityScore[l.severity] || 1), 0) / count
        : 0;
      const severeCount = m.logs.filter((l) => l.severity === "severe").length;
      return {
        month: m.label,
        frequency: count,
        avgIntensity: parseFloat(avgIntensity.toFixed(1)),
        severeEpisodes: severeCount,
      };
    });
  }, [painLogs]);

  const totalEpisodes = chartData.reduce((s, d) => s + d.frequency, 0);
  const firstMonth = chartData[0]?.frequency || 0;
  const lastMonth = chartData[chartData.length - 1]?.frequency || 0;
  const trend = lastMonth - firstMonth;

  const hasData = totalEpisodes > 0;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500" /> Pain Intensity & Frequency — 3 Month Trend
        </h3>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">Track whether your treatments are reducing discomfort over time</p>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2.5 rounded-lg bg-muted/40 text-center">
          <p className="text-[9px] text-muted-foreground">Total Episodes</p>
          <p className="text-lg font-bold text-red-500">{totalEpisodes}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/40 text-center">
          <p className="text-[9px] text-muted-foreground">Severe Episodes</p>
          <p className="text-lg font-bold text-red-600">{chartData.reduce((s, d) => s + d.severeEpisodes, 0)}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/40 text-center">
          <p className="text-[9px] text-muted-foreground">Trend</p>
          {trend < 0 ? (
            <p className="text-lg font-bold text-emerald-600 flex items-center justify-center gap-0.5">
              <TrendingDown className="w-4 h-4" />{Math.abs(trend)}
            </p>
          ) : trend > 0 ? (
            <p className="text-lg font-bold text-red-600">+{trend}</p>
          ) : (
            <p className="text-lg font-bold text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="py-8 text-center">
          <Activity className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No pain entries in the last 3 months</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} label={{ value: "Episodes", angle: -90, position: "insideLeft", style: { fontSize: 9, fill: "#94a3b8" } }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 3]} ticks={[1, 2, 3]} tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => severityLabels[v] || ""} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={(v, name) => {
                  if (name === "Pain Episodes") return [`${v} episodes`, name];
                  if (name === "Avg Intensity") return [`${v} — ${severityLabels[Math.round(v)] || ""}`, name];
                  return [v, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar yAxisId="left" dataKey="frequency" name="Pain Episodes" fill="#fca5a5" radius={[4, 4, 0, 0]} barSize={50} />
              <Line yAxisId="right" type="monotone" dataKey="avgIntensity" name="Avg Intensity" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 5, fill: "#ef4444" }} />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-red-300 rounded" /> Pain frequency (episodes per month)</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-0.5 bg-red-500" /> Avg intensity (1=Mild, 3=Severe)</span>
          </div>

          {trend < 0 && (
            <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-[10px] text-emerald-700">
                Your pain episodes have decreased from {firstMonth} to {lastMonth} per month — your treatments appear to be helping.
              </p>
            </div>
          )}
          {trend > 0 && (
            <div className="mt-3 p-2.5 bg-amber-50 rounded-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-700">
                Your pain episodes increased from {firstMonth} to {lastMonth} per month — consider discussing this with your dentist.
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}