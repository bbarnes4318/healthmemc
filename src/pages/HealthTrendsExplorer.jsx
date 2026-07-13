import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  TrendingUp, TrendingDown, Minus, Loader2, Activity, Heart,
  Scale, Moon, Droplets, Thermometer, Footprints, Download, Calendar
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart
} from "recharts";
import { format, subMonths, parseISO, differenceInDays } from "date-fns";
import { motion } from "framer-motion";

const dataTypes = [
  { value: "heart_rate", label: "Heart Rate", icon: Heart, unit: "bpm", color: "#ef4444" },
  { value: "blood_pressure", label: "Blood Pressure", icon: Activity, unit: "mmHg", color: "#3b82f6" },
  { value: "weight", label: "Weight", icon: Scale, unit: "kg", color: "#8b5cf6" },
  { value: "sleep_hours", label: "Sleep", icon: Moon, unit: "hrs", color: "#6366f1" },
  { value: "temperature", label: "Temperature", icon: Thermometer, unit: "°F", color: "#ec4899" },
  { value: "blood_glucose", label: "Glucose", icon: Droplets, unit: "mg/dL", color: "#8b5cf6" },
  { value: "oxygen_saturation", label: "SpO2", icon: Droplets, unit: "%", color: "#06b6d4" },
  { value: "activity_minutes", label: "Activity", icon: Footprints, unit: "min", color: "#22c55e" },
  { value: "steps", label: "Steps", icon: Footprints, unit: "steps", color: "#f59e0b" },
];

const painScoreMap = { mild: 3, moderate: 6, severe: 9 };
const ranges = [
  { value: "3m", label: "3M", months: 3 },
  { value: "6m", label: "6M", months: 6 },
  { value: "1y", label: "1Y", months: 12 },
];

export default function HealthTrendsExplorer() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [vitals, setVitals] = useState([]);
  const [painEntries, setPainEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("weight");
  const [range, setRange] = useState("1y");
  const [showPainOverlay, setShowPainOverlay] = useState(false);

  const rangeMonths = ranges.find((r) => r.value === range)?.months || 12;
  const startDate = subMonths(new Date(), rangeMonths);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
        const [vitalData, painData] = await Promise.all([
          currentMemberId
            ? base44.entities.VitalRecord.filter({ family_member_id: currentMemberId }, "-recorded_at", 2000)
            : base44.entities.VitalRecord.list("-recorded_at", 2000),
          base44.entities.SymptomMap.filter(filter, "-logged_at", 2000),
        ]);
        setVitals(vitalData);
        setPainEntries(painData);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  // Filter vitals within date range
  const filteredVitals = useMemo(() => {
    return vitals.filter((v) => {
      const d = v.recorded_at ? new Date(v.recorded_at) : new Date(v.created_date);
      return d >= startDate;
    });
  }, [vitals, startDate]);

  const filteredPain = useMemo(() => {
    return painEntries.filter((p) => {
      const d = p.logged_at ? new Date(p.logged_at) : new Date(p.created_date);
      return d >= startDate;
    });
  }, [painEntries, startDate]);

  // Build chart data for selected vital type
  const chartData = useMemo(() => {
    const selected = dataTypes.find((d) => d.value === selectedType);
    if (!selected) return [];

    const records = filteredVitals
      .filter((v) => v.type === selectedType)
      .sort((a, b) => new Date(a.recorded_at || a.created_date) - new Date(b.recorded_at || b.created_date));

    // For blood pressure, include secondary value
    return records.map((r) => {
      const date = r.recorded_at ? parseISO(r.recorded_at) : new Date(r.created_date);
      const point = {
        date: format(date, "MMM d, yy"),
        sortKey: date.getTime(),
        value: r.value,
        secondary: r.secondary_value,
        notes: r.notes,
      };
      if (selectedType === "blood_pressure" && r.secondary_value) {
        point.display = `${r.value}/${r.secondary_value}`;
      }
      return point;
    });
  }, [filteredVitals, selectedType]);

  // Build pain data (avg per week) for overlay
  const painWeeklyData = useMemo(() => {
    if (filteredPain.length === 0) return [];

    const byWeek = {};
    for (const p of filteredPain) {
      const date = p.logged_at ? parseISO(p.logged_at) : new Date(p.created_date);
      const weekKey = format(date, "MMM d, yy");
      if (!byWeek[weekKey]) byWeek[weekKey] = [];
      byWeek[weekKey].push(painScoreMap[p.severity] || 0);
    }

    return Object.entries(byWeek).map(([week, scores]) => ({
      date: week,
      sortKey: parseISO(filteredPain.find((p) => format(p.logged_at ? parseISO(p.logged_at) : new Date(p.created_date), "MMM d, yy") === week)?.logged_at || new Date()).getTime(),
      pain: Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10,
    })).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredPain]);

  // Combined data for overlay
  const combinedData = useMemo(() => {
    if (!showPainOverlay) return chartData;
    // Merge by nearest date
    const merged = [...chartData.map((d) => ({ ...d, pain: null }))];
    for (const p of painWeeklyData) {
      // Find closest vital entry
      let closest = null;
      let minDiff = Infinity;
      for (const m of merged) {
        const diff = Math.abs(m.sortKey - p.sortKey);
        if (diff < minDiff) { minDiff = diff; closest = m; }
      }
      if (closest && minDiff < 7 * 24 * 60 * 60 * 1000) {
        closest.pain = p.pain;
      }
    }
    return merged;
  }, [chartData, painWeeklyData, showPainOverlay]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const selected = dataTypes.find((d) => d.value === selectedType);
    if (!selected || chartData.length === 0) return null;

    const values = chartData.map((d) => d.value);
    const latest = values[values.length - 1];
    const first = values[0];
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const change = latest - first;
    const changePct = first !== 0 ? ((change / first) * 100).toFixed(1) : 0;

    let trend;
    if (Math.abs(change) < (max - min) * 0.1) {
      trend = { direction: "stable", icon: Minus, color: "text-amber-600", label: "Stable" };
    } else if (change > 0) {
      trend = { direction: "up", icon: TrendingUp, color: "text-rose-600", label: "Increasing" };
    } else {
      trend = { direction: "down", icon: TrendingDown, color: "text-emerald-600", label: "Decreasing" };
    }

    // Data completeness - how many days have entries vs total days in range
    const uniqueDays = new Set(chartData.map((d) => d.date)).size;
    const totalDays = differenceInDays(new Date(), startDate) + 1;
    const completeness = Math.round((uniqueDays / totalDays) * 100);

    return { latest, first, avg, max, min, change, changePct, trend, completeness, totalDays, uniqueDays };
  }, [chartData, selectedType, startDate]);

  // Overall health score across all vitals
  const overallHealth = useMemo(() => {
    if (filteredVitals.length === 0) return null;

    const latestByType = {};
    for (const v of filteredVitals) {
      if (!latestByType[v.type] || new Date(v.recorded_at || v.created_date) > new Date(latestByType[v.type].recorded_at || latestByType[v.type].created_date)) {
        latestByType[v.type] = v;
      }
    }

    const metrics = [];
    // Heart rate: 60-100 normal
    if (latestByType.heart_rate) {
      const hr = latestByType.heart_rate.value;
      const score = hr >= 60 && hr <= 100 ? 100 : hr >= 50 && hr <= 110 ? 70 : 40;
      metrics.push({ label: "Heart Rate", value: hr, score, unit: "bpm" });
    }
    // Blood pressure: <120/80 normal
    if (latestByType.blood_pressure) {
      const bp = latestByType.blood_pressure.value;
      const score = bp < 120 ? 100 : bp < 130 ? 80 : bp < 140 ? 60 : 40;
      metrics.push({ label: "Blood Pressure", value: `${bp}/${latestByType.blood_pressure.secondary_value || ""}`, score, unit: "mmHg" });
    }
    // SpO2: >95 normal
    if (latestByType.oxygen_saturation) {
      const o2 = latestByType.oxygen_saturation.value;
      const score = o2 >= 95 ? 100 : o2 >= 90 ? 70 : 40;
      metrics.push({ label: "Oxygen", value: o2, score, unit: "%" });
    }
    // Sleep: 7-9 hrs ideal
    if (latestByType.sleep_hours) {
      const sl = latestByType.sleep_hours.value;
      const score = sl >= 7 && sl <= 9 ? 100 : sl >= 6 && sl <= 10 ? 70 : 40;
      metrics.push({ label: "Sleep", value: sl, score, unit: "hrs" });
    }
    // Activity: >30 min ideal
    if (latestByType.activity_minutes) {
      const act = latestByType.activity_minutes.value;
      const score = act >= 30 ? 100 : act >= 15 ? 70 : 40;
      metrics.push({ label: "Activity", value: act, score, unit: "min" });
    }

    if (metrics.length === 0) return null;
    const avgScore = Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length);
    return { metrics, avgScore };
  }, [filteredVitals]);

  const selectedTypeObj = dataTypes.find((d) => d.value === selectedType);
  const TrendIcon = summaryStats?.trend.icon || Minus;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold">Health Trends Explorer</h1>
            <p className="text-sm text-muted-foreground">Long-term health metrics · {currentMemberName}</p>
          </div>
        </div>

        {/* Range selector */}
        <div className="flex items-center bg-muted rounded-lg p-0.5">
          {ranges.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={range === r.value ? "default" : "ghost"}
              className={`h-8 ${range === r.value ? "bg-sky-600 hover:bg-sky-700" : ""}`}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overall Health Score */}
      {overallHealth && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-sky-600" />
            <h3 className="font-display font-semibold text-sm">Overall Health Assessment</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Score gauge */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-50">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={overallHealth.avgScore >= 70 ? "#22c55e" : overallHealth.avgScore >= 50 ? "#eab308" : "#ef4444"}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(overallHealth.avgScore / 100) * 264} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-display font-bold">{overallHealth.avgScore}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Health Score</p>
            </div>

            {/* Per-metric scores */}
            {overallHealth.metrics.map((m) => (
              <div key={m.label} className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/40">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  m.score >= 80 ? "bg-emerald-100 text-emerald-700" :
                  m.score >= 60 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {m.score}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">{m.label}</p>
                <p className="text-xs font-semibold">{m.value} <span className="text-muted-foreground font-normal">{m.unit}</span></p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Data Type Toggle */}
      <div className="flex flex-wrap gap-2">
        {dataTypes.map((dt) => {
          const isActive = selectedType === dt.value;
          const hasData = filteredVitals.some((v) => v.type === dt.value);
          return (
            <button
              key={dt.value}
              onClick={() => setSelectedType(dt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-sky-600 text-white shadow-sm"
                  : hasData
                    ? "bg-muted text-gray-700 hover:bg-sky-100"
                    : "bg-muted/30 text-muted-foreground/50"
              }`}
            >
              <dt.icon className="w-3.5 h-3.5" style={{ color: isActive ? "white" : dt.color }} />
              {dt.label}
            </button>
          );
        })}
      </div>

      {/* Summary Stats */}
      {summaryStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Latest", value: selectedTypeObj.value === "blood_pressure"
                ? `${summaryStats.latest}${chartData[chartData.length-1]?.secondary ? "/" + chartData[chartData.length-1].secondary : ""}`
                : summaryStats.latest, unit: selectedTypeObj.unit },
            { label: "Average", value: summaryStats.avg.toFixed(1), unit: selectedTypeObj.unit },
            { label: "Range", value: `${summaryStats.min}–${summaryStats.max}`, unit: selectedTypeObj.unit },
            { label: "Change", value: summaryStats.change > 0 ? `+${summaryStats.change.toFixed(1)}` : summaryStats.change.toFixed(1), unit: `(${summaryStats.changePct}%)` },
            { label: "Tracking", value: `${summaryStats.completeness}%`, unit: `${summaryStats.uniqueDays} days` },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
              <Card className="p-3">
                <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
                <div className="flex items-end gap-1 mt-0.5">
                  <span className="text-lg font-display font-bold" style={{ color: i === 3 && summaryStats.change > 0 ? "#ef4444" : i === 3 && summaryStats.change < 0 ? "#22c55e" : undefined }}>
                    {stat.value}
                  </span>
                  <span className="text-[10px] text-muted-foreground mb-0.5">{stat.unit}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : null}

      {/* Trend indicator */}
      {summaryStats && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 ${summaryStats.trend.color}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{summaryStats.trend.label}</span>
          </div>
          {filteredPain.length > 0 && (
            <button
              onClick={() => setShowPainOverlay(!showPainOverlay)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                showPainOverlay ? "bg-red-100 text-red-700 border border-red-200" : "bg-muted text-muted-foreground hover:bg-red-50"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              {showPainOverlay ? "✓ Pain overlay on" : "Overlay pain levels"}
            </button>
          )}
        </div>
      )}

      {/* Main Chart */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <selectedTypeObj.icon className="w-4 h-4" style={{ color: selectedTypeObj.color }} />
          <h3 className="font-display font-semibold text-sm">
            {selectedTypeObj.label} — Last {rangeMonths} months
          </h3>
        </div>

        {chartData.length < 2 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            Not enough data for {selectedTypeObj.label}. Log at least 2 readings to see trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={combinedData} margin={{ top: 5, right: showPainOverlay ? 40 : 10, bottom: 5, left: -10 }}>
              <defs>
                <linearGradient id={`grad-${selectedType}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={selectedTypeObj.color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={selectedTypeObj.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={30} />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              {showPainOverlay && (
                <YAxis yAxisId="pain" orientation="right" domain={[0, 10]} tick={{ fontSize: 10 }} tickFormatter={(v) => v === 0 ? "" : v <= 3 ? "M" : v <= 6 ? "Mod" : "S"} />
              )}
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(value, name) => {
                  if (name === "pain") return [value != null ? `${value}/10` : "—", "Pain"];
                  if (selectedType === "blood_pressure" && value) {
                    const entry = combinedData.find((d) => d.value === value);
                    return [entry?.display || value, selectedTypeObj.label];
                  }
                  return [value, selectedTypeObj.label];
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={selectedTypeObj.color}
                strokeWidth={2.5}
                fill={`url(#grad-${selectedType})`}
                dot={{ r: 2, fill: selectedTypeObj.color }}
                activeDot={{ r: 5 }}
                connectNulls
                name={selectedTypeObj.label}
              />
              {showPainOverlay && (
                <Line
                  yAxisId="pain"
                  type="monotone"
                  dataKey="pain"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: "#f43f5e" }}
                  connectNulls
                  name="pain"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Pain Summary */}
      {filteredPain.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-rose-600" />
            <h3 className="font-display font-semibold text-sm">Pain Entries — Last {rangeMonths} months</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={painWeeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={30} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickFormatter={(v) => v === 0 ? "" : v <= 3 ? "Mild" : v <= 6 ? "Mod" : "Sev"} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}/10`, "Avg Pain"]} />
              <ReferenceLine y={3} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Mild", fontSize: 9, fill: "#22c55e" }} />
              <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Severe", fontSize: 9, fill: "#ef4444" }} />
              <Bar dataKey="pain" fill="#f43f5e" radius={[3, 3, 0, 0]} name="Pain Level" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {filteredVitals.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No health data recorded yet. Start logging vitals to see your long-term trends here.
          </p>
        </Card>
      )}
    </div>
  );
}