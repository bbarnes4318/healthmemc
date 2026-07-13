import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  Loader2, Pill, Activity, TrendingDown, TrendingUp, AlertCircle, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays, parseISO } from "date-fns";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from "recharts";

const severityScore = { mild: 1, moderate: 2, severe: 3 };
const severityLabel = { 1: "Mild", 2: "Moderate", 3: "Severe" };

export default function MedicationSymptomOverlay() {
  const { currentMemberId } = useFamilyMember();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const memberFilter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const [medLogs, symptoms] = await Promise.all([
        base44.entities.MedicationLog.filter(memberFilter, "-scheduled_date", 1000),
        base44.entities.SymptomMap.filter(memberFilter, "-logged_at", 1000),
      ]);

      const days = Array.from({ length: range }).map((_, i) => {
        const date = subDays(new Date(), range - 1 - i);
        return format(date, "yyyy-MM-dd");
      });

      const chartData = days.map((dateStr) => {
        const dayMeds = medLogs.filter((l) => l.scheduled_date === dateStr);
        const taken = dayMeds.filter((l) => l.status === "taken").length;
        const total = dayMeds.length;
        const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : null;

        const daySymptoms = symptoms.filter((s) => {
          const sDate = s.logged_at ? format(new Date(s.logged_at), "yyyy-MM-dd") : null;
          return sDate === dateStr;
        });

        const avgSeverity = daySymptoms.length > 0
          ? daySymptoms.reduce((sum, s) => sum + (severityScore[s.severity] || 1), 0) / daySymptoms.length
          : null;

        return {
          date: format(parseISO(dateStr), "MMM d"),
          dateStr,
          adherence: adherenceRate,
          symptomSeverity: avgSeverity !== null ? Math.round(avgSeverity * 10) / 10 : null,
          symptomCount: daySymptoms.length,
          medsTaken: taken,
          medsTotal: total,
        };
      });

      setData(chartData);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentMemberId, range]);

  useEffect(() => { load(); }, [load]);

  // Correlation analysis: compare avg symptom severity on high-adherence vs low-adherence days
  const analysis = (() => {
    const daysWithBoth = data.filter((d) => d.adherence !== null && d.symptomSeverity !== null);
    if (daysWithBoth.length < 3) return null;

    const highAdh = daysWithBoth.filter((d) => d.adherence >= 80);
    const lowAdh = daysWithBoth.filter((d) => d.adherence < 80);

    if (highAdh.length === 0 || lowAdh.length === 0) return null;

    const avgSeverityHigh = highAdh.reduce((s, d) => s + d.symptomSeverity, 0) / highAdh.length;
    const avgSeverityLow = lowAdh.reduce((s, d) => s + d.symptomSeverity, 0) / lowAdh.length;
    const diff = avgSeverityLow - avgSeverityHigh;
    const pctChange = avgSeverityLow > 0 ? Math.round((diff / avgSeverityLow) * 100) : 0;

    return {
      avgSeverityHigh: Math.round(avgSeverityHigh * 10) / 10,
      avgSeverityLow: Math.round(avgSeverityLow * 10) / 10,
      diff: Math.round(diff * 10) / 10,
      pctChange,
      highAdhDays: highAdh.length,
      lowAdhDays: lowAdh.length,
      medsHelping: diff > 0,
    };
  })();

  if (loading) {
    return (
      <Card className="p-5 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </Card>
    );
  }

  const hasData = data.some((d) => d.adherence !== null || d.symptomSeverity !== null);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Medication Adherence vs Symptom Severity</h3>
            <p className="text-xs text-muted-foreground">See if taking meds on time reduces pain over time</p>
          </div>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {[14, 30, 60].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium transition ${range === r ? "bg-indigo-600 text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <>
          {/* Correlation Insight Banner */}
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg border mb-4 ${analysis.medsHelping ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}
            >
              <div className="flex items-start gap-2">
                {analysis.medsHelping ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div className="text-xs">
                  <p className={`font-semibold ${analysis.medsHelping ? "text-emerald-800" : "text-amber-800"}`}>
                    {analysis.medsHelping
                      ? `Your symptoms are ${analysis.pctChange}% less severe on high-adherence days`
                      : `No clear symptom reduction detected on high-adherence days yet`}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Avg symptom severity: <strong>{analysis.avgSeverityLow}/3</strong> on days with &lt;80% adherence ({analysis.lowAdhDays} days) vs <strong>{analysis.avgSeverityHigh}/3</strong> on days with ≥80% adherence ({analysis.highAdhDays} days).
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Overlay Chart */}
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={9} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
              <YAxis
                yAxisId="left"
                fontSize={10}
                stroke="#f59e0b"
                domain={[0, 100]}
                label={{ value: "Adherence %", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#f59e0b" } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                fontSize={10}
                stroke="#ef4444"
                domain={[0, 3]}
                label={{ value: "Severity", angle: 90, position: "insideRight", style: { fontSize: 10, fill: "#ef4444" } }}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 11 }}
                formatter={(val, name) => {
                  if (name === "Adherence") return [val != null ? `${val}%` : "—", "Med Adherence"];
                  if (name === "Symptom Severity") return [val != null ? `${val}/3 (${severityLabel[Math.round(val)] || "—"})` : "—", "Symptom Severity"];
                  return [val, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine yAxisId="left" y={80} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Bar
                yAxisId="left"
                dataKey="adherence"
                name="Adherence"
                fill="#f59e0b"
                fillOpacity={0.5}
                radius={[3, 3, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="symptomSeverity"
                name="Symptom Severity"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3, fill: "#ef4444" }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Legend explanation */}
          <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-400/50" />
              <span>Medication adherence % (bars)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-red-500" />
              <span>Symptom severity 1-3 (line)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 border-t-2 border-dashed border-green-500" />
              <span>80% adherence target</span>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-2.5 rounded-lg border border-border bg-card text-center">
              <p className="text-[10px] text-muted-foreground">Avg Adherence</p>
              <p className="text-lg font-bold text-amber-600">
                {data.filter((d) => d.adherence !== null).length > 0
                  ? Math.round(data.filter((d) => d.adherence !== null).reduce((s, d) => s + d.adherence, 0) / data.filter((d) => d.adherence !== null).length)
                  : 0}%
              </p>
            </div>
            <div className="p-2.5 rounded-lg border border-border bg-card text-center">
              <p className="text-[10px] text-muted-foreground">Avg Severity</p>
              <p className="text-lg font-bold text-red-500">
                {data.filter((d) => d.symptomSeverity !== null).length > 0
                  ? (data.filter((d) => d.symptomSeverity !== null).reduce((s, d) => s + d.symptomSeverity, 0) / data.filter((d) => d.symptomSeverity !== null).length).toFixed(1)
                  : "—"}/3
              </p>
            </div>
            <div className="p-2.5 rounded-lg border border-border bg-card text-center">
              <p className="text-[10px] text-muted-foreground">Symptom Days</p>
              <p className="text-lg font-bold text-indigo-600">
                {data.filter((d) => d.symptomSeverity !== null).length}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="h-48 flex flex-col items-center justify-center text-center">
          <Pill className="w-10 h-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No medication or symptom data yet</p>
          <p className="text-xs text-muted-foreground mt-1">Log your medications and symptoms to see if adherence affects your pain levels</p>
        </div>
      )}
    </Card>
  );
}