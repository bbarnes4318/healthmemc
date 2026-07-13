import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingDown, TrendingUp, Minus, Pill } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from "recharts";
import { format, parseISO } from "date-fns";

const severityToScore = { mild: 3, moderate: 6, severe: 9 };
const severityLabels = { mild: "Mild", moderate: "Moderate", severe: "Severe" };

const regionLabels = {
  head: "Head", neck: "Neck",
  left_shoulder: "Left Shoulder", right_shoulder: "Right Shoulder",
  left_arm: "Left Arm", right_arm: "Right Arm",
  chest: "Chest", abdomen: "Abdomen", back: "Upper Back", lower_back: "Lower Back",
  left_hip: "Left Hip", right_hip: "Right Hip",
  left_thigh: "Left Thigh", right_thigh: "Right Thigh",
  left_knee: "Left Knee", right_knee: "Right Knee",
  left_calf: "Left Calf", right_calf: "Right Calf",
  left_foot: "Left Foot", right_foot: "Right Foot",
};

export default function PainRegionTrendChart({ entries }) {
  const { currentMemberId } = useFamilyMember();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    const loadMeds = async () => {
      try {
        const filter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
        const meds = await base44.entities.Medication.filter(filter, "-start_date", 50);
        setMedications(meds);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadMeds();
  }, [currentMemberId]);

  // Group entries by region and build time series
  const regionData = useMemo(() => {
    const byRegion = {};
    for (const e of entries) {
      if (!e.body_region) continue;
      if (!byRegion[e.body_region]) byRegion[e.body_region] = [];
      byRegion[e.body_region].push({
        ...e,
        score: severityToScore[e.severity] || 0,
        date: e.logged_at ? e.logged_at.split("T")[0] : null,
      });
    }
    // Sort each region by date
    for (const r of Object.keys(byRegion)) {
      byRegion[r].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));
    }
    return byRegion;
  }, [entries]);

  // Regions that have data, sorted by most recent activity
  const regionsWithData = useMemo(() => {
    return Object.keys(regionData)
      .filter((r) => regionData[r].length > 0)
      .sort((a, b) => {
        const aLast = regionData[a][regionData[a].length - 1]?.logged_at || "";
        const bLast = regionData[b][regionData[b].length - 1]?.logged_at || "";
        return new Date(bLast) - new Date(aLast);
      });
  }, [regionData]);

  // Auto-select first region
  useEffect(() => {
    if (!selectedRegion && regionsWithData.length > 0) {
      setSelectedRegion(regionsWithData[0]);
    }
  }, [regionsWithData, selectedRegion]);

  const chartData = useMemo(() => {
    if (!selectedRegion || !regionData[selectedRegion]) return [];
    return regionData[selectedRegion].map((e) => ({
      date: e.date,
      dateLabel: e.date ? format(parseISO(e.date), "MMM d") : "",
      score: e.score,
      severity: e.severity,
      painType: e.pain_type,
      notes: e.notes,
      description: e.symptom_description,
    }));
  }, [selectedRegion, regionData]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].score;
    const last = chartData[chartData.length - 1].score;
    const diff = last - first;
    if (diff < -1) return { direction: "down", diff, icon: TrendingDown, color: "text-emerald-600" };
    if (diff > 1) return { direction: "up", diff, icon: TrendingUp, color: "text-red-600" };
    return { direction: "flat", diff, icon: Minus, color: "text-amber-600" };
  }, [chartData]);

  // Active meds for reference lines
  const activeMeds = useMemo(() => {
    return medications.filter((m) => m.start_date).slice(0, 5);
  }, [medications]);

  if (loading) {
    return (
      <Card className="p-6 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
      </Card>
    );
  }

  if (regionsWithData.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          No pain entries yet. Tap a body region to log pain, then check back here to see trends.
        </p>
      </Card>
    );
  }

  const TrendIcon = trend?.icon || Minus;

  return (
    <div className="space-y-3">
      {/* Region selector chips */}
      <div className="flex flex-wrap gap-1.5">
        {regionsWithData.map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRegion(r)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition ${
              selectedRegion === r
                ? "bg-sky-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-sky-100"
            }`}
          >
            {regionLabels[r] || r}
            <span className="ml-1 opacity-60">({regionData[r].length})</span>
          </button>
        ))}
      </div>

      {selectedRegion && (
        <>
          {/* Trend summary */}
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-semibold">{regionLabels[selectedRegion] || selectedRegion}</h4>
            <span className="text-[10px] text-muted-foreground">· {chartData.length} entries</span>
            {trend && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 ${trend.color}`}>
                <TrendIcon className="w-3 h-3" />
                <span className="text-[10px] font-medium">
                  {trend.direction === "down" ? "Improving" : trend.direction === "up" ? "Worsening" : "Stable"}
                  {chartData.length >= 2 && ` (${chartData[0].severity} → ${chartData[chartData.length - 1].severity})`}
                </span>
              </div>
            )}
            {activeMeds.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Pill className="w-3 h-3" />
                {activeMeds.length} active med{activeMeds.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} ticks={[0, 3, 6, 9]} tickFormatter={(v) => v === 0 ? "" : v <= 3 ? "Mild" : v <= 6 ? "Mod" : "Sev"} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-2.5 text-xs max-w-xs">
                        <p className="font-semibold">{d.dateLabel}</p>
                        <p className="capitalize">Severity: {severityLabels[d.severity] || d.severity}</p>
                        {d.painType && <p className="capitalize">Type: {d.painType}</p>}
                        {d.description && <p className="text-muted-foreground">{d.description}</p>}
                        {d.notes && <p className="text-muted-foreground italic">{d.notes}</p>}
                      </div>
                    );
                  }}
                />
                {/* Medication start date reference lines */}
                {activeMeds.map((med) => {
                  const medDate = med.start_date;
                  const inRange = chartData.some((d) => d.date >= medDate);
                  if (!inRange) return null;
                  return (
                    <ReferenceLine
                      key={med.id}
                      x={format(parseISO(medDate), "MMM d")}
                      stroke="#a855f7"
                      strokeDasharray="4 4"
                      label={{ value: med.name, fontSize: 8, fill: "#a855f7", position: "top" }}
                    />
                  );
                })}
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#ef4444" }}
                  activeDot={{ r: 6 }}
                  name="Pain Severity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Severity legend */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-[10px] text-muted-foreground">Mild</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-[10px] text-muted-foreground">Moderate</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-[10px] text-muted-foreground">Severe</span>
            </div>
            {activeMeds.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-purple-500" style={{ borderTop: "2px dashed #a855f7" }} />
                <span className="text-[10px] text-muted-foreground">Med started</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}