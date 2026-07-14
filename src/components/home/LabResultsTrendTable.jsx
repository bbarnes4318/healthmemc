import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FlaskConical, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceArea, CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";

const MARKERS = {
  blood_pressure: { label: "Blood Pressure", unit: "mmHg", color: "#ef4444", range: [90, 120], warning: [120, 140], getVal: (r) => r.value, fmt: (r) => r.secondary_value ? `${r.value}/${r.secondary_value}` : `${r.value}` },
  blood_glucose: { label: "Blood Glucose", unit: "mg/dL", color: "#8b5cf6", range: [70, 99], warning: [100, 125], getVal: (r) => r.value, fmt: (r) => `${r.value}` },
  heart_rate: { label: "Heart Rate", unit: "bpm", color: "#f97316", range: [60, 100], getVal: (r) => r.value, fmt: (r) => `${r.value}` },
  oxygen_saturation: { label: "Oxygen Sat.", unit: "%", color: "#06b6d4", range: [95, 100], getVal: (r) => r.value, fmt: (r) => `${r.value}` },
  temperature: { label: "Temperature", unit: "\u00B0F", color: "#f59e0b", range: [97, 99.5], getVal: (r) => r.value, fmt: (r) => `${r.value}` },
  weight: { label: "Weight", unit: "kg", color: "#10b981", getVal: (r) => r.value, fmt: (r) => `${r.value}` },
};

const STATUS_STYLES = {
  in_range: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Normal" },
  warning: { bg: "bg-amber-100", text: "text-amber-700", label: "Borderline" },
  out_of_range: { bg: "bg-red-100", text: "text-red-700", label: "Out of Range" },
  tracked: { bg: "bg-sky-100", text: "text-sky-700", label: "Tracked" },
};

export default function LabResultsTrendTable() {
  const { currentMemberId } = useFamilyMember();
  const [allVitals, setAllVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

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

  const byMarker = useMemo(() => {
    const groups = {};
    for (const v of allVitals) {
      if (!v.type || !MARKERS[v.type]) continue;
      if (!groups[v.type]) groups[v.type] = [];
      groups[v.type].push(v);
    }
    Object.values(groups).forEach((arr) => arr.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at)));
    return groups;
  }, [allVitals]);

  const availableKeys = Object.keys(byMarker);

  useEffect(() => {
    if (availableKeys.length > 0 && !selected) setSelected(availableKeys[0]);
  }, [availableKeys, selected]);

  const tableRows = useMemo(() => {
    return availableKeys.map((key) => {
      const records = byMarker[key];
      const cfg = MARKERS[key];
      const latest = records[records.length - 1];
      const previous = records[records.length - 2];
      const latestVal = cfg.getVal(latest);
      const prevVal = previous ? cfg.getVal(previous) : null;
      let trend = "stable";
      if (prevVal !== null) {
        if (latestVal > prevVal * 1.02) trend = "up";
        else if (latestVal < prevVal * 0.98) trend = "down";
      }
      let status = "tracked";
      if (cfg.range) {
        if (latestVal >= cfg.range[0] && latestVal <= cfg.range[1]) status = "in_range";
        else if (cfg.warning && latestVal >= cfg.warning[0] && latestVal <= cfg.warning[1]) status = "warning";
        else status = "out_of_range";
      }
      return { key, cfg, latest, prevVal, latestVal, trend, status, count: records.length };
    });
  }, [byMarker, availableKeys]);

  const chartData = useMemo(() => {
    if (!selected || !byMarker[selected]) return [];
    const cfg = MARKERS[selected];
    return byMarker[selected].map((r) => ({
      dateLabel: r.recorded_at ? format(parseISO(r.recorded_at), "MMM d") : "",
      value: cfg.getVal(r),
      inRange: cfg.range ? cfg.getVal(r) >= cfg.range[0] && cfg.getVal(r) <= cfg.range[1] : true,
    }));
  }, [selected, byMarker]);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="w-4 h-4 text-violet-600" />
          <h3 className="font-display font-semibold text-sm">Lab Results & Trends</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
        </div>
      </Card>
    );
  }

  if (availableKeys.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4 text-violet-600" />
          <h3 className="font-display font-semibold text-sm">Lab Results & Trends</h3>
        </div>
        <div className="flex flex-col items-center py-6 text-center">
          <FlaskConical className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No lab results recorded yet</p>
          <p className="text-xs text-muted-foreground mt-1">Log vitals or upload lab reports to see trends.</p>
        </div>
      </Card>
    );
  }

  const cfg = selected ? MARKERS[selected] : null;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-violet-600" />
          <h3 className="font-display font-semibold text-sm">Lab Results & Trends</h3>
        </div>
        <span className="text-xs text-muted-foreground">{availableKeys.length} markers tracked</span>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm min-w-[300px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-1 text-[10px] font-medium text-muted-foreground uppercase">Test</th>
              <th className="text-right py-2 px-1 text-[10px] font-medium text-muted-foreground uppercase">Latest</th>
              <th className="text-center py-2 px-1 text-[10px] font-medium text-muted-foreground uppercase">Trend</th>
              <th className="text-right py-2 px-1 text-[10px] font-medium text-muted-foreground uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => {
              const sStyle = STATUS_STYLES[row.status];
              return (
                <tr
                  key={row.key}
                  onClick={() => setSelected(row.key)}
                  className={`border-b border-border/50 cursor-pointer transition-colors ${selected === row.key ? "bg-muted/40" : "hover:bg-muted/20"}`}
                >
                  <td className="py-2.5 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.cfg.color }} />
                      <span className="text-xs font-medium truncate">{row.cfg.label}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-1 text-right whitespace-nowrap">
                    <span className="font-semibold text-sm" style={{ color: row.cfg.color }}>{row.cfg.fmt(row.latest)}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">{row.cfg.unit}</span>
                  </td>
                  <td className="py-2.5 px-1 text-center">
                    {row.trend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-amber-500 inline" /> :
                     row.trend === "down" ? <TrendingDown className="w-3.5 h-3.5 text-emerald-500 inline" /> :
                     <Minus className="w-3.5 h-3.5 text-muted-foreground inline" />}
                  </td>
                  <td className="py-2.5 px-1 text-right">
                    <Badge variant="outline" className={`text-[9px] ${sStyle.bg} ${sStyle.text} border-transparent`}>
                      {sStyle.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Trend Chart for Selected Marker */}
      {cfg && chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
            <p className="text-xs font-medium">{cfg.label} Trend</p>
            <span className="text-[10px] text-muted-foreground">({chartData.length} readings)</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(val) => [`${val} ${cfg.unit}`, cfg.label]}
                />
                {cfg.range && (
                  <ReferenceArea y1={cfg.range[0]} y2={cfg.range[1]} fill="#10b981" fillOpacity={0.08} />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={cfg.color}
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const fill = payload.inRange ? "#10b981" : "#ef4444";
                    return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3} fill={fill} stroke="#fff" strokeWidth={1} />;
                  }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
}