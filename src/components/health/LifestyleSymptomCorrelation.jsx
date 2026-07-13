import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Layers, TrendingDown, TrendingUp, Lightbulb } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from "recharts";
import { format, parseISO } from "date-fns";

const symptomColors = {
  mild: "#22c55e",
  moderate: "#f59e0b",
  severe: "#ef4444",
};

const severityScore = { mild: 1, moderate: 2, severe: 3 };

export default function LifestyleSymptomCorrelation() {
  const { currentMemberId } = useFamilyMember();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
        const [nutrition, exercise, symptoms] = await Promise.all([
          base44.entities.NutritionLog.filter(filter, "-date", 30),
          base44.entities.ExerciseLog.filter(filter, "-date", 30),
          base44.entities.SymptomMap.filter(filter, "-logged_at", 30),
        ]);

        // Build date-indexed map
        const byDate = {};

        for (const n of nutrition) {
          if (!n.date) continue;
          if (!byDate[n.date]) byDate[n.date] = { date: n.date, calories: 0, exerciseMin: 0, exerciseIntensity: 0, symptomScore: 0, symptomCount: 0, foods: [], activities: [], symptoms: [] };
          byDate[n.date].calories += n.calories || 0;
          if (n.food_name) byDate[n.date].foods.push(n.food_name);
        }

        for (const e of exercise) {
          if (!e.date) continue;
          if (!byDate[e.date]) byDate[e.date] = { date: e.date, calories: 0, exerciseMin: 0, exerciseIntensity: 0, symptomScore: 0, symptomCount: 0, foods: [], activities: [], symptoms: [] };
          byDate[e.date].exerciseMin += e.duration_minutes || 0;
          const intMap = { low: 1, moderate: 2, high: 3 };
          byDate[e.date].exerciseIntensity += (intMap[e.intensity] || 1) * (e.duration_minutes || 0);
          if (e.exercise_name) byDate[e.date].activities.push(e.exercise_name);
        }

        for (const s of symptoms) {
          const dateKey = s.logged_at ? s.logged_at.split("T")[0] : null;
          if (!dateKey) continue;
          if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey, calories: 0, exerciseMin: 0, exerciseIntensity: 0, symptomScore: 0, symptomCount: 0, foods: [], activities: [], symptoms: [] };
          byDate[dateKey].symptomScore += severityScore[s.severity] || 1;
          byDate[dateKey].symptomCount += 1;
          byDate[dateKey].symptoms.push(`${s.body_region.replace(/_/g, " ")} (${s.severity})`);
        }

        const sorted = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
        const chartData = sorted.map(d => ({
          ...d,
          dateLabel: format(parseISO(d.date), "MMM d"),
          avgSymptomScore: d.symptomCount > 0 ? d.symptomScore / d.symptomCount : 0,
          intensityPerMin: d.exerciseMin > 0 ? d.exerciseIntensity / d.exerciseMin : 0,
        }));

        setData(chartData);

        // Generate insights
        const tips = [];
        const highSymptomDays = chartData.filter(d => d.symptomScore >= 3);
        const lowSymptomDays = chartData.filter(d => d.symptomScore > 0 && d.symptomScore < 3);

        if (highSymptomDays.length > 0 && lowSymptomDays.length > 0) {
          const avgCalHigh = Math.round(highSymptomDays.reduce((s, d) => s + d.calories, 0) / highSymptomDays.length);
          const avgCalLow = Math.round(lowSymptomDays.reduce((s, d) => s + d.calories, 0) / lowSymptomDays.length);
          if (avgCalHigh > avgCalLow * 1.2) {
            tips.push({ icon: TrendingUp, text: `High-symptom days averaged ${avgCalHigh} calories vs ${avgCalLow} on low-symptom days. Consider tracking if larger meals trigger symptoms.`, color: "text-amber-600" });
          } else if (avgCalLow > avgCalHigh * 1.2) {
            tips.push({ icon: TrendingDown, text: `Low-symptom days had higher calorie intake (${avgCalLow} vs ${avgCalHigh}). Adequate nutrition may support symptom reduction.`, color: "text-emerald-600" });
          }
        }

        if (highSymptomDays.length > 0 && lowSymptomDays.length > 0) {
          const avgExHigh = Math.round(highSymptomDays.reduce((s, d) => s + d.exerciseMin, 0) / highSymptomDays.length);
          const avgExLow = Math.round(lowSymptomDays.reduce((s, d) => s + d.exerciseMin, 0) / lowSymptomDays.length);
          if (avgExLow > avgExHigh * 1.3) {
            tips.push({ icon: TrendingDown, text: `Days with fewer symptoms had more exercise (${avgExLow} min vs ${avgExHigh} min). Regular activity may help reduce symptom severity.`, color: "text-emerald-600" });
          } else if (avgExHigh > avgExLow * 1.3) {
            tips.push({ icon: TrendingUp, text: `High-symptom days had more exercise (${avgExHigh} min vs ${avgExLow} min). Overexertion may be contributing to symptoms — consider moderating intensity.`, color: "text-amber-600" });
          }
        }

        // Check specific food correlations
        const allFoods = {};
        for (const d of highSymptomDays) {
          for (const f of d.foods) {
            allFoods[f] = (allFoods[f] || 0) + 1;
          }
        }
        const topFoods = Object.entries(allFoods).sort((a, b) => b[1] - a[1]).slice(0, 3);
        if (topFoods.length > 0 && highSymptomDays.length >= 2) {
          tips.push({ icon: Lightbulb, text: `Foods most commonly eaten on high-symptom days: ${topFoods.map(f => f[0]).join(", ")}. Consider an elimination trial.`, color: "text-sky-600" });
        }

        if (tips.length === 0) {
          tips.push({ icon: Lightbulb, text: "Not enough data yet for correlation insights. Continue logging meals, exercise, and symptoms for at least 7 days.", color: "text-muted-foreground" });
        }

        setInsights(tips);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  if (loading) {
    return (
      <Card className="p-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Layers className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No data to correlate yet</p>
        <p className="text-xs text-muted-foreground mt-1">Log meals, exercise, and symptoms to see correlation patterns.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-sky-600" />
        <div>
          <h3 className="font-semibold text-sm">Lifestyle × Symptom Correlation</h3>
          <p className="text-xs text-muted-foreground">Overlaying nutrition, exercise, and symptom data to find patterns</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: "Calories", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: "Symptom Severity", angle: 90, position: "insideRight", style: { fontSize: 10 } }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border rounded-lg shadow-lg p-3 text-xs max-w-xs">
                    <p className="font-semibold mb-1">{d.dateLabel}</p>
                    <p>🔥 Calories: {d.calories}</p>
                    <p>🏃 Exercise: {d.exerciseMin} min</p>
                    {d.symptomCount > 0 && <p>⚠️ Symptoms: {d.symptomCount} (avg {d.avgSymptomScore.toFixed(1)}/3)</p>}
                    {d.foods.length > 0 && <p className="mt-1"><strong>Foods:</strong> {d.foods.join(", ")}</p>}
                    {d.activities.length > 0 && <p><strong>Activities:</strong> {d.activities.join(", ")}</p>}
                    {d.symptoms.length > 0 && <p className="mt-1"><strong>Symptoms:</strong> {d.symptoms.join(", ")}</p>}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar yAxisId="left" dataKey="calories" fill="#38bdf8" name="Calories" radius={[4, 4, 0, 0]} barSize={20} />
            <Line yAxisId="left" type="monotone" dataKey="exerciseMin" stroke="#10b981" strokeWidth={2} name="Exercise (min)" dot={{ r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="avgSymptomScore" stroke="#ef4444" strokeWidth={2} name="Avg Symptom Severity" dot={{ r: 3 }} />
            <ReferenceLine yAxisId="right" y={2} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "Moderate", fontSize: 9, fill: "#f59e0b" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI-Generated Insights</h4>
        {insights.map((tip, i) => {
          const TipIcon = tip.icon;
          return (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border">
              <TipIcon className={`w-4 h-4 ${tip.color} mt-0.5 shrink-0`} />
              <p className="text-xs leading-relaxed">{tip.text}</p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <Badge variant="outline" className="text-[10px]">
          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block mr-1" /> Calories
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1" /> Exercise Minutes
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-1" /> Symptom Severity
        </Badge>
      </div>
    </Card>
  );
}