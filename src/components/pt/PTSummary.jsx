import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Loader2, Dumbbell, Calendar, ArrowUp, ArrowDown, Minus, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { BarChart, Bar, ComposedChart } from "recharts";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format, subDays, startOfWeek, isSameWeek, parseISO } from "date-fns";

const bodyParts = [
  { value: "knee", label: "Knee" },
  { value: "shoulder", label: "Shoulder" },
  { value: "hip", label: "Hip" },
  { value: "spine", label: "Spine" },
  { value: "ankle", label: "Ankle" },
  { value: "wrist", label: "Wrist" },
  { value: "neck", label: "Neck" },
  { value: "full_body", label: "Full Body" },
  { value: "other", label: "Other" },
];

export default function PTSummary() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBodyPart, setSelectedBodyPart] = useState("knee");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.ExerciseLog.list("-date", 200);
        const filtered = currentMemberId ? data.filter((l) => l.family_member_id === currentMemberId) : data;
        setLogs(filtered);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  // ROM trend chart data - all dates with ROM readings for the selected body part
  const romChartData = useMemo(() => {
    const partLogs = logs
      .filter((l) => l.body_part === selectedBodyPart && l.rom_degrees != null)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const byDate = {};
    partLogs.forEach((l) => {
      if (!byDate[l.date] || l.rom_degrees > byDate[l.date]) byDate[l.date] = l.rom_degrees;
    });

    return Object.entries(byDate).map(([date, rom]) => ({
      date: format(parseISO(date), "MMM d"),
      rom,
    }));
  }, [logs, selectedBodyPart]);

  // Weekly exercise comparison - last 4 weeks
  const weeklyData = useMemo(() => {
    const now = new Date();
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(now, i * 7));
      const weekEnd = subDays(now, (i - 1) * 7);
      const weekLogs = logs.filter((l) => {
        const d = parseISO(l.date);
        return d >= weekStart && d < weekEnd;
      });
      weeks.push({
        label: i === 0 ? "This Week" : i === 1 ? "Last Week" : `${i} Weeks Ago`,
        count: weekLogs.length,
        exercises: weekLogs,
      });
    }
    return weeks;
  }, [logs]);

  // Weekly breakdown by exercise name for comparison
  const exerciseComparison = useMemo(() => {
    const exerciseMap = {};
    weeklyData.forEach((week, wi) => {
      week.exercises.forEach((ex) => {
        if (!exerciseMap[ex.exercise_name]) {
          exerciseMap[ex.exercise_name] = { name: ex.exercise_name, weeks: [0, 0, 0, 0] };
        }
        exerciseMap[ex.exercise_name].weeks[wi]++;
      });
    });
    return Object.values(exerciseMap).sort((a, b) => {
      const aTotal = a.weeks.reduce((s, n) => s + n, 0);
      const bTotal = b.weeks.reduce((s, n) => s + n, 0);
      return bTotal - aTotal;
    });
  }, [weeklyData]);

  // Pain vs Activity correlation - last 14 days
  const painActivityData = useMemo(() => {
    const now = new Date();
    const byDate = {};

    Array.from({ length: 14 }).forEach((_, i) => {
      const d = subDays(now, 13 - i);
      const dateStr = format(d, "yyyy-MM-dd");
      byDate[dateStr] = { date: format(d, "MMM d"), count: 0, pain: null };
    });

    logs.forEach((l) => {
      const dateStr = l.date;
      if (byDate[dateStr]) {
        byDate[dateStr].count++;
        if (l.pain_level != null) {
          if (byDate[dateStr].pain == null || l.pain_level > byDate[dateStr].pain) {
            byDate[dateStr].pain = l.pain_level;
          }
        }
      }
    });

    return Object.values(byDate);
  }, [logs]);

  const avgRom = useMemo(() => {
    if (romChartData.length === 0) return null;
    const latest = romChartData[romChartData.length - 1].rom;
    const first = romChartData[0].rom;
    return { latest, first, diff: latest - first };
  }, [romChartData]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
      </div>
    );
  }

  const selectedLabel = bodyParts.find((b) => b.value === selectedBodyPart)?.label;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-600" /> Recovery Summary
        </h3>
        <p className="text-xs text-muted-foreground">Tracking for {currentMemberName}</p>
      </div>

      {/* ROM Trend Chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-orange-600" /> Range of Motion Progress
          </h4>
          <Select value={selectedBodyPart} onValueChange={setSelectedBodyPart}>
            <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {bodyParts.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {romChartData.length === 0 ? (
          <div className="py-8 text-center">
            <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No ROM data for {selectedLabel} yet</p>
            <p className="text-xs text-muted-foreground">Log exercises with range-of-motion values to track recovery</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={romChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: "Degrees", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#888" } }} />
                <Tooltip />
                <Line type="monotone" dataKey="rom" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} name="ROM (°)" connectNulls />
              </LineChart>
            </ResponsiveContainer>

            {avgRom && romChartData.length >= 2 && (
              <div className="flex items-center gap-4 mt-3 p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-[10px] text-muted-foreground">Current ROM</p>
                  <p className="text-lg font-bold text-orange-600">{avgRom.latest}°</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Starting ROM</p>
                  <p className="text-lg font-bold text-gray-500">{avgRom.first}°</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Change</p>
                  <div className="flex items-center gap-1">
                    {avgRom.diff > 0 ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : avgRom.diff < 0 ? (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-lg font-bold ${avgRom.diff > 0 ? "text-green-600" : avgRom.diff < 0 ? "text-red-500" : "text-gray-500"}`}>
                      {avgRom.diff > 0 ? "+" : ""}{avgRom.diff}°
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Pain vs Activity Chart */}
      <Card className="p-5">
        <h4 className="text-xs font-semibold flex items-center gap-1 mb-3">
          <Activity className="w-3.5 h-3.5 text-orange-600" /> Pain vs. Activity
        </h4>
        {painActivityData.every((d) => d.count === 0 && d.pain == null) ? (
          <div className="py-6 text-center">
            <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Log exercises with pain levels to see how activity affects comfort</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={painActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Exercises" />
                <Line yAxisId="right" type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Pain Level" connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              Bars show daily exercise count; the line tracks your peak pain level (0-10). Watch for patterns where more activity correlates with lower pain over time.
            </p>
          </>
        )}
      </Card>

      {/* Weekly Exercise Count Comparison */}
      <Card className="p-5">
        <h4 className="text-xs font-semibold flex items-center gap-1 mb-3">
          <Calendar className="w-3.5 h-3.5 text-orange-600" /> Weekly Exercise Volume
        </h4>
        {weeklyData.every((w) => w.count === 0) ? (
          <div className="py-6 text-center">
            <Dumbbell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No exercises logged in the last 4 weeks</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Exercises" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Per-Exercise Weekly Comparison */}
      <Card className="p-5">
        <h4 className="text-xs font-semibold flex items-center gap-1 mb-3">
          <Dumbbell className="w-3.5 h-3.5 text-orange-600" /> Exercise Breakdown by Week
        </h4>
        {exerciseComparison.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No exercises to compare yet</p>
        ) : (
          <div className="space-y-2">
            {exerciseComparison.map((ex) => {
              const thisWeek = ex.weeks[3];
              const lastWeek = ex.weeks[2];
              const trend = thisWeek > lastWeek ? "up" : thisWeek < lastWeek ? "down" : "same";
              return (
                <div key={ex.name} className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ex.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {ex.weeks.map((count, wi) => (
                        <div key={wi} className="flex items-center gap-0.5">
                          <div className="flex gap-0.5">
                            {Array.from({ length: Math.max(count, 0) }).map((_, ci) => (
                              <div key={ci} className="w-1.5 h-3 bg-orange-400 rounded-sm" />
                            ))}
                            {count === 0 && <div className="w-1.5 h-3 bg-muted rounded-sm" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-orange-600">{thisWeek}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"} vs {lastWeek}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t text-[10px] text-muted-foreground">
          {weeklyData.map((w, i) => (
            <span key={i}>{w.label}: <strong className="text-orange-600">{w.count}</strong></span>
          ))}
        </div>
      </Card>
    </div>
  );
}