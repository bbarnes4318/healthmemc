import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, Loader2, Heart, Brain, Moon, Dumbbell, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays, isAfter } from "date-fns";

const scoreColors = (score) => {
  if (score >= 75) return { bar: "#22c55e", text: "text-emerald-600", bg: "bg-emerald-50", label: "Excellent" };
  if (score >= 60) return { bar: "#84cc16", text: "text-lime-600", bg: "bg-lime-50", label: "Good" };
  if (score >= 45) return { bar: "#eab308", text: "text-amber-600", bg: "bg-amber-50", label: "Fair" };
  return { bar: "#ef4444", text: "text-red-500", bg: "bg-red-50", label: "Needs Attention" };
};

function calcMemberScore(journals, exercises) {
  const fourteenDaysAgo = subDays(new Date(), 14);
  const recentJournals = journals.filter((j) => j.date && isAfter(new Date(j.date), fourteenDaysAgo));
  const recentExercises = exercises.filter((e) => e.date && isAfter(new Date(e.date), fourteenDaysAgo));

  // Mood score (0-100): avg mood_score / 5 * 100
  let moodScore = 0;
  if (recentJournals.length > 0) {
    const avgMood = recentJournals.reduce((s, j) => s + (j.mood_score || 3), 0) / recentJournals.length;
    moodScore = (avgMood / 5) * 100;
  }

  // Stress score (inverted): (5 - avg_stress) / 5 * 100
  let stressScore = 0;
  if (recentJournals.length > 0) {
    const avgStress = recentJournals.reduce((s, j) => s + (j.stress_score || 3), 0) / recentJournals.length;
    stressScore = ((5 - avgStress) / 5) * 100;
  }

  // Sleep score
  let sleepScore = 0;
  if (recentJournals.length > 0) {
    const avgSleep = recentJournals.reduce((s, j) => s + (j.sleep_score || 3), 0) / recentJournals.length;
    sleepScore = (avgSleep / 5) * 100;
  }

  // Exercise score: 5+ sessions = 100, scaled down. Intensity bonus.
  let exerciseScore = 0;
  if (recentExercises.length > 0) {
    const sessionCount = Math.min(recentExercises.length, 7);
    const baseScore = (sessionCount / 5) * 80;
    const intensityBonus = recentExercises.reduce((s, e) => {
      if (e.intensity === "high") return s + 4;
      if (e.intensity === "moderate") return s + 2.5;
      return s + 1;
    }, 0) / recentExercises.length;
    exerciseScore = Math.min(baseScore + intensityBonus * 5, 100);
  }

  // Weighted composite: mood 30%, stress 25%, sleep 25%, exercise 20%
  const hasJournals = recentJournals.length > 0;
  const hasExercises = recentExercises.length > 0;

  let composite;
  if (hasJournals && hasExercises) {
    composite = moodScore * 0.3 + stressScore * 0.25 + sleepScore * 0.25 + exerciseScore * 0.2;
  } else if (hasJournals) {
    composite = moodScore * 0.4 + stressScore * 0.3 + sleepScore * 0.3;
  } else if (hasExercises) {
    composite = exerciseScore;
  } else {
    composite = null; // no data
  }

  return {
    composite: composite !== null ? Math.round(composite) : null,
    mood: Math.round(moodScore),
    stress: Math.round(stressScore),
    sleep: Math.round(sleepScore),
    exercise: Math.round(exerciseScore),
    journalCount: recentJournals.length,
    exerciseCount: recentExercises.length,
  };
}

const ScoreBar = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
    <span className="text-[10px] text-muted-foreground w-12 shrink-0">{label}</span>
    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
    <span className="text-[10px] font-semibold w-7 text-right">{value}</span>
  </div>
);

export default function FamilyHealthScoreCard() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [familyMembers, journals, exercises] = await Promise.all([
          base44.entities.FamilyMember.list(),
          base44.entities.WellnessJournal.list("-date", 60),
          base44.entities.ExerciseLog.list("-date", 60),
        ]);

        // Build member list including "You"
        const memberList = [{ id: "__you__", name: "You", relationship: "self" }];
        familyMembers.forEach((m) => memberList.push(m));

        // Partition data by family_member_id
        const scored = memberList.map((m) => {
          const fid = m.id === "__you__" ? null : m.id;
          const memberJournals = journals.filter((j) => (j.family_member_id || null) === fid);
          const memberExercises = exercises.filter((e) => (e.family_member_id || null) === fid);
          return { ...m, scores: calcMemberScore(memberJournals, memberExercises) };
        });

        // Only show members with data
        setMembers(scored.filter((m) => m.scores.composite !== null));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const chartData = useMemo(() =>
    members.map((m) => ({
      name: m.name.length > 10 ? m.name.slice(0, 9) + "…" : m.name,
      score: m.scores.composite,
      fill: scoreColors(m.scores.composite).bar,
    })),
  [members]);

  const avgScore = useMemo(() => {
    const valid = members.filter((m) => m.scores.composite !== null);
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((s, m) => s + m.scores.composite, 0) / valid.length);
  }, [members]);

  const topMember = useMemo(() => {
    const valid = members.filter((m) => m.scores.composite !== null);
    if (valid.length === 0) return null;
    return valid.reduce((max, m) => (m.scores.composite > max.scores.composite ? m : max));
  }, [members]);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-sky-600" />
          <h3 className="font-display font-semibold text-sm">Family Health Comparison</h3>
        </div>
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-sky-600" />
          <h3 className="font-display font-semibold text-sm">Family Health Comparison</h3>
        </div>
        <div className="text-center py-6">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No wellness or exercise data yet.</p>
          <p className="text-[10px] text-muted-foreground mt-1">Log journal entries and workouts to see family health scores.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-600" />
          <h3 className="font-display font-semibold text-sm">Family Health Comparison</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">Family Avg:</span>
          <span className={`text-sm font-bold ${scoreColors(avgScore).text}`}>{avgScore}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mb-4">Comparative scores from last 14 days of wellness journals & exercise logs</p>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
            formatter={(value) => [`${value}/100`, "Health Score"]}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Member Breakdown List */}
      <div className="mt-4 space-y-2">
        {members.map((m, i) => {
          const s = m.scores;
          const colors = scoreColors(s.composite);
          const expanded = expandedId === m.id || members.length <= 2;
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`p-3 rounded-lg border ${colors.bg} border-transparent`}>
                <button
                  className="w-full flex items-center gap-3"
                  onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                >
                  <div className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center shrink-0 font-semibold text-xs" style={{ color: colors.bar }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold truncate">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{m.relationship === "self" ? "You" : m.relationship} · {s.journalCount} journals, {s.exerciseCount} workouts</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold ${colors.text}`}>{s.composite}</p>
                    <p className="text-[9px] text-muted-foreground">{colors.label}</p>
                  </div>
                  {members.length > 2 && (
                    expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>

                {expanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 space-y-1.5">
                    <ScoreBar label="Mood" value={s.mood} icon={Heart} color="hsl(349, 73%, 56%)" />
                    <ScoreBar label="Stress" value={s.stress} icon={Brain} color="hsl(25, 95%, 53%)" />
                    <ScoreBar label="Sleep" value={s.sleep} icon={Moon} color="hsl(258, 58%, 58%)" />
                    <ScoreBar label="Exercise" value={s.exercise} icon={Dumbbell} color="hsl(199, 89%, 48%)" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {topMember && members.length > 1 && (
        <div className="mt-3 flex items-center gap-2 p-2.5 bg-emerald-50 rounded-lg">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <p className="text-[10px] text-emerald-800">
            <span className="font-semibold">{topMember.name}</span> is leading with a score of <span className="font-bold">{topMember.scores.composite}</span>
          </p>
        </div>
      )}
    </Card>
  );
}