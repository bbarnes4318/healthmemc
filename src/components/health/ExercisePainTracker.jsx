import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, TrendingDown, TrendingUp, Lightbulb, Dumbbell, Zap } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from "recharts";
import { format, parseISO } from "date-fns";

export default function ExercisePainTracker() {
  const { currentMemberId } = useFamilyMember();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
        const exercises = await base44.entities.ExerciseLog.filter(filter, "-date", 60);

        // Build date-indexed map
        const byDate = {};
        for (const e of exercises) {
          if (!e.date) continue;
          if (!byDate[e.date]) byDate[e.date] = { date: e.date, exerciseCount: 0, totalMinutes: 0, totalPain: 0, painReadings: 0, activities: [], intensitySum: 0 };
          byDate[e.date].exerciseCount += 1;
          byDate[e.date].totalMinutes += e.duration_minutes || 0;
          if (e.pain_level != null) {
            byDate[e.date].totalPain += e.pain_level;
            byDate[e.date].painReadings += 1;
          }
          const intMap = { low: 1, moderate: 2, high: 3 };
          byDate[e.date].intensitySum += intMap[e.intensity] || 1;
          if (e.exercise_name) byDate[e.date].activities.push(e.exercise_name);
        }

        const sorted = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
        const chartData = sorted.map((d) => ({
          ...d,
          dateLabel: format(parseISO(d.date), "MMM d"),
          avgPain: d.painReadings > 0 ? d.totalPain / d.painReadings : null,
          avgIntensity: d.exerciseCount > 0 ? d.intensitySum / d.exerciseCount : 0,
        }));

        setData(chartData);
        generateInsights(chartData);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  const generateInsights = (chartData) => {
    const tips = [];
    const daysWithExercise = chartData.filter((d) => d.exerciseCount > 0);
    const daysWithPain = chartData.filter((d) => d.avgPain != null);

    if (daysWithExercise.length < 3 || daysWithPain.length < 3) {
      tips.push({ icon: Lightbulb, text: "Log at least 3 days of exercise with pain ratings to see correlation patterns.", color: "text-muted-foreground" });
      setInsights(tips);
      return;
    }

    // Split into high-exercise and low-exercise days
    const sortedByExercise = [...daysWithExercise].sort((a, b) => b.exerciseCount - a.exerciseCount);
    const topHalf = sortedByExercise.slice(0, Math.ceil(sortedByExercise.length / 2));
    const bottomHalf = sortedByExercise.slice(Math.ceil(sortedByExercise.length / 2));

    const avgPainHigh = topHalf.filter((d) => d.avgPain != null);
    const avgPainLow = bottomHalf.filter((d) => d.avgPain != null);

    if (avgPainHigh.length > 0 && avgPainLow.length > 0) {
      const highAvg = avgPainHigh.reduce((s, d) => s + d.avgPain, 0) / avgPainHigh.length;
      const lowAvg = avgPainLow.reduce((s, d) => s + d.avgPain, 0) / avgPainLow.length;

      if (lowAvg < highAvg * 0.85) {
        tips.push({
          icon: TrendingDown,
          text: `On high-exercise days, your average pain was ${lowAvg.toFixed(1)}/10 vs ${highAvg.toFixed(1)}/10 on low-exercise days. Consistent PT appears to be reducing your pain levels.`,
          color: "text-emerald-600",
        });
      } else if (highAvg < lowAvg * 0.85) {
        tips.push({
          icon: TrendingUp,
          text: `On low-exercise days, your average pain was ${highAvg.toFixed(1)}/10 vs ${lowAvg.toFixed(1)}/10 on high-exercise days. You may be overexerting — consider moderating exercise intensity.`,
          color: "text-amber-600",
        });
      } else {
        tips.push({
          icon: Activity,
          text: `Pain levels are similar across high and low exercise days (${highAvg.toFixed(1)} vs ${lowAvg.toFixed(1)}/10). Continue tracking to detect longer-term trends.`,
          color: "text-sky-600",
        });
      }
    }

    // Trend over time
    if (chartData.length >= 6) {
      const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2)).filter((d) => d.avgPain != null);
      const secondHalf = chartData.slice(Math.floor(chartData.length / 2)).filter((d) => d.avgPain != null);
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const earlyAvg = firstHalf.reduce((s, d) => s + d.avgPain, 0) / firstHalf.length;
        const recentAvg = secondHalf.reduce((s, d) => s + d.avgPain, 0) / secondHalf.length;
        if (recentAvg < earlyAvg * 0.8) {
          tips.push({
            icon: TrendingDown,
            text: `Your pain has decreased from an average of ${earlyAvg.toFixed(1)}/10 to ${recentAvg.toFixed(1)}/10 over your tracking period. Your physical therapy is showing real progress!`,
            color: "text-emerald-600",
          });
        } else if (recentAvg > earlyAvg * 1.2) {
          tips.push({
            icon: TrendingUp,
            text: `Your pain has increased from ${earlyAvg.toFixed(1)}/10 to ${recentAvg.toFixed(1)}/10 recently. Consider discussing your exercise plan with your physical therapist.`,
            color: "text-amber-600",
          });
        }
      }
    }

    // Frequency
    const totalSessions = daysWithExercise.reduce((s, d) => s + d.exerciseCount, 0);
    const avgPerDay = (totalSessions / chartData.length).toFixed(1);
    tips.push({
      icon: Dumbbell,
      text: `You're averaging ${avgPerDay} exercise sessions per day across ${chartData.length} tracked days, with ${totalSessions} total sessions logged.`,
      color: "text-sky-600",
    });

    setInsights(tips);
  };

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
        <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No exercise logs with pain data yet</p>
        <p className="text-xs text-muted-foreground mt-1">Log exercises with pain ratings to see how PT progress reduces pain over time.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Exercise Frequency × Pain Levels</h3>
          <p className="text-xs text-muted-foreground">Tracking how physical therapy progress reduces daily pain</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: "Sessions / Min", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 10 }} label={{ value: "Pain (0-10)", angle: 90, position: "insideRight", style: { fontSize: 10 } }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border rounded-lg shadow-lg p-3 text-xs max-w-xs">
                    <p className="font-semibold mb-1">{d.dateLabel}</p>
                    <p>🏃 Sessions: {d.exerciseCount}</p>
                    <p>⏱️ Duration: {d.totalMinutes} min</p>
                    {d.avgPain != null && <p>📈 Avg Pain: {d.avgPain.toFixed(1)}/10</p>}
                    {d.activities.length > 0 && <p className="mt-1"><strong>Exercises:</strong> {d.activities.join(", ")}</p>}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar yAxisId="left" dataKey="exerciseCount" fill="#38bdf8" name="Exercise Sessions" radius={[4, 4, 0, 0]} barSize={16} />
            <Line yAxisId="left" type="monotone" dataKey="totalMinutes" stroke="#10b981" strokeWidth={2} name="Total Minutes" dot={{ r: 2 }} />
            <Line yAxisId="right" type="monotone" dataKey="avgPain" stroke="#ef4444" strokeWidth={2.5} name="Avg Pain Level" dot={{ r: 3 }} connectNulls />
            <ReferenceLine yAxisId="right" y={5} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "Moderate", fontSize: 9, fill: "#f59e0b" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PT Progress Insights</h4>
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
          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block mr-1" /> Exercise Sessions
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1" /> Total Minutes
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-1" /> Pain Level
        </Badge>
      </div>
    </Card>
  );
}