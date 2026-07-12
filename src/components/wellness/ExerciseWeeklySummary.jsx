import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Clock, Flame, Dumbbell, Zap } from "lucide-react";
import { BarChart, Bar, Line, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import { format, subDays } from "date-fns";

const intensityColors = { low: "#22c55e", moderate: "#f59e0b", high: "#ef4444" };

export default function ExerciseWeeklySummary({ logs }) {
  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayLogs = logs.filter((l) => l.date === format(d, "yyyy-MM-dd"));
      const duration = dayLogs.reduce((s, l) => s + (l.duration_minutes || 0), 0);
      return {
        day: format(d, "EEE"),
        date: format(d, "MMM d"),
        sessions: dayLogs.length,
        duration: Math.round(duration),
        high: dayLogs.filter((l) => l.intensity === "high").length,
        moderate: dayLogs.filter((l) => l.intensity === "moderate").length,
        low: dayLogs.filter((l) => l.intensity === "low").length,
      };
    });
  }, [logs]);

  const totalSessions = weeklyData.reduce((s, d) => s + d.sessions, 0);
  const totalMinutes = weeklyData.reduce((s, d) => s + d.duration, 0);
  const avgPerDay = Math.round(totalMinutes / 7);
  const activeDays = weeklyData.filter((d) => d.sessions > 0).length;

  const intensityBreakdown = useMemo(() => {
    const high = weeklyData.reduce((s, d) => s + d.high, 0);
    const moderate = weeklyData.reduce((s, d) => s + d.moderate, 0);
    const low = weeklyData.reduce((s, d) => s + d.low, 0);
    return [
      { name: "Low", value: low, color: intensityColors.low },
      { name: "Moderate", value: moderate, color: intensityColors.moderate },
      { name: "High", value: high, color: intensityColors.high },
    ].filter((d) => d.value > 0);
  }, [weeklyData]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border rounded-lg shadow-lg p-2.5 text-xs">
        <p className="font-semibold mb-1">{payload[0]?.payload.date}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground capitalize">{entry.name}:</span>
            <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-orange-600" />
        <h4 className="text-xs font-semibold">Weekly Activity Summary</h4>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2.5 rounded-lg bg-orange-50">
          <Dumbbell className="w-4 h-4 text-orange-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-orange-600">{totalSessions}</p>
          <p className="text-[10px] text-muted-foreground">Sessions</p>
        </div>
        <div className="text-center p-2.5 rounded-lg bg-blue-50">
          <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-600">{totalMinutes}</p>
          <p className="text-[10px] text-muted-foreground">Total Minutes</p>
        </div>
        <div className="text-center p-2.5 rounded-lg bg-violet-50">
          <Flame className="w-4 h-4 text-violet-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-violet-600">{avgPerDay}</p>
          <p className="text-[10px] text-muted-foreground">Avg Min/Day</p>
        </div>
        <div className="text-center p-2.5 rounded-lg bg-emerald-50">
          <Zap className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-emerald-600">{activeDays}/7</p>
          <p className="text-[10px] text-muted-foreground">Active Days</p>
        </div>
      </div>

      {/* Duration + Sessions Chart */}
      <div className="mb-4">
        <p className="text-[10px] font-medium text-muted-foreground mb-2">Daily Duration & Session Count</p>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar yAxisId="left" dataKey="duration" name="Minutes" fill="#fb923c" radius={[4, 4, 0, 0]} barSize={18} />
            <Line yAxisId="right" type="monotone" dataKey="sessions" name="Sessions" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Intensity Distribution */}
      {intensityBreakdown.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="w-32 h-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={intensityBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={2}>
                  {intensityBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground mb-1">Intensity Distribution</p>
            {intensityBreakdown.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-muted-foreground flex-1">{d.name}</span>
                <span className="text-xs font-semibold">{d.value}</span>
                <span className="text-[10px] text-muted-foreground">({Math.round((d.value / totalSessions) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}