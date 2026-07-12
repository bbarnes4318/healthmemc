import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Flame, Beef } from "lucide-react";
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { format, subDays } from "date-fns";

export default function NutritionTrendChart({ logs, healthScore }) {
  const trendData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayLogs = logs.filter((l) => l.date === format(d, "yyyy-MM-dd"));
      return {
        day: format(d, "EEE"),
        date: format(d, "MMM d"),
        calories: dayLogs.reduce((s, m) => s + (m.calories || 0), 0),
        protein: Math.round(dayLogs.reduce((s, m) => s + (m.protein_g || 0), 0)),
      };
    });
  }, [logs]);

  const avgCalories = Math.round(trendData.reduce((s, d) => s + d.calories, 0) / 7);
  const avgProtein = Math.round(trendData.reduce((s, d) => s + d.protein, 0) / 7);
  const maxCalories = Math.max(...trendData.map((d) => d.calories), 1);
  const maxProtein = Math.max(...trendData.map((d) => d.protein), 1);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border rounded-lg shadow-lg p-2.5 text-xs">
        <p className="font-semibold mb-1">{payload[0]?.payload.date}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground capitalize">{entry.dataKey}:</span>
            <span className="font-semibold">{entry.value}{entry.dataKey === "calories" ? " cal" : "g"}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-xs font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> 7-Day Nutrition Trends
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Flame className="w-3 h-3 text-orange-500" /> Avg {avgCalories} cal/day
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Beef className="w-3 h-3 text-red-500" /> Avg {avgProtein}g protein/day
            </span>
          </div>
        </div>
        {healthScore && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Health Score:</span>
            <span className="font-bold text-violet-600">{healthScore}</span>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: "cal", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#f97316" } }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: "g", angle: 90, position: "insideRight", style: { fontSize: 10, fill: "#ef4444" } }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="calories" name="Calories" fill="#fb923c" radius={[4, 4, 0, 0]} barSize={20} />
          <Line yAxisId="right" type="monotone" dataKey="protein" name="Protein (g)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}