import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingDown, TrendingUp, Activity, Dumbbell, Zap, Calendar, BarChart3, Award } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine, Area
} from "recharts";
import { format, parseISO, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { motion } from "framer-motion";

export default function ExercisePainTrendReport() {
  const { currentMemberId } = useFamilyMember();
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
        const exercises = await base44.entities.ExerciseLog.filter(filter, "-date", 200);
        setRawData(exercises);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  const chartData = useMemo(() => {
    if (rawData.length === 0) return [];

    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const today = new Date();
    const start = subDays(today, days - 1);

    const dateRange = eachDayOfInterval({ start, end: today });

    const byDate = {};
    for (const e of rawData) {
      if (!e.date) continue;
      const d = parseISO(e.date);
      if (d < start || d > today) continue;
      if (!byDate[e.date]) byDate[e.date] = { date: e.date, exerciseCount: 0, totalMinutes: 0, totalPain: 0, painReadings: 0, maxPain: 0, activities: [] };
      byDate[e.date].exerciseCount += 1;
      byDate[e.date].totalMinutes += e.duration_minutes || 0;
      if (e.pain_level != null) {
        byDate[e.date].totalPain += e.pain_level;
        byDate[e.date].painReadings += 1;
        byDate[e.date].maxPain = Math.max(byDate[e.date].maxPain, e.pain_level);
      }
      if (e.exercise_name) byDate[e.date].activities.push(e.exercise_name);
    }

    return dateRange.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const entry = byDate[key];
      if (entry) {
        return {
          ...entry,
          dateLabel: format(d, range === "90d" ? "MMM d" : "EEE MMM d"),
          avgPain: entry.painReadings > 0 ? +(entry.totalPain / entry.painReadings).toFixed(1) : null,
        };
      }
      return {
        date: key,
        dateLabel: format(d, range === "90d" ? "MMM d" : "EEE MMM d"),
        exerciseCount: 0,
        totalMinutes: 0,
        avgPain: null,
        maxPain: 0,
        activities: [],
      };
    });
  }, [rawData, range]);

  // Moving average for pain (3-day window)
  const chartWithMA = useMemo(() => {
    return chartData.map((d, i) => {
      const window = chartData.slice(Math.max(0, i - 2), i + 1).filter((x) => x.avgPain != null);
      const ma = window.length > 0 ? +(window.reduce((s, x) => s + x.avgPain, 0) / window.length).toFixed(1) : null;
      return { ...d, painTrend: ma };
    });
  }, [chartData]);

  const insights = useMemo(() => {
    if (chartData.length < 3) return [];

    const daysWithExercise = chartData.filter((d) => d.exerciseCount > 0);
    const daysWithPain = chartData.filter((d) => d.avgPain != null);
    const tips = [];

    if (daysWithExercise.length < 3 || daysWithPain.length < 3) {
      tips.push({ icon: Calendar, text: "Log at least 3 days of exercise with pain ratings to see improvement patterns.", color: "text-muted-foreground", tone: "info" });
      return tips;
    }

    // Overall trend: compare first third vs last third
    const third = Math.floor(chartData.length / 3);
    const earlyPain = chartData.slice(0, third).filter((d) => d.avgPain != null);
    const recentPain = chartData.slice(third * 2).filter((d) => d.avgPain != null);
    const earlyEx = chartData.slice(0, third);
    const recentEx = chartData.slice(third * 2);

    if (earlyPain.length > 0 && recentPain.length > 0) {
      const earlyAvgPain = earlyPain.reduce((s, d) => s + d.avgPain, 0) / earlyPain.length;
      const recentAvgPain = recentPain.reduce((s, d) => s + d.avgPain, 0) / recentPain.length;
      const earlyAvgEx = earlyEx.reduce((s, d) => s + d.exerciseCount, 0) / earlyEx.length;
      const recentAvgEx = recentEx.reduce((s, d) => s + d.exerciseCount, 0) / recentEx.length;
      const painChange = ((recentAvgPain - earlyAvgPain) / earlyAvgPain * 100).toFixed(0);
      const exChange = earlyAvgEx > 0 ? ((recentAvgEx - earlyAvgEx) / earlyAvgEx * 100).toFixed(0) : null;

      if (recentAvgPain < earlyAvgPain) {
        tips.push({
          icon: TrendingDown,
          text: `Pain decreased ${Math.abs(painChange)}% (from ${earlyAvgPain.toFixed(1)} to ${recentAvgPain.toFixed(1)}/10) while exercise ${exChange ? `${exChange > 0 ? "increased" : "decreased"} ${Math.abs(exChange)}%` : "stayed steady"}. Clear improvement pattern detected.`,
          color: "text-emerald-600",
          tone: "positive",
        });
      } else if (recentAvgPain > earlyAvgPain) {
        tips.push({
          icon: TrendingUp,
          text: `Pain increased ${painChange}% (from ${earlyAvgPain.toFixed(1)} to ${recentAvgPain.toFixed(1)}/10). Consider reviewing your exercise intensity with your provider.`,
          color: "text-amber-600",
          tone: "warning",
        });
      } else {
        tips.push({
          icon: Activity,
          text: `Pain levels remained stable at ${recentAvgPain.toFixed(1)}/10. Consistency is key — keep tracking to detect longer-term trends.`,
          color: "text-sky-600",
          tone: "info",
        });
      }
    }

    // Correlation: high-exercise days vs low-exercise days
    const sortedByEx = [...daysWithExercise].sort((a, b) => b.exerciseCount - a.exerciseCount);
    const topHalf = sortedByEx.slice(0, Math.ceil(sortedByEx.length / 2)).filter((d) => d.avgPain != null);
    const bottomHalf = sortedByEx.slice(Math.ceil(sortedByEx.length / 2)).filter((d) => d.avgPain != null);
    if (topHalf.length > 0 && bottomHalf.length > 0) {
      const highExPain = topHalf.reduce((s, d) => s + d.avgPain, 0) / topHalf.length;
      const lowExPain = bottomHalf.reduce((s, d) => s + d.avgPain, 0) / bottomHalf.length;
      if (lowExPain < highExPain * 0.85) {
        tips.push({
          icon: Award,
          text: `On your most active days, pain averaged ${lowExPain.toFixed(1)}/10 vs ${highExPain.toFixed(1)}/10 on less active days. More movement appears to be helping.`,
          color: "text-emerald-600",
          tone: "positive",
        });
      }
    }

    // Frequency
    const totalSessions = daysWithExercise.reduce((s, d) => s + d.exerciseCount, 0);
    const activeDays = daysWithExercise.length;
    const pct = Math.round((activeDays / chartData.length) * 100);
    tips.push({
      icon: Dumbbell,
      text: `${totalSessions} sessions across ${activeDays} active days (${pct}% of tracked period). Averaging ${(totalSessions / chartData.length).toFixed(1)} sessions/day.`,
      color: "text-sky-600",
      tone: "info",
    });

    return tips;
  }, [chartData]);

  // Summary stats
  const stats = useMemo(() => {
    const daysWithEx = chartData.filter((d) => d.exerciseCount > 0);
    const daysWithPain = chartData.filter((d) => d.avgPain != null);
    const totalSessions = daysWithEx.reduce((s, d) => s + d.exerciseCount, 0);
    const totalMin = daysWithEx.reduce((s, d) => s + d.totalMinutes, 0);
    const avgPain = daysWithPain.length > 0 ? +(daysWithPain.reduce((s, d) => s + d.avgPain, 0) / daysWithPain.length).toFixed(1) : null;

    // Improvement: first half vs second half pain
    let improvement = null;
    if (daysWithPain.length >= 4) {
      const half = Math.floor(daysWithPain.length / 2);
      const firstHalf = daysWithPain.slice(0, half);
      const secondHalf = daysWithPain.slice(half);
      const fAvg = firstHalf.reduce((s, d) => s + d.avgPain, 0) / firstHalf.length;
      const sAvg = secondHalf.reduce((s, d) => s + d.avgPain, 0) / secondHalf.length;
      improvement = +(((sAvg - fAvg) / fAvg) * 100).toFixed(0);
    }

    return { totalSessions, totalMin, avgPain, improvement, activeDays: daysWithEx.length, totalDays: chartData.length };
  }, [chartData]);

  if (loading) {
    return (
      <Card className="p-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
      </Card>
    );
  }

  if (rawData.length === 0) {
    return (
      <Card className="p-6 text-center">
        <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No exercise logs yet</p>
        <p className="text-xs text-muted-foreground mt-1">Log exercises with pain ratings to visualize your improvement patterns.</p>
      </Card>
    );
  }

  const toneColors = {
    positive: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    info: "bg-sky-50 border-sky-200",
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Exercise Frequency × Pain Trend Report</h3>
            <p className="text-xs text-muted-foreground">Visualizing how your fitness progress reduces pain over time</p>
          </div>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {[
            { key: "7d", label: "7 Days" },
            { key: "30d", label: "30 Days" },
            { key: "90d", label: "90 Days" },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${range === r.key ? "bg-background shadow-sm text-violet-700" : "text-muted-foreground hover:text-foreground"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl bg-sky-50 p-3 border border-sky-100">
          <div className="flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-sky-600" />
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Total Sessions</p>
          </div>
          <p className="text-xl font-display font-bold text-sky-700 mt-1">{stats.totalSessions}</p>
          <p className="text-[10px] text-muted-foreground">{stats.activeDays} active days</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Total Minutes</p>
          </div>
          <p className="text-xl font-display font-bold text-emerald-700 mt-1">{stats.totalMin}</p>
          <p className="text-[10px] text-muted-foreground">of exercise</p>
        </div>
        <div className="rounded-xl bg-red-50 p-3 border border-red-100">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-red-600" />
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Avg Pain</p>
          </div>
          <p className="text-xl font-display font-bold text-red-700 mt-1">{stats.avgPain ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground">out of 10</p>
        </div>
        <div className={`rounded-xl p-3 border ${stats.improvement != null && stats.improvement < 0 ? "bg-emerald-50 border-emerald-100" : stats.improvement != null && stats.improvement > 0 ? "bg-amber-50 border-amber-100" : "bg-muted/50 border-border"}`}>
          <div className="flex items-center gap-1.5">
            {stats.improvement != null && stats.improvement < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            ) : stats.improvement != null && stats.improvement > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Improvement</p>
          </div>
          <p className={`text-xl font-display font-bold mt-1 ${stats.improvement != null && stats.improvement < 0 ? "text-emerald-700" : stats.improvement != null && stats.improvement > 0 ? "text-amber-700" : "text-muted-foreground"}`}>
            {stats.improvement != null ? `${stats.improvement > 0 ? "+" : ""}${stats.improvement}%` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">pain change</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-80 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartWithMA} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 9 }} interval={range === "90d" ? Math.floor(chartData.length / 8) : "preserveStartEnd"} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: "Sessions", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 10 }} label={{ value: "Pain (0-10)", angle: 90, position: "insideRight", style: { fontSize: 10 } }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border rounded-lg shadow-lg p-3 text-xs max-w-xs">
                    <p className="font-semibold mb-1">{d.dateLabel}</p>
                    <p className="text-sky-600">🏃 Exercise Sessions: {d.exerciseCount}</p>
                    <p className="text-emerald-600">⏱️ Duration: {d.totalMinutes} min</p>
                    {d.avgPain != null && <p className="text-red-500">📈 Avg Pain: {d.avgPain}/10</p>}
                    {d.painTrend != null && <p className="text-violet-500">📊 3-Day Trend: {d.painTrend}/10</p>}
                    {d.activities.length > 0 && <p className="mt-1 text-muted-foreground"><strong>Activities:</strong> {d.activities.join(", ")}</p>}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar yAxisId="left" dataKey="exerciseCount" fill="#38bdf8" name="Exercise Sessions" radius={[4, 4, 0, 0]} barSize={range === "90d" ? 6 : 14} />
            <Line yAxisId="right" type="monotone" dataKey="avgPain" stroke="#ef4444" strokeWidth={1.5} name="Daily Avg Pain" dot={{ r: 2 }} connectNulls />
            <Area yAxisId="right" type="monotone" dataKey="painTrend" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.1} name="3-Day Pain Trend" dot={false} connectNulls />
            <ReferenceLine yAxisId="right" y={5} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "Moderate", fontSize: 9, fill: "#f59e0b" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Improvement Pattern Analysis</h4>
        {insights.map((tip, i) => {
          const TipIcon = tip.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div className={`flex items-start gap-2 p-3 rounded-lg border ${toneColors[tip.tone] || "bg-muted/30 border-border"}`}>
                <TipIcon className={`w-4 h-4 ${tip.color} mt-0.5 shrink-0`} />
                <p className="text-xs leading-relaxed">{tip.text}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <Badge variant="outline" className="text-[10px]">
          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block mr-1" /> Exercise Sessions
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-1" /> Daily Pain Level
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          <span className="w-2 h-2 rounded-full bg-violet-500 inline-block mr-1" /> 3-Day Pain Trend
        </Badge>
      </div>
    </Card>
  );
}