import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Droplets, Flame, Dumbbell, Moon, Pill, Loader2,
  Award, Target, Zap
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";

export default function WellnessTrends() {
  const [range, setRange] = useState("weekly");
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentMemberId } = useFamilyMember();

  const days = range === "weekly" ? 7 : 30;

  const loadData = useCallback(async () => {
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const medFilter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
      const [water, nutrition, exercise, vitals, medLogs, medications] = await Promise.all([
        base44.entities.WellnessLog.filter(filter),
        base44.entities.NutritionLog.filter(filter),
        base44.entities.ExerciseLog.filter(filter),
        currentMemberId
          ? base44.entities.VitalRecord.filter({ family_member_id: currentMemberId }, "-recorded_at", 500)
          : base44.entities.VitalRecord.list("-recorded_at", 500),
        currentMemberId
          ? base44.entities.MedicationLog.filter({ family_member_id: currentMemberId })
          : base44.entities.MedicationLog.filter({}),
        base44.entities.Medication.filter(medFilter),
      ]);
      setRawData({ water, nutrition, exercise, vitals, medLogs, medications });
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentMemberId]);

  useEffect(() => { loadData(); }, [loadData]);

  const chartData = useMemo(() => {
    if (!rawData) return [];
    const { water, nutrition, exercise, vitals, medLogs, medications } = rawData;
    const dateRange = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() });

    return dateRange.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");

      const waterCups = water.find((w) => w.date === dateStr)?.water_cups || 0;

      const dayNutrition = nutrition.filter((n) => n.date === dateStr);
      const calories = dayNutrition.reduce((s, n) => s + (n.calories || 0), 0);
      const protein = dayNutrition.reduce((s, n) => s + (n.protein_g || 0), 0);
      const carbs = dayNutrition.reduce((s, n) => s + (n.carbs_g || 0), 0);
      const fat = dayNutrition.reduce((s, n) => s + (n.fat_g || 0), 0);

      const dayExercise = exercise.filter((e) => e.date === dateStr);
      const exerciseMin = dayExercise.reduce((s, e) => s + (e.duration_minutes || 0), 0);

      const sleepVital = vitals.find((v) => v.type === "sleep_hours" && v.recorded_at && format(new Date(v.recorded_at), "yyyy-MM-dd") === dateStr);
      const sleepHours = sleepVital?.value || 0;

      const activityVital = vitals.find((v) => v.type === "activity_minutes" && v.recorded_at && format(new Date(v.recorded_at), "yyyy-MM-dd") === dateStr);
      const activityMin = activityVital?.value || 0;

      const dayMedLogs = medLogs.filter((l) => l.scheduled_date === dateStr);
      const takenMeds = dayMedLogs.filter((l) => l.status === "taken").length;
      const totalMeds = dayMedLogs.length;
      const medAdherence = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : null;

      const scores = [];
      if (waterCups > 0) scores.push(Math.min(100, (waterCups / 8) * 100));
      if (exerciseMin > 0) scores.push(Math.min(100, ((exerciseMin + activityMin) / 30) * 100));
      if (sleepHours > 0) scores.push(Math.min(100, (sleepHours / 8) * 100));
      if (calories > 0) scores.push(100);
      if (medAdherence !== null) scores.push(medAdherence);
      const wellnessScore = scores.length > 0
        ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
        : null;

      return {
        date: format(date, range === "weekly" ? "EEE" : "MMM d"),
        dateStr,
        waterCups,
        calories,
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        exerciseMin: exerciseMin + activityMin,
        sleepHours,
        medAdherence,
        wellnessScore,
      };
    });
  }, [rawData, days, range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  const hasData = chartData.some((d) => d.wellnessScore !== null);
  const avgScore = hasData
    ? Math.round(chartData.filter((d) => d.wellnessScore !== null).reduce((s, d) => s + d.wellnessScore, 0) / chartData.filter((d) => d.wellnessScore !== null).length)
    : 0;
  const bestDay = chartData.filter((d) => d.wellnessScore !== null).sort((a, b) => b.wellnessScore - a.wellnessScore)[0];
  const totalWater = chartData.reduce((s, d) => s + d.waterCups, 0);
  const totalExercise = chartData.reduce((s, d) => s + d.exerciseMin, 0);
  const totalCalories = chartData.reduce((s, d) => s + d.calories, 0);
  const daysWithNutrition = chartData.filter((d) => d.calories > 0).length;
  const avgCalories = daysWithNutrition > 0 ? Math.round(totalCalories / daysWithNutrition) : 0;

  const summaryStats = [
    { label: "Avg Wellness Score", value: avgScore, unit: "/100", icon: Award, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Water", value: totalWater, unit: "cups", icon: Droplets, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "Total Exercise", value: totalExercise, unit: "min", icon: Dumbbell, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Avg Calories", value: avgCalories, unit: "kcal/day", icon: Flame, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-5">
      {/* Header + Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold">Wellness Trends</h1>
            <p className="text-sm text-muted-foreground">Aggregated daily progress across all wellness metrics</p>
          </div>
        </div>
        <div className="flex items-center bg-muted rounded-lg p-0.5">
          <Button
            size="sm"
            variant={range === "weekly" ? "default" : "ghost"}
            className={`h-8 ${range === "weekly" ? "bg-sky-600 hover:bg-sky-700" : ""}`}
            onClick={() => setRange("weekly")}
          >
            Weekly
          </Button>
          <Button
            size="sm"
            variant={range === "monthly" ? "default" : "ghost"}
            className={`h-8 ${range === "monthly" ? "bg-sky-600 hover:bg-sky-700" : ""}`}
            onClick={() => setRange("monthly")}
          >
            Monthly
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryStats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            <Card className="p-4">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <div className="flex items-end gap-1 mt-0.5">
                <span className="text-2xl font-display font-bold">{stat.value}</span>
                <span className="text-xs text-muted-foreground mb-1">{stat.unit}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {bestDay && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <Target className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-800">
            Best day: <span className="font-semibold">{bestDay.date}</span> with a wellness score of <span className="font-semibold">{bestDay.wellnessScore}/100</span>
          </p>
        </div>
      )}

      {/* Wellness Score Chart */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-emerald-600" />
          <h3 className="font-display font-semibold text-sm">Daily Wellness Score</h3>
        </div>
        {hasData ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="wellnessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={range === "monthly" ? 3 : 0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [v != null ? `${v}/100` : "—", "Score"]} />
              <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} />
              <Area type="monotone" dataKey="wellnessScore" stroke="#10b981" strokeWidth={2} fill="url(#wellnessGrad)" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            Start logging water, nutrition, exercise, or vitals to see your wellness score
          </div>
        )}
      </Card>

      {/* Water + Exercise row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-4 h-4 text-cyan-600" />
            <h3 className="font-display font-semibold text-sm">Water Intake</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={range === "monthly" ? 3 : 0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} cups`, "Water"]} />
              <ReferenceLine y={8} stroke="#06b6d4" strokeDasharray="4 4" strokeWidth={1} />
              <Bar dataKey="waterCups" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Cups" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-4 h-4 text-orange-600" />
            <h3 className="font-display font-semibold text-sm">Exercise Minutes</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={range === "monthly" ? 3 : 0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} min`, "Exercise"]} />
              <ReferenceLine y={30} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1} />
              <Bar dataKey="exerciseMin" fill="#f97316" radius={[3, 3, 0, 0]} name="Minutes" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Nutrition + Sleep row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-rose-600" />
            <h3 className="font-display font-semibold text-sm">Daily Calories</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={range === "monthly" ? 3 : 0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="calories" fill="#f43f5e" radius={[3, 3, 0, 0]} name="Calories" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-indigo-600" />
            <h3 className="font-display font-semibold text-sm">Sleep Hours</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={range === "monthly" ? 3 : 0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} hrs`, "Sleep"]} />
              <ReferenceLine y={8} stroke="#6366f1" strokeDasharray="4 4" strokeWidth={1} />
              <Line type="monotone" dataKey="sleepHours" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: "#6366f1" }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Medication Adherence */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Pill className="w-4 h-4 text-emerald-600" />
          <h3 className="font-display font-semibold text-sm">Medication Adherence</h3>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={range === "monthly" ? 3 : 0} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [v != null ? `${v}%` : "—", "Adherence"]} />
            <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} />
            <Bar dataKey="medAdherence" radius={[3, 3, 0, 0]} name="Adherence %">
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.medAdherence == null ? "#e5e7eb" : entry.medAdherence >= 80 ? "#22c55e" : entry.medAdherence >= 50 ? "#f59e0b" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}