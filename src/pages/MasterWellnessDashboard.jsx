import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  TrendingUp, Flame, Beef, Dumbbell, Scale, Activity, Award,
  Loader2, Droplets, Moon, Pill, Download
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Cell
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { motion } from "framer-motion";
import { generateWellnessReportPdf } from "@/lib/generateWellnessReportPdf";

export default function MasterWellnessDashboard() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [range, setRange] = useState("monthly"); // weekly | monthly
  const [loading, setLoading] = useState(true);
  const [nutrition, setNutrition] = useState([]);
  const [exercise, setExercise] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [wellnessLogs, setWellnessLogs] = useState([]);
  const [medLogs, setMedLogs] = useState([]);

  const days = range === "weekly" ? 7 : 30;

  useEffect(() => {
    const loadData = async () => {
      try {
        const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
        const medFilter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
        const [nutritionData, exerciseData, vitalData, wellnessData, medLogData] = await Promise.all([
          base44.entities.NutritionLog.filter(filter),
          base44.entities.ExerciseLog.filter(filter),
          currentMemberId
            ? base44.entities.VitalRecord.filter({ family_member_id: currentMemberId }, "-recorded_at", 500)
            : base44.entities.VitalRecord.list("-recorded_at", 500),
          base44.entities.WellnessLog.filter(filter),
          currentMemberId
            ? base44.entities.MedicationLog.filter({ family_member_id: currentMemberId })
            : base44.entities.MedicationLog.filter({}),
        ]);
        setNutrition(nutritionData);
        setExercise(exerciseData);
        setVitals(vitalData);
        setWellnessLogs(wellnessData);
        setMedLogs(medLogData);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadData();
  }, [currentMemberId]);

  // Build unified timeline data
  const timelineData = useMemo(() => {
    const dateRange = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() });
    return dateRange.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");

      // Nutrition
      const dayNutrition = nutrition.filter((n) => n.date === dateStr);
      const calories = dayNutrition.reduce((s, n) => s + (n.calories || 0), 0);
      const protein = Math.round(dayNutrition.reduce((s, n) => s + (n.protein_g || 0), 0));
      const carbs = Math.round(dayNutrition.reduce((s, n) => s + (n.carbs_g || 0), 0));
      const fat = Math.round(dayNutrition.reduce((s, n) => s + (n.fat_g || 0), 0));

      // Exercise
      const dayExercise = exercise.filter((e) => e.date === dateStr);
      const exerciseMin = dayExercise.reduce((s, e) => s + (e.duration_minutes || 0), 0);
      const exerciseCount = dayExercise.length;
      const avgPain = dayExercise.length > 0
        ? Math.round(dayExercise.filter((e) => e.pain_level != null).reduce((s, e) => s + e.pain_level, 0) / Math.max(dayExercise.filter((e) => e.pain_level != null).length, 1) * 10) / 10
        : null;

      // Vitals - weight
      const weightRecord = vitals.find((v) => v.type === "weight" && v.recorded_at && format(new Date(v.recorded_at), "yyyy-MM-dd") === dateStr);
      const weight = weightRecord?.value || null;

      // Vitals - sleep
      const sleepRecord = vitals.find((v) => v.type === "sleep_hours" && v.recorded_at && format(new Date(v.recorded_at), "yyyy-MM-dd") === dateStr);
      const sleepHours = sleepRecord?.value || null;

      // Vitals - activity
      const activityRecord = vitals.find((v) => v.type === "activity_minutes" && v.recorded_at && format(new Date(v.recorded_at), "yyyy-MM-dd") === dateStr);
      const activityMin = activityRecord?.value || 0;

      // Water
      const waterCups = wellnessLogs.find((w) => w.date === dateStr)?.water_cups || 0;

      // Medication adherence
      const dayMedLogs = medLogs.filter((l) => l.scheduled_date === dateStr);
      const takenMeds = dayMedLogs.filter((l) => l.status === "taken").length;
      const totalMeds = dayMedLogs.length;
      const medAdherence = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : null;

      // Pain from exercise logs
      const painLogs = dayExercise.filter((e) => e.pain_level != null);
      const painLevel = painLogs.length > 0
        ? Math.round(painLogs.reduce((s, e) => s + e.pain_level, 0) / painLogs.length * 10) / 10
        : null;

      return {
        date: format(date, range === "weekly" ? "EEE" : "MMM d"),
        dateStr,
        calories,
        protein,
        carbs,
        fat,
        exerciseMin: exerciseMin + activityMin,
        exerciseCount,
        weight,
        sleepHours,
        waterCups,
        medAdherence,
        painLevel,
      };
    });
  }, [nutrition, exercise, vitals, wellnessLogs, medLogs, days, range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
      </div>
    );
  }

  // Summary stats
  const daysWithWeight = timelineData.filter((d) => d.weight != null);
  const latestWeight = daysWithWeight[daysWithWeight.length - 1]?.weight;
  const firstWeight = daysWithWeight[0]?.weight;
  const weightChange = latestWeight != null && firstWeight != null ? (latestWeight - firstWeight) : null;

  const totalExercise = timelineData.reduce((s, d) => s + d.exerciseMin, 0);
  const avgPainOverall = (() => {
    const painDays = timelineData.filter((d) => d.painLevel != null);
    return painDays.length > 0 ? (painDays.reduce((s, d) => s + d.painLevel, 0) / painDays.length).toFixed(1) : "—";
  })();
  const totalCalories = timelineData.reduce((s, d) => s + d.calories, 0);
  const daysWithNutrition = timelineData.filter((d) => d.calories > 0).length;
  const avgCalories = daysWithNutrition > 0 ? Math.round(totalCalories / daysWithNutrition) : 0;

  const summaryStats = [
    { label: "Latest Weight", value: latestWeight != null ? latestWeight : "—", unit: "kg", icon: Scale, color: "text-violet-600", bg: "bg-violet-50", change: weightChange },
    { label: "Total Exercise", value: totalExercise, unit: "min", icon: Dumbbell, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Avg Pain Score", value: avgPainOverall, unit: "/10", icon: Activity, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Avg Calories", value: avgCalories, unit: "kcal/day", icon: Flame, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold">Master Wellness Dashboard</h1>
            <p className="text-sm text-muted-foreground">Your complete health journey at a glance · {currentMemberName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => generateWellnessReportPdf(timelineData, range)}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
          </Button>
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <Button size="sm" variant={range === "weekly" ? "default" : "ghost"} className={`h-8 ${range === "weekly" ? "bg-violet-600 hover:bg-violet-700" : ""}`} onClick={() => setRange("weekly")}>Weekly</Button>
            <Button size="sm" variant={range === "monthly" ? "default" : "ghost"} className={`h-8 ${range === "monthly" ? "bg-violet-600 hover:bg-violet-700" : ""}`} onClick={() => setRange("monthly")}>Monthly</Button>
          </div>
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
              {stat.change != null && (
                <p className={`text-[10px] mt-0.5 ${stat.change < 0 ? "text-emerald-600" : stat.change > 0 ? "text-rose-500" : "text-muted-foreground"}`}>
                  {stat.change < 0 ? "↓" : stat.change > 0 ? "↑" : ""} {Math.abs(stat.change).toFixed(1)} kg
                </p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Weight Trend */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="w-4 h-4 text-violet-600" />
          <h3 className="font-display font-semibold text-sm">Weight Trend</h3>
        </div>
        {daysWithWeight.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={range === "monthly" ? 3 : 0} />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [v != null ? `${v} kg` : "—", "Weight"]} />
              <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: "#8b5cf6" }} connectNulls name="Weight (kg)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">Log weight in your vitals to see trends</div>
        )}
      </Card>

      {/* Nutrition + Pain row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Nutrition Trends */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-emerald-600" />
            <h3 className="font-display font-semibold text-sm">Nutrition (Calories & Protein)</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={range === "monthly" ? 3 : 0} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar yAxisId="left" dataKey="calories" name="Calories" fill="#fb923c" radius={[3, 3, 0, 0]} barSize={range === "monthly" ? 8 : 16} />
              <Line yAxisId="right" type="monotone" dataKey="protein" name="Protein (g)" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* Pain Score Trend */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-rose-600" />
            <h3 className="font-display font-semibold text-sm">Pain Score Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="painGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={range === "monthly" ? 3 : 0} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [v != null ? `${v}/10` : "—", "Pain"]} />
              <ReferenceLine y={3} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Mild", fontSize: 9, fill: "#22c55e" }} />
              <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Severe", fontSize: 9, fill: "#ef4444" }} />
              <Area type="monotone" dataKey="painLevel" stroke="#f43f5e" strokeWidth={2} fill="url(#painGrad)" connectNulls name="Pain Level" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Fitness Activity + Exercise Count */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-4 h-4 text-orange-600" />
            <h3 className="font-display font-semibold text-sm">Daily Exercise Minutes</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={range === "monthly" ? 3 : 0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} min`, "Exercise"]} />
              <ReferenceLine y={30} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1} />
              <Bar dataKey="exerciseMin" fill="#f97316" radius={[3, 3, 0, 0]} name="Minutes" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-sky-600" />
            <h3 className="font-display font-semibold text-sm">Exercises Per Day</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={range === "monthly" ? 3 : 0} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [v, "Sessions"]} />
              <Bar dataKey="exerciseCount" fill="#0ea5e9" radius={[3, 3, 0, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Water + Sleep + Med Adherence row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-4 h-4 text-cyan-600" />
            <h3 className="font-display font-semibold text-sm">Water Intake</h3>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={range === "monthly" ? 4 : 0} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} formatter={(v) => [`${v} cups`, "Water"]} />
              <ReferenceLine y={8} stroke="#06b6d4" strokeDasharray="4 4" strokeWidth={1} />
              <Bar dataKey="waterCups" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Cups" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-indigo-600" />
            <h3 className="font-display font-semibold text-sm">Sleep Hours</h3>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={range === "monthly" ? 4 : 0} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} formatter={(v) => [v != null ? `${v} hrs` : "—", "Sleep"]} />
              <ReferenceLine y={8} stroke="#6366f1" strokeDasharray="4 4" strokeWidth={1} />
              <Line type="monotone" dataKey="sleepHours" stroke="#6366f1" strokeWidth={2} dot={{ r: 2, fill: "#6366f1" }} connectNulls name="Hours" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Pill className="w-4 h-4 text-emerald-600" />
            <h3 className="font-display font-semibold text-sm">Med Adherence</h3>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={range === "monthly" ? 4 : 0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} formatter={(v) => [v != null ? `${v}%` : "—", "Adherence"]} />
              <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} />
              <Bar dataKey="medAdherence" radius={[3, 3, 0, 0]} name="Adherence %">
                {timelineData.map((entry, i) => (
                  <Cell key={i} fill={entry.medAdherence == null ? "#e5e7eb" : entry.medAdherence >= 80 ? "#22c55e" : entry.medAdherence >= 50 ? "#f59e0b" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Macronutrient Breakdown */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Beef className="w-4 h-4 text-rose-600" />
          <h3 className="font-display font-semibold text-sm">Macronutrient Breakdown</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={range === "monthly" ? 3 : 0} />
            <YAxis tick={{ fontSize: 10 }} unit="g" />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}g`, ""]} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="protein" stackId="macros" fill="#ef4444" name="Protein (g)" />
            <Bar dataKey="carbs" stackId="macros" fill="#fbbf24" name="Carbs (g)" />
            <Bar dataKey="fat" stackId="macros" fill="#8b5cf6" name="Fat (g)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}