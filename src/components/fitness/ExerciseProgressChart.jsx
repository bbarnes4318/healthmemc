import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Dumbbell, TrendingUp, Flame, Trophy, Repeat, Clock, Target, Award } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from "recharts";
import { motion } from "framer-motion";
import { format, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, parseISO } from "date-fns";

const intensityColors = { low: "#22c55e", moderate: "#eab308", high: "#ef4444" };
const intensityLabels = { low: "Low", moderate: "Moderate", high: "High" };

const RANGES = [
  { value: 1, label: "1M" },
  { value: 3, label: "3M" },
  { value: 6, label: "6M" },
];

export default function ExerciseProgressChart() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeMonths, setRangeMonths] = useState(3);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.ExerciseLog.list("-date", 500);
        setLogs(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const filteredLogs = useMemo(() => {
    const cutoff = subMonths(new Date(), rangeMonths);
    return logs.filter((l) => l.date && isWithinInterval(parseISO(l.date), { start: cutoff, end: new Date() }));
  }, [logs, rangeMonths]);

  // Weekly volume data (volume = sets × reps for rep-based, duration for time-based)
  const weeklyVolume = useMemo(() => {
    if (filteredLogs.length === 0) return [];
    const earliest = filteredLogs.reduce((min, l) => l.date < min ? l.date : min, filteredLogs[0].date);
    const start = startOfWeek(parseISO(earliest), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    const weeks = [];
    let cursor = start;
    while (cursor <= end) {
      const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });
      const weekLogs = filteredLogs.filter((l) => {
        const d = parseISO(l.date);
        return d >= cursor && d <= weekEnd;
      });
      let repVolume = 0;
      let durationVolume = 0;
      let sessionCount = weekLogs.length;
      weekLogs.forEach((l) => {
        if (l.sets && l.reps) {
          repVolume += l.sets * l.reps;
        } else if (l.duration_minutes) {
          durationVolume += l.duration_minutes;
        }
      });
      weeks.push({
        week: format(cursor, "MMM d"),
        repVolume,
        durationVolume,
        sessions: sessionCount,
      });
      cursor = new Date(weekEnd.getTime() + 86400000);
    }
    return weeks;
  }, [filteredLogs]);

  // Weekly intensity distribution
  const weeklyIntensity = useMemo(() => {
    if (filteredLogs.length === 0) return [];
    const earliest = filteredLogs.reduce((min, l) => l.date < min ? l.date : min, filteredLogs[0].date);
    const start = startOfWeek(parseISO(earliest), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    const weeks = [];
    let cursor = start;
    while (cursor <= end) {
      const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });
      const weekLogs = filteredLogs.filter((l) => {
        const d = parseISO(l.date);
        return d >= cursor && d <= weekEnd;
      });
      weeks.push({
        week: format(cursor, "MMM d"),
        low: weekLogs.filter((l) => l.intensity === "low").length,
        moderate: weekLogs.filter((l) => l.intensity === "moderate").length,
        high: weekLogs.filter((l) => l.intensity === "high").length,
      });
      cursor = new Date(weekEnd.getTime() + 86400000);
    }
    return weeks;
  }, [filteredLogs]);

  // Personal records: best volume (sets×reps), max reps, max duration per exercise
  const personalRecords = useMemo(() => {
    if (filteredLogs.length === 0) return [];
    const byExercise = {};
    filteredLogs.forEach((l) => {
      const name = l.exercise_name || "Unknown";
      if (!byExercise[name]) byExercise[name] = { name, maxVolume: 0, maxReps: 0, maxSets: 0, maxDuration: 0, sessions: 0 };
      const rec = byExercise[name];
      rec.sessions++;
      const volume = (l.sets || 0) * (l.reps || 0);
      if (volume > rec.maxVolume) rec.maxVolume = volume;
      if ((l.reps || 0) > rec.maxReps) rec.maxReps = l.reps;
      if ((l.sets || 0) > rec.maxSets) rec.maxSets = l.sets;
      if ((l.duration_minutes || 0) > rec.maxDuration) rec.maxDuration = l.duration_minutes;
    });
    return Object.values(byExercise).sort((a, b) => b.maxVolume - a.maxVolume).slice(0, 8);
  }, [filteredLogs]);

  // Summary stats
  const stats = useMemo(() => {
    const totalSessions = filteredLogs.length;
    const totalVolume = filteredLogs.reduce((s, l) => s + ((l.sets || 0) * (l.reps || 0)), 0);
    const totalDuration = filteredLogs.reduce((s, l) => s + (l.duration_minutes || 0), 0);
    const highIntensityCount = filteredLogs.filter((l) => l.intensity === "high").length;
    return { totalSessions, totalVolume, totalDuration, highIntensityCount };
  }, [filteredLogs]);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div>
      </Card>
    );
  }

  if (filteredLogs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No exercise logs in this period</p>
        <p className="text-xs text-muted-foreground mt-1">Log workouts to see your progress charts and personal records.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-600" />
          <h3 className="text-sm font-semibold">Exercise Progress</h3>
        </div>
        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setRangeMonths(r.value)}
              className={`text-xs px-2.5 py-1 rounded font-medium transition ${rangeMonths === r.value ? "bg-white shadow-sm text-orange-600" : "text-muted-foreground"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Sessions", value: stats.totalSessions, icon: Repeat, color: "text-sky-600", bg: "bg-sky-50" },
          { label: "Total Volume (reps)", value: stats.totalVolume.toLocaleString(), icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Total Minutes", value: stats.totalDuration, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "High Intensity", value: stats.highIntensityCount, icon: Flame, color: "text-red-500", bg: "bg-red-50" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-4 h-4 ${stat.color} mb-1`} />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Volume Over Time */}
      {weeklyVolume.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-orange-600" /> Weekly Training Volume
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyVolume} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="durGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="repVolume" name="Rep Volume" stroke="#f97316" strokeWidth={2} fill="url(#repGrad)" />
              <Area type="monotone" dataKey="durationVolume" name="Duration (min)" stroke="#22c55e" strokeWidth={2} fill="url(#durGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Intensity Distribution */}
      {weeklyIntensity.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-red-500" /> Weekly Intensity Distribution
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyIntensity} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="low" name="Low" stackId="intensity" fill={intensityColors.low} />
              <Bar dataKey="moderate" name="Moderate" stackId="intensity" fill={intensityColors.moderate} />
              <Bar dataKey="high" name="High" stackId="intensity" fill={intensityColors.high} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Personal Records */}
      {personalRecords.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Personal Records
          </h4>
          <div className="space-y-2">
            {personalRecords.map((pr, i) => (
              <motion.div key={pr.name} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-card">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{pr.name}</p>
                    <p className="text-[9px] text-muted-foreground">{pr.sessions} {pr.sessions === 1 ? "session" : "sessions"}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    {pr.maxVolume > 0 && (
                      <div className="text-center">
                        <p className="font-bold text-orange-600">{pr.maxVolume}</p>
                        <p className="text-[8px] text-muted-foreground">max vol</p>
                      </div>
                    )}
                    {pr.maxReps > 0 && (
                      <div className="text-center">
                        <p className="font-bold text-sky-600">{pr.maxReps}</p>
                        <p className="text-[8px] text-muted-foreground">max reps</p>
                      </div>
                    )}
                    {pr.maxDuration > 0 && (
                      <div className="text-center">
                        <p className="font-bold text-emerald-600">{pr.maxDuration}m</p>
                        <p className="text-[8px] text-muted-foreground">max time</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}