import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Users, Loader2, Footprints, Dumbbell, Clock, Flame, Trophy, Plus, TrendingUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, parseISO, subWeeks, addWeeks, isSameDay } from "date-fns";

const medalColors = ["#facc15", "#cbd5e1", "#d97706"]; // gold, silver, bronze
const memberColors = ["#0ea5e9", "#8b5cf6", "#22c55e", "#f97316", "#ec4899", "#14b8a6", "#6366f1", "#eab308"];

export default function FamilyFitnessChallenge() {
  const [members, setMembers] = useState([]);
  const [stepsData, setStepsData] = useState([]);
  const [exerciseData, setExerciseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loggingMember, setLoggingMember] = useState(null);
  const [stepInput, setStepInput] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const currentWeek = useMemo(() => {
    const ref = subWeeks(new Date(), weekOffset);
    return { start: startOfWeek(ref, { weekStartsOn: 1 }), end: endOfWeek(ref, { weekStartsOn: 1 }) };
  }, [weekOffset]);

  useEffect(() => {
    const load = async () => {
      try {
        const [familyMembers, steps, exercises] = await Promise.all([
          base44.entities.FamilyMember.list(),
          base44.entities.VitalRecord.filter({ type: "steps" }, "-recorded_at", 500),
          base44.entities.ExerciseLog.list("-date", 500),
        ]);
        const memberList = [{ id: "__you__", name: "You", relationship: "self" }];
        familyMembers.forEach((m) => memberList.push(m));
        setMembers(memberList);
        setStepsData(steps);
        setExerciseData(exercises);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  // Per-member weekly steps
  const memberStepStats = useMemo(() => {
    return members.map((m, idx) => {
      const fid = m.id === "__you__" ? null : m.id;
      const weekSteps = stepsData.filter((s) => {
        if ((s.family_member_id || null) !== fid) return false;
        const d = s.recorded_at ? parseISO(s.recorded_at) : null;
        return d && isWithinInterval(d, { start: currentWeek.start, end: currentWeek.end });
      });
      const totalSteps = weekSteps.reduce((sum, s) => sum + (s.value || 0), 0);
      const dailyAvg = Math.round(totalSteps / 7);
      return { ...m, totalSteps, dailyAvg, stepEntries: weekSteps.length, color: memberColors[idx % memberColors.length] };
    }).sort((a, b) => b.totalSteps - a.totalSteps);
  }, [members, stepsData, currentWeek]);

  // Per-member weekly exercise stats
  const memberExerciseStats = useMemo(() => {
    return members.map((m) => {
      const fid = m.id === "__you__" ? null : m.id;
      const weekExercises = exerciseData.filter((e) => {
        if ((e.family_member_id || null) !== fid) return false;
        const d = e.date ? parseISO(e.date) : null;
        return d && isWithinInterval(d, { start: currentWeek.start, end: currentWeek.end });
      });
      const totalMinutes = weekExercises.reduce((s, e) => s + (e.duration_minutes || 0), 0);
      const highIntensity = weekExercises.filter((e) => e.intensity === "high").length;
      return { id: m.id, name: m.name, sessions: weekExercises.length, totalMinutes, highIntensity };
    });
  }, [members, exerciseData, currentWeek]);

  // Collective totals
  const collective = useMemo(() => {
    const totalSteps = memberStepStats.reduce((s, m) => s + m.totalSteps, 0);
    const totalSessions = memberExerciseStats.reduce((s, m) => s + m.sessions, 0);
    const totalMinutes = memberExerciseStats.reduce((s, m) => s + m.totalMinutes, 0);
    const activeMembers = memberStepStats.filter((m) => m.totalSteps > 0 || memberExerciseStats.find((e) => e.id === m.id)?.sessions > 0).length;
    return { totalSteps, totalSessions, totalMinutes, activeMembers };
  }, [memberStepStats, memberExerciseStats]);

  // Daily step chart data for the week (stacked per member)
  const dailyChartData = useMemo(() => {
    const days = eachDayOfInterval({ start: currentWeek.start, end: currentWeek.end });
    return days.map((day) => {
      const entry = { day: format(day, "EEE") };
      members.forEach((m) => {
        const fid = m.id === "__you__" ? null : m.id;
        const daySteps = stepsData.filter((s) => {
          if ((s.family_member_id || null) !== fid) return false;
          const d = s.recorded_at ? parseISO(s.recorded_at) : null;
          return d && isSameDay(d, day);
        });
        entry[m.name] = daySteps.reduce((sum, s) => sum + (s.value || 0), 0);
      });
      return entry;
    });
  }, [members, stepsData, currentWeek]);

  const handleLogSteps = async () => {
    const steps = parseInt(stepInput);
    if (!loggingMember || isNaN(steps) || steps <= 0) return;
    setSaving(true);
    try {
      await base44.entities.VitalRecord.create({
        type: "steps",
        value: steps,
        unit: "steps",
        recorded_at: new Date().toISOString(),
        family_member_id: loggingMember === "__you__" ? undefined : loggingMember,
      });
      setStepInput("");
      setLoggingMember(null);
      // Reload steps
      const newSteps = await base44.entities.VitalRecord.filter({ type: "steps" }, "-recorded_at", 500);
      setStepsData(newSteps);
      toast({ title: "Steps logged!", description: `${steps.toLocaleString()} steps added.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to log steps", variant: "destructive" });
    }
    setSaving(false);
  };

  const leader = memberStepStats[0];
  const weekLabel = `${format(currentWeek.start, "MMM d")} – ${format(currentWeek.end, "MMM d, yyyy")}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" /> Family Fitness Challenge
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Collective progress and weekly step competitions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}><Calendar className="w-3.5 h-3.5 mr-1" />Prev</Button>
          <span className="text-xs font-semibold min-w-[120px] text-center">{weekOffset === 0 ? "This Week" : weekOffset === 1 ? "Last Week" : `${weekOffset}w ago`}</span>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))} disabled={weekOffset === 0}>Next</Button>
        </div>
      </div>

      {/* Collective Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Steps", value: collective.totalSteps.toLocaleString(), icon: Footprints, color: "text-sky-600", bg: "bg-sky-50" },
          { label: "Workout Sessions", value: collective.totalSessions, icon: Dumbbell, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Active Minutes", value: collective.totalMinutes, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Active Members", value: `${collective.activeMembers}/${members.length}`, icon: Flame, color: "text-violet-600", bg: "bg-violet-50" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`p-4 ${stat.bg} border-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Weekly Step Leaderboard */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Weekly Step Leaderboard
          </h3>
          <span className="text-xs text-muted-foreground">{weekLabel}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Compete to see who walks the most this week!</p>

        {leader?.totalSteps === 0 ? (
          <div className="text-center py-8">
            <Footprints className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No steps logged this week yet</p>
            <p className="text-xs text-muted-foreground mt-1">Log your steps below to join the challenge!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {memberStepStats.map((m, i) => {
              const maxSteps = leader?.totalSteps || 1;
              const pct = maxSteps > 0 ? (m.totalSteps / maxSteps) * 100 : 0;
              return (
                <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs" style={{ backgroundColor: i < 3 ? medalColors[i] : "hsl(var(--muted))", color: i < 3 ? "#fff" : "hsl(var(--muted-foreground))" }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold truncate">{m.name}</span>
                        <span className="text-sm font-bold" style={{ color: m.color }}>{m.totalSteps.toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">steps</span></span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: m.color, width: `${pct}%` }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.06 + 0.2, duration: 0.5 }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.dailyAvg.toLocaleString()} avg/day · {m.stepEntries} {m.stepEntries === 1 ? "entry" : "entries"}</p>
                    </div>
                    {i === 0 && m.totalSteps > 0 && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Daily Steps Chart */}
      {dailyChartData.some((d) => Object.values(d).some((v, i) => i > 0 && v > 0)) && (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-600" /> Daily Steps Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {members.map((m) => (
                <Bar key={m.id} dataKey={m.name} stackId="steps" fill={memberColors[members.indexOf(m) % memberColors.length]} radius={[0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Per-Member Exercise Summary */}
      <Card className="p-5">
        <h3 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-orange-600" /> Weekly Workout Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {memberExerciseStats.map((m, i) => (
            <div key={m.id} className="p-3 rounded-lg border bg-card flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                <Dumbbell className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{m.name}</p>
                <p className="text-[10px] text-muted-foreground">{m.sessions} {m.sessions === 1 ? "session" : "sessions"} · {m.totalMinutes} min{m.highIntensity > 0 ? ` · ${m.highIntensity} high intensity` : ""}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Log Steps */}
      <Card className="p-5">
        <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-sky-600" /> Log Steps
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={loggingMember || ""}
            onChange={(e) => setLoggingMember(e.target.value)}
            className="sm:w-48 h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <Input
            type="number"
            placeholder="Number of steps (e.g., 8500)"
            value={stepInput}
            onChange={(e) => setStepInput(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleLogSteps} disabled={!loggingMember || !stepInput || saving} className="bg-sky-600 hover:bg-sky-700">
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            Log Steps
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Steps are recorded for today and count toward this week's challenge.</p>
      </Card>
    </div>
  );
}