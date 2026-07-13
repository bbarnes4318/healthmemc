import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  Loader2, TrendingUp, Target, Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from "recharts";

const categoryConfig = {
  hydration: { label: "Hydration", color: "#06b6d4" },
  mindfulness: { label: "Mindfulness", color: "#8b5cf6" },
  fitness: { label: "Fitness", color: "#22c55e" },
  nutrition: { label: "Nutrition", color: "#f59e0b" },
  sleep: { label: "Sleep", color: "#6366f1" },
  pain_management: { label: "Pain Mgmt", color: "#ef4444" },
  custom: { label: "Custom", color: "#0ea5e9" },
};

export default function WellnessGoalTrendsChart() {
  const { currentMemberId } = useFamilyMember();
  const [goals, setGoals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(14);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const memberFilter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const [goalData, logData] = await Promise.all([
        base44.entities.CustomWellnessGoal.filter(memberFilter, "-created_date", 50),
        base44.entities.CustomWellnessLog.filter(memberFilter, "-date", 500),
      ]);
      setGoals(goalData.filter((g) => g.is_active !== false));
      setLogs(logData);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentMemberId]);

  useEffect(() => { load(); }, [load]);

  // Build combined chart data: one row per date, one column per goal
  const chartData = useMemo(() => {
    const days = Array.from({ length: range }).map((_, i) => {
      const date = subDays(new Date(), range - 1 - i);
      return format(date, "yyyy-MM-dd");
    });

    return days.map((dateStr) => {
      const dateObj = new Date(dateStr + "T00:00:00");
      const row = { date: format(dateObj, "MMM d"), dateStr };
      for (const goal of goals) {
        const log = logs.find((l) => l.goal_id === goal.id && l.date === dateStr);
        row[goal.id] = log ? log.value : 0;
      }
      return row;
    });
  }, [goals, logs, range]);

  // Consistency stats per goal
  const goalStats = useMemo(() => {
    return goals.map((goal) => {
      const goalLogs = chartData.filter((d) => d[goal.id] > 0);
      const metDays = chartData.filter((d) => d[goal.id] >= goal.target_value);
      const totalLogged = chartData.reduce((s, d) => s + (d[goal.id] || 0), 0);
      const avg = chartData.length > 0 ? (totalLogged / chartData.length).toFixed(1) : "0";
      const consistencyPct = chartData.length > 0 ? Math.round((goalLogs.length / chartData.length) * 100) : 0;
      const metPct = chartData.length > 0 ? Math.round((metDays.length / chartData.length) * 100) : 0;
      return {
        ...goal,
        cfg: categoryConfig[goal.category] || categoryConfig.custom,
        loggedDays: goalLogs.length,
        metDays: metDays.length,
        avg,
        consistencyPct,
        metPct,
      };
    });
  }, [goals, chartData]);

  if (loading) {
    return (
      <Card className="p-5 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </Card>
    );
  }

  if (goals.length === 0) {
    return null;
  }

  const hasAnyData = chartData.some((d) => goals.some((g) => d[g.id] > 0));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Wellness Goal Trends</h3>
            <p className="text-xs text-muted-foreground">Consistency & progress across all goals</p>
          </div>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {[7, 14, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium transition ${range === r ? "bg-emerald-600 text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Consistency Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {goalStats.slice(0, 4).map((goal) => (
          <div key={goal.id} className="p-2.5 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: goal.cfg.color }} />
              <p className="text-[10px] font-medium truncate">{goal.goal_name}</p>
            </div>
            <p className="text-lg font-bold" style={{ color: goal.cfg.color }}>{goal.consistencyPct}%</p>
            <p className="text-[9px] text-muted-foreground">logged {goal.loggedDays}/{range} days</p>
          </div>
        ))}
      </div>

      {/* Multi-goal Line Chart */}
      {hasAnyData ? (
        <>
          <div className="mb-2 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">{range}-Day Progress</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={10} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
              <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 11 }}
                formatter={(val, name) => {
                  const goal = goals.find((g) => g.id === name);
                  return [`${val} ${goal?.unit || ""}`, goal?.goal_name || name];
                }}
                labelFormatter={(label) => label}
              />
              <Legend
                formatter={(value) => {
                  const goal = goals.find((g) => g.id === value);
                  return goal ? goal.goal_name : value;
                }}
                wrapperStyle={{ fontSize: 10 }}
              />
              {goals.map((goal) => {
                const cfg = categoryConfig[goal.category] || categoryConfig.custom;
                return (
                  <ReferenceLine
                    key={`ref-${goal.id}`}
                    y={goal.target_value}
                    stroke={cfg.color}
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />
                );
              })}
              {goals.map((goal) => {
                const cfg = categoryConfig[goal.category] || categoryConfig.custom;
                return (
                  <Line
                    key={goal.id}
                    type="monotone"
                    dataKey={goal.id}
                    stroke={cfg.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: cfg.color }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>

          {/* Per-goal breakdown with target met rate */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Goal Breakdown</p>
            {goalStats.map((goal) => (
              <div key={goal.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: goal.cfg.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{goal.goal_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Target: {goal.target_value} {goal.unit} · Avg: {goal.avg} {goal.unit}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Logged</p>
                    <p className="text-xs font-semibold">{goal.loggedDays}/{range}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Goal met</p>
                    <p className="text-xs font-semibold" style={{ color: goal.metPct >= 70 ? "#22c55e" : goal.metPct >= 40 ? "#f59e0b" : "#ef4444" }}>
                      {goal.metDays}/{range}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[9px]"
                    style={{ color: goal.consistencyPct >= 70 ? "#22c55e" : goal.consistencyPct >= 40 ? "#f59e0b" : "#ef4444" }}
                  >
                    {goal.consistencyPct}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-40 flex flex-col items-center justify-center text-center">
          <Target className="w-10 h-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No logs yet in this period</p>
          <p className="text-xs text-muted-foreground mt-1">Start logging your goals to see trends here</p>
        </div>
      )}
    </Card>
  );
}