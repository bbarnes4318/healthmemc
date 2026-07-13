import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  Loader2, FlaskConical, TrendingUp, TrendingDown, Minus, Target,
  Activity, Heart, Droplet, Thermometer, Moon, Footprints, Gauge, CheckCircle, AlertCircle
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, ReferenceLine, Legend
} from "recharts";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

// Reference ranges for health markers
const markerConfig = {
  blood_pressure: {
    label: "Blood Pressure (Systolic)",
    icon: Heart,
    color: "#ef4444",
    unit: "mmHg",
    range: [90, 120],
    warningRange: [120, 140],
    highLabel: "Elevated",
    optimalLabel: "Normal",
    getValue: (r) => r.value,
  },
  blood_glucose: {
    label: "Blood Glucose (Fasting)",
    icon: Droplet,
    color: "#8b5cf6",
    unit: "mg/dL",
    range: [70, 99],
    warningRange: [100, 125],
    highLabel: "Pre-diabetic",
    optimalLabel: "Normal",
    getValue: (r) => r.value,
  },
  heart_rate: {
    label: "Heart Rate",
    icon: Activity,
    color: "#f97316",
    unit: "bpm",
    range: [60, 100],
    optimalLabel: "Normal",
    highLabel: "Elevated",
    getValue: (r) => r.value,
  },
  oxygen_saturation: {
    label: "Oxygen Saturation",
    icon: Gauge,
    color: "#06b6d4",
    unit: "%",
    range: [95, 100],
    optimalLabel: "Normal",
    highLabel: "Low",
    getValue: (r) => r.value,
  },
  temperature: {
    label: "Temperature",
    icon: Thermometer,
    color: "#f59e0b",
    unit: "°F",
    range: [97, 99.5],
    optimalLabel: "Normal",
    highLabel: "Fever",
    getValue: (r) => r.value,
  },
  weight: {
    label: "Weight",
    icon: Activity,
    color: "#10b981",
    unit: "kg",
    optimalLabel: "Tracked",
    getValue: (r) => r.value,
  },
  sleep_hours: {
    label: "Sleep Hours",
    icon: Moon,
    color: "#6366f1",
    unit: "hrs",
    range: [7, 9],
    optimalLabel: "Recommended",
    highLabel: "Low",
    getValue: (r) => r.value,
  },
  steps: {
    label: "Daily Steps",
    icon: Footprints,
    color: "#14b8a6",
    unit: "steps",
    range: [8000, 15000],
    optimalLabel: "Active",
    highLabel: "Below Target",
    getValue: (r) => r.value,
  },
  activity_minutes: {
    label: "Activity Minutes",
    icon: Activity,
    color: "#22c55e",
    unit: "min",
    range: [30, 120],
    optimalLabel: "Recommended",
    highLabel: "Below Target",
    getValue: (r) => r.value,
  },
};

export default function LabTrendDashboard() {
  const { currentMemberId } = useFamilyMember();
  const [allVitals, setAllVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMarker, setActiveMarker] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
        const data = await base44.entities.VitalRecord.filter(filter, "recorded_at", 200);
        setAllVitals(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  // Group by marker type
  const byMarker = useMemo(() => {
    const groups = {};
    for (const v of allVitals) {
      if (!v.type || !markerConfig[v.type]) continue;
      if (!groups[v.type]) groups[v.type] = [];
      groups[v.type].push(v);
    }
    // Sort each group chronologically
    Object.keys(groups).forEach((k) => {
      groups[k].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
    });
    return groups;
  }, [allVitals]);

  const availableMarkers = Object.keys(byMarker);

  useEffect(() => {
    if (availableMarkers.length > 0 && !activeMarker) {
      setActiveMarker(availableMarkers[0]);
    }
  }, [availableMarkers, activeMarker]);

  const chartData = useMemo(() => {
    if (!activeMarker || !byMarker[activeMarker]) return [];
    const cfg = markerConfig[activeMarker];
    return byMarker[activeMarker].map((r) => {
      const val = cfg.getValue(r);
      const inRange = cfg.range && val >= cfg.range[0] && val <= cfg.range[1];
      const inWarning = cfg.warningRange && val >= cfg.warningRange[0] && val <= cfg.warningRange[1];
      const outOfRange = cfg.range && (val < cfg.range[0] || val > (cfg.warningRange ? cfg.warningRange[1] : cfg.range[1]));
      return {
        date: r.recorded_at,
        dateLabel: r.recorded_at ? format(parseISO(r.recorded_at), "MMM d, yy") : "",
        value: val,
        inRange,
        inWarning,
        outOfRange,
        notes: r.notes,
      };
    });
  }, [activeMarker, byMarker]);

  const stats = useMemo(() => {
    if (!activeMarker || chartData.length === 0) return null;
    const cfg = markerConfig[activeMarker];
    const values = chartData.map((d) => d.value);
    const latest = values[values.length - 1];
    const first = values[0];
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const inRangeCount = chartData.filter((d) => d.inRange).length;
    const inRangePct = Math.round((inRangeCount / chartData.length) * 100);
    const trend = latest - first;
    const trendPct = first !== 0 ? ((trend / Math.abs(first)) * 100) : 0;

    const latestStatus = cfg.range
      ? (latest >= cfg.range[0] && latest <= cfg.range[1] ? "in_range"
        : cfg.warningRange && latest >= cfg.warningRange[0] && latest <= cfg.warningRange[1] ? "warning"
        : "out_of_range")
      : "tracked";

    return { latest, first, avg, min, max, inRangeCount, inRangePct, trend, trendPct, latestStatus, count: values.length };
  }, [activeMarker, chartData]);

  if (loading) {
    return (
      <Card className="p-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </Card>
    );
  }

  if (availableMarkers.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FlaskConical className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No lab or vital data to trend yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Upload lab reports in Medical Records and use the "Extract Lab Values" button, or log vitals in your Health Dashboard.
        </p>
      </Card>
    );
  }

  const cfg = markerConfig[activeMarker];
  const MIcon = cfg.icon;

  const statusColors = {
    in_range: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle, label: "In Target Range" },
    warning: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: AlertCircle, label: cfg.highLabel || "Borderline" },
    out_of_range: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: AlertCircle, label: "Out of Range" },
    tracked: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200", icon: Activity, label: "Tracked" },
  };
  const StatusIcon = stats ? statusColors[stats.latestStatus].icon : Activity;

  return (
    <div className="space-y-4">
      {/* Marker selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {availableMarkers.map((key) => {
          const mc = markerConfig[key];
          const McIcon = mc.icon;
          const isActive = activeMarker === key;
          const count = byMarker[key].length;
          return (
            <button
              key={key}
              onClick={() => setActiveMarker(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                isActive ? `${mc.color === "#ef4444" ? "bg-red-50 border-red-300 text-red-700" : mc.color === "#8b5cf6" ? "bg-violet-50 border-violet-300 text-violet-700" : "bg-sky-50 border-sky-300 text-sky-700"}` : "border-border bg-card text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <McIcon className="w-3.5 h-3.5" style={{ color: mc.color }} />
              {mc.label.split("(")[0].trim()}
              <span className="text-[9px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Main chart card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.color + "20" }}>
              <MIcon className="w-4 h-4" style={{ color: cfg.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{cfg.label}</h3>
              <p className="text-xs text-muted-foreground">{stats?.count || 0} readings tracked</p>
            </div>
          </div>
          {stats && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${statusColors[stats.latestStatus].bg} ${statusColors[stats.latestStatus].border}`}>
              <StatusIcon className={`w-3.5 h-3.5 ${statusColors[stats.latestStatus].text}`} />
              <span className={`text-xs font-semibold ${statusColors[stats.latestStatus].text}`}>
                {statusColors[stats.latestStatus].label}
              </span>
            </div>
          )}
        </div>

        {/* Summary stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
            <div className="rounded-lg bg-muted/30 p-2.5 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">Latest</p>
              <p className="text-base font-display font-bold" style={{ color: cfg.color }}>{stats.latest}</p>
              <p className="text-[9px] text-muted-foreground">{cfg.unit}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">Average</p>
              <p className="text-base font-display font-bold text-foreground">{stats.avg.toFixed(1)}</p>
              <p className="text-[9px] text-muted-foreground">{cfg.unit}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">Range</p>
              <p className="text-base font-display font-bold text-foreground">{stats.min}–{stats.max}</p>
              <p className="text-[9px] text-muted-foreground">{cfg.unit}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">Trend</p>
              <p className={`text-base font-display font-bold flex items-center justify-center gap-0.5 ${stats.trend < 0 ? "text-emerald-600" : stats.trend > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                {stats.trend < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : stats.trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                {stats.trend > 0 ? "+" : ""}{stats.trend.toFixed(1)}
              </p>
              <p className="text-[9px] text-muted-foreground">{stats.trendPct > 0 ? "+" : ""}{stats.trendPct.toFixed(0)}%</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5 text-center">
              <p className="text-[9px] text-muted-foreground uppercase">In Range</p>
              <p className="text-base font-display font-bold text-emerald-600">{stats.inRangePct}%</p>
              <p className="text-[9px] text-muted-foreground">{stats.inRangeCount}/{stats.count}</p>
            </div>
          </div>
        )}

        {/* Trend Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload[0]) return null;
                  const d = payload[0].payload;
                  const statusLabel = d.inRange ? "In Range" : d.inWarning ? cfg.highLabel || "Borderline" : "Out of Range";
                  const statusColor = d.inRange ? "text-emerald-600" : d.inWarning ? "text-amber-600" : "text-red-600";
                  return (
                    <div className="bg-white border rounded-lg shadow-lg p-3 text-xs max-w-xs">
                      <p className="font-semibold mb-1">{d.dateLabel}</p>
                      <p style={{ color: cfg.color }} className="font-bold text-base">{d.value} {cfg.unit}</p>
                      <p className={statusColor}>● {statusLabel}</p>
                      {d.notes && <p className="text-muted-foreground mt-1">{d.notes}</p>}
                    </div>
                  );
                }}
              />
              {/* Target range band */}
              {cfg.range && (
                <ReferenceArea y1={cfg.range[0]} y2={cfg.range[1]} fill="#10b981" fillOpacity={0.08} />
              )}
              {/* Warning range band */}
              {cfg.warningRange && (
                <ReferenceArea y1={cfg.warningRange[0]} y2={cfg.warningRange[1]} fill="#f59e0b" fillOpacity={0.08} />
              )}
              {/* Reference lines */}
              {cfg.range && (
                <>
                  <ReferenceLine y={cfg.range[0]} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} label={{ value: `Min ${cfg.range[0]}`, fontSize: 8, fill: "#10b981", position: "insideBottomLeft" }} />
                  <ReferenceLine y={cfg.range[1]} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} label={{ value: `Max ${cfg.range[1]}`, fontSize: 8, fill: "#10b981", position: "insideTopLeft" }} />
                </>
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={cfg.color}
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const fill = payload.inRange ? "#10b981" : payload.inWarning ? "#f59e0b" : "#ef4444";
                  return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={fill} stroke="#fff" strokeWidth={1.5} />;
                }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1" /> In Target Range
          </Badge>
          {cfg.warningRange && (
            <Badge variant="outline" className="text-[10px]">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1" /> {cfg.highLabel}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-1" /> Out of Range
          </Badge>
          {cfg.range && (
            <Badge variant="outline" className="text-[10px]">
              <Target className="w-2.5 h-2.5 mr-1 text-emerald-600" /> Target: {cfg.range[0]}–{cfg.range[1]} {cfg.unit}
            </Badge>
          )}
        </div>

        {/* Reading history */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Reading History</h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {[...chartData].reverse().slice(0, 10).map((d, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-xs">
                <span className="text-muted-foreground">{d.dateLabel}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: cfg.color }}>{d.value} {cfg.unit}</span>
                  {d.inRange ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px]">In Range</Badge>
                  ) : d.inWarning ? (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px]">{cfg.highLabel}</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[9px]">Out of Range</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}