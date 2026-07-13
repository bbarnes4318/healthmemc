import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, GitCompare, TrendingDown, TrendingUp, Pill, Dumbbell, Activity, Info } from "lucide-react";
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine, ZAxis
} from "recharts";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format, subDays, parseISO, differenceInDays } from "date-fns";

const EXERCISE_COLORS = ["#f97316", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#eab308", "#6366f1"];
const MED_COLOR = "#f59e0b";

export default function TreatmentCorrelationAnalyzer() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [exercises, setExercises] = useState([]);
  const [medLogs, setMedLogs] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [selectedMeds, setSelectedMeds] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [exData, medLogData, medData] = await Promise.all([
          base44.entities.ExerciseLog.list("-date", 500),
          base44.entities.MedicationLog.list("-scheduled_date", 500),
          base44.entities.Medication.filter({ active: true }),
        ]);
        const filteredEx = currentMemberId ? exData.filter((e) => e.family_member_id === currentMemberId) : exData;
        const filteredMedLogs = currentMemberId ? medLogData.filter((l) => l.family_member_id === currentMemberId) : medLogData;
        const filteredMeds = currentMemberId ? medData.filter((m) => m.family_member_id === currentMemberId) : medData;
        setExercises(filteredEx);
        setMedLogs(filteredMedLogs);
        setMedications(filteredMeds);

        // Auto-select top 3 exercises by frequency
        const exCounts = {};
        filteredEx.forEach((e) => {
          if (e.exercise_name) exCounts[e.exercise_name] = (exCounts[e.exercise_name] || 0) + 1;
        });
        const topExercises = Object.entries(exCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
        setSelectedExercises(topExercises);

        // Auto-select all active meds (max 4)
        setSelectedMeds(filteredMeds.slice(0, 4).map((m) => m.name));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  // Build timeline data: last 60 days with pain + treatment events
  const timelineData = useMemo(() => {
    const days = 60;
    const now = new Date();
    const byDate = {};

    for (let i = 0; i < days; i++) {
      const d = subDays(now, days - 1 - i);
      const dateStr = format(d, "yyyy-MM-dd");
      byDate[dateStr] = {
        date: format(d, "MMM d"),
        dateStr,
        pain: null,
        rom: null,
        exercises: [],
        medsTaken: [],
      };
    }

    // Add pain data from exercise logs
    exercises.forEach((e) => {
      if (!e.date || !byDate[e.date]) return;
      if (e.pain_level != null) {
        if (byDate[e.date].pain == null || e.pain_level > byDate[e.date].pain) {
          byDate[e.date].pain = e.pain_level;
        }
      }
      if (e.rom_degrees != null) {
        if (byDate[e.date].rom == null || e.rom_degrees > byDate[e.date].rom) {
          byDate[e.date].rom = e.rom_degrees;
        }
      }
      if (e.exercise_name) byDate[e.date].exercises.push(e.exercise_name);
    });

    // Add medication data
    medLogs.forEach((l) => {
      if (!l.scheduled_date || !byDate[l.scheduled_date]) return;
      if (l.status === "taken" && l.medication_name) {
        byDate[l.scheduled_date].medsTaken.push(l.medication_name);
      }
    });

    return Object.values(byDate);
  }, [exercises, medLogs]);

  // Correlation analysis: for each treatment, compare pain on days with vs without
  const correlations = useMemo(() => {
    const results = [];
    const daysWithPain = timelineData.filter((d) => d.pain != null);
    if (daysWithPain.length < 2) return results;

    // Exercise correlations
    const exerciseNames = [...new Set(exercises.map((e) => e.exercise_name).filter(Boolean))];

    exerciseNames.forEach((exName) => {
      const daysWithEx = daysWithPain.filter((d) => d.exercises.includes(exName));
      const daysWithoutEx = daysWithPain.filter((d) => !d.exercises.includes(exName));

      if (daysWithEx.length < 2 || daysWithoutEx.length < 2) return;

      const avgPainWith = daysWithEx.reduce((s, d) => s + d.pain, 0) / daysWithEx.length;
      const avgPainWithout = daysWithoutEx.reduce((s, d) => s + d.pain, 0) / daysWithoutEx.length;
      const painReduction = avgPainWithout - avgPainWith;
      const pctReduction = avgPainWithout > 0 ? (painReduction / avgPainWithout) * 100 : 0;

      // Also check day-after effect: pain the day after doing the exercise
      let dayAfterPain = null;
      let dayAfterCount = 0;
      daysWithEx.forEach((d) => {
        const nextDay = timelineData.find((nd) => {
          const diff = differenceInDays(parseISO(nd.dateStr), parseISO(d.dateStr));
          return diff === 1;
        });
        if (nextDay && nextDay.pain != null) {
          dayAfterPain = (dayAfterPain || 0) + nextDay.pain;
          dayAfterCount++;
        }
      });
      const avgDayAfterPain = dayAfterCount > 0 ? dayAfterPain / dayAfterCount : null;

      results.push({
        type: "exercise",
        name: exName,
        avgPainWith,
        avgPainWithout,
        painReduction,
        pctReduction,
        daysWithTreatment: daysWithEx.length,
        daysWithoutTreatment: daysWithoutEx.length,
        avgDayAfterPain,
        strength: Math.abs(pctReduction),
      });
    });

    // Medication correlations
    const medNames = [...new Set(medLogs.filter((l) => l.status === "taken").map((l) => l.medication_name).filter(Boolean))];

    medNames.forEach((medName) => {
      const daysWithMed = daysWithPain.filter((d) => d.medsTaken.includes(medName));
      const daysWithoutMed = daysWithPain.filter((d) => !d.medsTaken.includes(medName));

      if (daysWithMed.length < 2 || daysWithoutMed.length < 2) return;

      const avgPainWith = daysWithMed.reduce((s, d) => s + d.pain, 0) / daysWithMed.length;
      const avgPainWithout = daysWithoutMed.reduce((s, d) => s + d.pain, 0) / daysWithoutMed.length;
      const painReduction = avgPainWithout - avgPainWith;
      const pctReduction = avgPainWithout > 0 ? (painReduction / avgPainWithout) * 100 : 0;

      results.push({
        type: "medication",
        name: medName,
        avgPainWith,
        avgPainWithout,
        painReduction,
        pctReduction,
        daysWithTreatment: daysWithMed.length,
        daysWithoutTreatment: daysWithoutMed.length,
        avgDayAfterPain: null,
        strength: Math.abs(pctReduction),
      });
    });

    return results.sort((a, b) => b.painReduction - a.painReduction);
  }, [timelineData, exercises, medLogs]);

  // Chart data with scatter overlays for selected treatments
  const chartData = useMemo(() => {
    return timelineData.map((d) => {
      const point = {
        date: d.date,
        pain: d.pain,
        rom: d.rom,
      };

      selectedExercises.forEach((exName, i) => {
        if (d.exercises.includes(exName)) {
          point[`ex_${i}`] = d.pain != null ? d.pain : 0;
        }
      });

      selectedMeds.forEach((medName) => {
        if (d.medsTaken.includes(medName)) {
          point[`med_${medName}`] = d.pain != null ? d.pain : 0;
        }
      });

      return point;
    });
  }, [timelineData, selectedExercises, selectedMeds]);

  const allExerciseNames = useMemo(() => {
    const counts = {};
    exercises.forEach((e) => { if (e.exercise_name) counts[e.exercise_name] = (counts[e.exercise_name] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [exercises]);

  const allMedNames = useMemo(() => {
    return medications.map((m) => m.name).filter(Boolean);
  }, [medications]);

  const toggleExercise = (name) => {
    setSelectedExercises((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  };

  const toggleMed = (name) => {
    setSelectedMeds((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  };

  if (loading) {
    return <Card className="p-5"><div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-violet-600" /></div></Card>;
  }

  const hasData = timelineData.some((d) => d.pain != null);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitCompare className="w-5 h-5 text-violet-600" />
        <div>
          <h3 className="font-semibold text-sm">Treatment Correlation Analyzer</h3>
          <p className="text-xs text-muted-foreground">Overlay exercises & medications on pain trends to see what works best · {currentMemberName}</p>
        </div>
      </div>

      {!hasData ? (
        <div className="py-8 text-center">
          <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No pain data available for correlation analysis.</p>
          <p className="text-xs text-muted-foreground mt-1">Log exercises with pain levels to see which treatments correlate with pain reduction.</p>
        </div>
      ) : (
        <>
          {/* Treatment Selectors */}
          <div className="space-y-3 mb-4">
            {allExerciseNames.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Dumbbell className="w-3 h-3 text-orange-600" /> EXERCISES TO OVERLAY
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allExerciseNames.map((ex, i) => {
                    const isSelected = selectedExercises.includes(ex.name);
                    const colorIdx = allExerciseNames.findIndex((e) => e.name === ex.name);
                    return (
                      <button
                        key={ex.name}
                        onClick={() => toggleExercise(ex.name)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
                          isSelected ? "text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                        }`}
                        style={isSelected ? { background: EXERCISE_COLORS[colorIdx % EXERCISE_COLORS.length] } : {}}
                      >
                        {ex.name}
                        <span className="text-[9px] opacity-70">({ex.count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {allMedNames.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Pill className="w-3 h-3 text-amber-600" /> MEDICATIONS TO OVERLAY
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allMedNames.map((name) => {
                    const isSelected = selectedMeds.includes(name);
                    return (
                      <button
                        key={name}
                        onClick={() => toggleMed(name)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                          isSelected ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Overlay Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={6} />
              <YAxis yAxisId="pain" domain={[0, 10]} tick={{ fontSize: 10 }} label={{ value: "Pain", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#888" } }} />
              <YAxis yAxisId="rom" orientation="right" tick={{ fontSize: 10 }} label={{ value: "ROM°", angle: 90, position: "insideRight", style: { fontSize: 10, fill: "#888" } }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 11 }}
                formatter={(value, name) => {
                  if (name === "Pain Level") return [value != null ? `${value}/10` : "No data", name];
                  if (name === "ROM") return [value != null ? `${value}°` : "No data", name];
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />

              {/* Pain line */}
              <Line yAxisId="pain" type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={2} dot={false} name="Pain Level" connectNulls />

              {/* ROM line */}
              <Line yAxisId="rom" type="monotone" dataKey="rom" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="ROM" connectNulls />

              {/* Exercise scatter overlays */}
              {selectedExercises.map((exName, i) => {
                const colorIdx = allExerciseNames.findIndex((e) => e.name === exName);
                return (
                  <Scatter
                    key={`ex_${i}`}
                    yAxisId="pain"
                    dataKey={`ex_${i}`}
                    fill={EXERCISE_COLORS[colorIdx % EXERCISE_COLORS.length]}
                    shape="star"
                    name={exName}
                  />
                );
              })}

              {/* Medication scatter overlays */}
              {selectedMeds.map((medName) => (
                <Scatter
                  key={`med_${medName}`}
                  yAxisId="pain"
                  dataKey={`med_${medName}`}
                  fill={MED_COLOR}
                  shape="triangle"
                  name={`💊 ${medName}`}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>

          <p className="text-[10px] text-muted-foreground mt-2 italic flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            Red line = daily pain level · Blue dashed = ROM · Stars = exercise sessions · Triangles = medication taken. Watch for patterns where treatments precede pain drops.
          </p>

          {/* Correlation Rankings */}
          {correlations.length > 0 && (
            <div className="mt-5">
              <h4 className="text-xs font-semibold mb-3 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-violet-600" /> Pain Reduction Correlation Rankings
              </h4>
              <div className="space-y-2">
                {correlations.map((corr, i) => (
                  <div key={`${corr.type}_${corr.name}`} className={`p-3 rounded-lg border ${corr.painReduction > 0 ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-muted-foreground w-4">#{i + 1}</span>
                      {corr.type === "exercise" ? (
                        <Dumbbell className="w-3.5 h-3.5 text-orange-600" />
                      ) : (
                        <Pill className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <p className="text-sm font-medium flex-1">{corr.name}</p>
                      <span className={`text-xs font-bold ${corr.painReduction > 0 ? "text-green-600" : "text-red-500"}`}>
                        {corr.painReduction > 0 ? "↓" : "↑"} {Math.abs(corr.pctReduction).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground ml-6">
                      <span>Avg pain WITH: <strong className={corr.painReduction > 0 ? "text-green-600" : "text-red-500"}>{corr.avgPainWith.toFixed(1)}/10</strong></span>
                      <span>WITHOUT: <strong className="text-gray-600">{corr.avgPainWithout.toFixed(1)}/10</strong></span>
                      <span>({corr.daysWithTreatment}d vs {corr.daysWithoutTreatment}d)</span>
                      {corr.avgDayAfterPain != null && (
                        <span className="text-violet-600">Day after: {corr.avgDayAfterPain.toFixed(1)}/10</span>
                      )}
                    </div>
                    {/* Visual bar */}
                    <div className="mt-1.5 ml-6 flex items-center gap-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${corr.painReduction > 0 ? "bg-green-500" : "bg-red-400"}`}
                          style={{ width: `${Math.min(Math.abs(corr.pctReduction), 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground w-12 text-right">
                        {corr.painReduction > 0 ? "Reduces" : "Worsens"} pain
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-3 italic">
                Correlation ≠ causation. These comparisons show average pain levels on days with vs without each treatment. Consult your healthcare provider before adjusting any treatment plan.
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}