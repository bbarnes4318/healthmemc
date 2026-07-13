import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Activity, TrendingDown, Loader2, Utensils } from "lucide-react";

const severityScore = { mild: 1, moderate: 2, severe: 3 };
const severityLabels = { 1: "Mild", 2: "Moderate", 3: "Severe" };
const appetiteScore = { good: 4, fair: 3, poor: 2, refused: 1 };
const appetiteLabels = { 1: "Refused", 2: "Poor", 3: "Fair", 4: "Good" };

export default function PetSymptomTrendChart() {
  const [pets, setPets] = useState([]);
  const [symptomLogs, setSymptomLogs] = useState([]);
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [petData, symptomData, nutritionData] = await Promise.all([
          base44.entities.PetProfile.list("-created_date", 50),
          base44.entities.PetSymptomLog.list("-logged_at", 500),
          base44.entities.PetNutritionLog.list("-date", 500),
        ]);
        setPets(petData);
        setSymptomLogs(symptomData);
        setNutritionLogs(nutritionData);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const filteredSymptoms = useMemo(() => {
    if (selectedPetId === "all") return symptomLogs;
    const pet = pets.find((p) => p.id === selectedPetId);
    if (!pet) return [];
    return symptomLogs.filter((l) => l.breed === pet.breed || (pet.name && l.description?.includes(pet.name)));
  }, [symptomLogs, selectedPetId, pets]);

  const filteredNutrition = useMemo(() => {
    if (selectedPetId === "all") return nutritionLogs;
    return nutritionLogs.filter((l) => l.pet_profile_id === selectedPetId);
  }, [nutritionLogs, selectedPetId]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 2; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      months.push({ start: monthStart, end: monthEnd, label: format(monthStart, "MMM yyyy"), symptoms: [], meals: [] });
    }

    filteredSymptoms.forEach((log) => {
      const logDate = new Date(log.logged_at || log.created_date);
      for (const m of months) {
        if (isWithinInterval(logDate, { start: m.start, end: m.end })) { m.symptoms.push(log); break; }
      }
    });

    filteredNutrition.forEach((log) => {
      const logDate = new Date(log.date);
      for (const m of months) {
        if (isWithinInterval(logDate, { start: m.start, end: m.end })) { m.meals.push(log); break; }
      }
    });

    return months.map((m) => {
      const symCount = m.symptoms.length;
      const avgIntensity = symCount > 0
        ? m.symptoms.reduce((s, l) => s + (severityScore[l.severity] || 1), 0) / symCount
        : 0;
      const severeCount = m.symptoms.filter((l) => l.severity === "severe").length;
      const mealCount = m.meals.length;
      const avgAppetite = mealCount > 0
        ? m.meals.reduce((s, l) => s + (appetiteScore[l.appetite] || 3), 0) / mealCount
        : 0;
      return {
        month: m.label,
        frequency: symCount,
        avgIntensity: parseFloat(avgIntensity.toFixed(1)),
        severeEpisodes: severeCount,
        avgAppetite: parseFloat(avgAppetite.toFixed(1)),
        mealCount,
      };
    });
  }, [filteredSymptoms, filteredNutrition]);

  const totalEpisodes = chartData.reduce((s, d) => s + d.frequency, 0);
  const firstMonth = chartData[0]?.frequency || 0;
  const lastMonth = chartData[chartData.length - 1]?.frequency || 0;
  const trend = lastMonth - firstMonth;
  const firstAppetite = chartData[0]?.avgAppetite || 0;
  const lastAppetite = chartData[chartData.length - 1]?.avgAppetite || 0;
  const appetiteTrend = lastAppetite - firstAppetite;
  const hasData = totalEpisodes > 0 || chartData.some((d) => d.mealCount > 0);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>;
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-600" /> Symptom Severity & Appetite Trends — 3 Month Recovery
        </h3>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">Monitor recovery: symptoms should decrease while appetite improves</p>

      {pets.length > 0 && (
        <div className="mb-3">
          <Select value={selectedPetId} onValueChange={setSelectedPetId}>
            <SelectTrigger className="max-w-xs h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pets</SelectItem>
              {pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="p-2.5 rounded-lg bg-muted/40 text-center">
          <p className="text-[9px] text-muted-foreground">Symptom Episodes</p>
          <p className="text-lg font-bold text-purple-600">{totalEpisodes}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/40 text-center">
          <p className="text-[9px] text-muted-foreground">Severe Episodes</p>
          <p className="text-lg font-bold text-red-500">{chartData.reduce((s, d) => s + d.severeEpisodes, 0)}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/40 text-center">
          <p className="text-[9px] text-muted-foreground">Symptom Trend</p>
          {trend < 0 ? (
            <p className="text-lg font-bold text-emerald-600 flex items-center justify-center gap-0.5">
              <TrendingDown className="w-4 h-4" />{Math.abs(trend)}
            </p>
          ) : trend > 0 ? (
            <p className="text-lg font-bold text-red-500">+{trend}</p>
          ) : (
            <p className="text-lg font-bold text-muted-foreground">—</p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-muted/40 text-center">
          <p className="text-[9px] text-muted-foreground">Appetite Trend</p>
          {appetiteTrend > 0 ? (
            <p className="text-lg font-bold text-emerald-600 flex items-center justify-center gap-0.5">
              <Utensils className="w-4 h-4" />+{appetiteTrend.toFixed(1)}
            </p>
          ) : appetiteTrend < 0 ? (
            <p className="text-lg font-bold text-amber-500">{appetiteTrend.toFixed(1)}</p>
          ) : (
            <p className="text-lg font-bold text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="py-8 text-center">
          <Activity className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No symptom or nutrition data in the last 3 months</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Log symptoms on the 3D Pet model and meals in Nutrition to populate this chart.</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} label={{ value: "Episodes", angle: -90, position: "insideLeft", style: { fontSize: 9, fill: "#94a3b8" } }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 4]} ticks={[1, 2, 3, 4]} tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => v <= 3 ? (severityLabels[v] || "") : (appetiteLabels[v] || "")} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={(v, name) => {
                  if (name === "Symptom Episodes") return [`${v} episodes`, name];
                  if (name === "Avg Intensity") return [`${v} — ${severityLabels[Math.round(v)] || ""}`, name];
                  if (name === "Avg Appetite") return [`${v} — ${appetiteLabels[Math.round(v)] || ""}`, name];
                  return [v, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar yAxisId="left" dataKey="frequency" name="Symptom Episodes" fill="#d8b4fe" radius={[4, 4, 0, 0]} barSize={50} />
              <Line yAxisId="right" type="monotone" dataKey="avgIntensity" name="Avg Intensity" stroke="#9333ea" strokeWidth={2.5} dot={{ r: 5, fill: "#9333ea" }} />
              <Line yAxisId="right" type="monotone" dataKey="avgAppetite" name="Avg Appetite" stroke="#10b981" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 5, fill: "#10b981" }} />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-purple-300 rounded" /> Symptom frequency</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-0.5 bg-purple-600" /> Avg intensity (1=Mild, 3=Severe)</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-0.5 bg-emerald-500 border-t border-dashed" /> Avg appetite (1=Refused, 4=Good)</span>
          </div>

          {/* Recovery Insight */}
          {trend < 0 && appetiteTrend >= 0 && (
            <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-[10px] text-emerald-700">
                Symptoms decreased ({firstMonth}→{lastMonth}/mo) and appetite is {appetiteTrend > 0 ? `improving (+${appetiteTrend.toFixed(1)})` : "stable"} — your pet's recovery is on track.
              </p>
            </div>
          )}
          {trend > 0 && (
            <div className="mt-3 p-2.5 bg-amber-50 rounded-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-700">
                Symptoms increased ({firstMonth}→{lastMonth}/mo) — consider consulting your veterinarian.
              </p>
            </div>
          )}
          {appetiteTrend < 0 && (
            <div className="mt-3 p-2.5 bg-amber-50 rounded-lg flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-700">
                Appetite declining ({firstAppetite.toFixed(1)}→{lastAppetite.toFixed(1)}) — monitor closely and consult your vet if it continues.
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}