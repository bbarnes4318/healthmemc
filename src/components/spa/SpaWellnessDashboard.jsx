import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, Brain, TrendingUp, Activity, Heart, BarChart3, Sparkles, Moon, Zap } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, subDays, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { motion } from "framer-motion";

const categoryColors = {
  spa_treatment: "#ec4899",
  meditation: "#8b5cf6",
  relaxation_ritual: "#10b981",
};

const categoryLabels = {
  spa_treatment: "Spa Treatment",
  meditation: "Meditation",
  relaxation_ritual: "Ritual",
};

const moodLabels = ["Poor", "Low", "Okay", "Good", "Great"];
const stressLabels = ["Minimal", "Low", "Moderate", "High", "Severe"];

export default function SpaWellnessDashboard() {
  const [sessions, setSessions] = useState([]);
  const [journals, setJournals] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, j, sc] = await Promise.all([
          base44.entities.SpaWellnessSession.list("-session_date", 200),
          base44.entities.WellnessJournal.list("-date", 90),
          base44.entities.SpaSchedule.list("-schedule_date", 50),
        ]);
        setSessions(s);
        setJournals(j);
        setSchedules(sc);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const moodLifts = sessions.map((s) => (s.mood_after_score || 0) - (s.mood_before_score || 0)).filter((d) => d !== 0);
    const stressReductions = sessions.map((s) => (s.stress_before_score || 0) - (s.stress_after_score || 0)).filter((d) => d !== 0);
    const avgMoodLift = moodLifts.length > 0 ? (moodLifts.reduce((a, b) => a + b, 0) / moodLifts.length) : 0;
    const avgStressReduction = stressReductions.length > 0 ? (stressReductions.reduce((a, b) => a + b, 0) / stressReductions.length) : 0;
    const completedSchedules = schedules.filter((s) => s.status === "completed").length;
    const totalMeditationMin = sessions.filter((s) => s.session_category === "meditation").reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    return { totalSessions, avgMoodLift, avgStressReduction, completedSchedules, totalMeditationMin };
  }, [sessions, schedules]);

  // 30-day mood/stress trend with session markers
  const trendData = useMemo(() => {
    if (journals.length === 0) return [];
    const now = new Date();
    const start = subDays(now, 30);
    const days = eachDayOfInterval({ start, end: now });
    return days.map((day) => {
      const entry = journals.find((j) => j.date && isSameDay(parseISO(j.date), day));
      const hasSession = sessions.some((s) => s.session_date && isSameDay(new Date(s.session_date), day));
      return {
        date: format(day, "MMM d"),
        mood: entry?.mood_score ?? null,
        stress: entry?.stress_score ?? null,
        sleep: entry?.sleep_hours ?? null,
        session: hasSession,
      };
    });
  }, [journals, sessions]);

  // Before/after comparison for recent sessions
  const beforeAfterData = useMemo(() => {
    return sessions.slice(0, 8).reverse().map((s, i) => ({
      name: format(new Date(s.session_date), "M/d"),
      moodBefore: s.mood_before_score || 3,
      moodAfter: s.mood_after_score || 4,
      stressBefore: s.stress_before_score || 3,
      stressAfter: s.stress_after_score || 2,
    }));
  }, [sessions]);

  // Session distribution by category
  const distributionData = useMemo(() => {
    const counts = { spa_treatment: 0, meditation: 0, relaxation_ritual: 0 };
    sessions.forEach((s) => { counts[s.session_category] = (counts[s.session_category] || 0) + 1; });
    return Object.entries(counts).filter(([_, c]) => c > 0).map(([k, count]) => ({ name: categoryLabels[k], value: count, fill: categoryColors[k] }));
  }, [sessions]);

  // Correlation: days with sessions vs without
  const correlationData = useMemo(() => {
    if (journals.length === 0) return null;
    const sessionDates = new Set(sessions.map((s) => s.session_date?.slice(0, 10)));
    const withSessions = journals.filter((j) => sessionDates.has(j.date?.slice(0, 10)));
    const withoutSessions = journals.filter((j) => !sessionDates.has(j.date?.slice(0, 10)));
    const avg = (arr, field) => arr.length > 0 ? (arr.reduce((s, e) => s + (e[field] || 0), 0) / arr.length) : 0;
    return {
      withSessions: { count: withSessions.length, mood: avg(withSessions, "mood_score"), stress: avg(withSessions, "stress_score"), sleep: avg(withSessions, "sleep_hours") },
      withoutSessions: { count: withoutSessions.length, mood: avg(withoutSessions, "mood_score"), stress: avg(withoutSessions, "stress_score"), sleep: avg(withoutSessions, "sleep_hours") },
    };
  }, [sessions, journals]);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
      </Card>
    );
  }

  if (sessions.length === 0 && journals.length === 0) {
    return (
      <Card className="p-8 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No data to visualize yet</p>
        <p className="text-xs text-muted-foreground mt-1">Log wellness sessions and daily mood entries to see your wellness impact dashboard.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Sessions", value: stats.totalSessions, icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Avg Mood Lift", value: `+${stats.avgMoodLift.toFixed(1)}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Avg Stress Drop", value: `-${stats.avgStressReduction.toFixed(1)}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Meditation Min", value: stats.totalMeditationMin, icon: Brain, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Schedules Done", value: stats.completedSchedules, icon: Sparkles, color: "text-pink-600", bg: "bg-pink-50" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-3">
              <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center mb-1.5`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Mood & Stress Trend with Session Markers */}
      {trendData.some((d) => d.mood !== null) && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-600" /> Mood & Stress Trend (30 days)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} interval={4} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v, name) => {
                if (v === null) return ["—", name];
                if (name === "Mood") return [moodLabels[v - 1] || v, name];
                if (name === "Stress") return [stressLabels[v - 1] || v, name];
                return [v, name];
              }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="mood" name="Mood" stroke="#ec4899" strokeWidth={2} dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.session && cx !== undefined) {
                  return <circle key={`m-${payload.date}`} cx={cx} cy={cy} r={4} fill="#8b5cf6" stroke="#fff" strokeWidth={1.5} />;
                }
                return <circle key={`m-${payload.date}`} cx={cx} cy={cy} r={0} />;
              }} connectNulls />
              <Line type="monotone" dataKey="stress" name="Stress" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><circle cx="4" cy="4" r="3" fill="#8b5cf6" /> Spa session day</span>
            <span>Mood scale: 1=Poor → 5=Great</span>
            <span>Stress scale: 1=Minimal → 5=Severe</span>
          </div>
        </Card>
      )}

      {/* Before/After Impact */}
      {beforeAfterData.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Session Impact: Before vs After
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={beforeAfterData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v, name) => {
                if (name?.includes("Mood")) return [moodLabels[v - 1] || v, name];
                if (name?.includes("Stress")) return [stressLabels[v - 1] || v, name];
                return [v, name];
              }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="moodBefore" name="Mood Before" fill="#f3e8ff" radius={[2, 2, 0, 0]} />
              <Bar dataKey="moodAfter" name="Mood After" fill="#ec4899" radius={[2, 2, 0, 0]} />
              <Bar dataKey="stressBefore" name="Stress Before" fill="#dbeafe" radius={[2, 2, 0, 0]} />
              <Bar dataKey="stressAfter" name="Stress After" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Session Distribution */}
        {distributionData.length > 0 && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" /> Session Distribution
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 9 }}>
                  {distributionData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Correlation Analysis */}
        {correlationData && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Spa Session Impact Analysis
            </h3>
            <p className="text-[10px] text-muted-foreground mb-3">Average scores on days with spa sessions vs days without</p>
            <div className="space-y-2.5">
              {[
                { label: "Mood Score", withVal: correlationData.withSessions.mood, withoutVal: correlationData.withoutSessions.mood, higher: true, suffix: "" },
                { label: "Stress Level", withVal: correlationData.withSessions.stress, withoutVal: correlationData.withoutSessions.stress, higher: false, suffix: "" },
                { label: "Sleep Hours", withVal: correlationData.withSessions.sleep, withoutVal: correlationData.withoutSessions.sleep, higher: true, suffix: "h" },
              ].map((metric) => {
                const diff = metric.withVal - metric.withoutVal;
                const isBetter = metric.higher ? diff > 0 : diff < 0;
                const labels = metric.label.includes("Mood") ? moodLabels : metric.label.includes("Stress") ? stressLabels : null;
                return (
                  <div key={metric.label} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-20 shrink-0">{metric.label}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-muted-foreground">With sessions</span>
                          <span className="text-xs font-bold text-purple-600">
                            {labels ? labels[Math.round(metric.withVal) - 1] || metric.withVal.toFixed(1) : `${metric.withVal.toFixed(1)}${metric.suffix}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-muted-foreground">Without</span>
                          <span className="text-xs font-bold text-gray-500">
                            {labels ? labels[Math.round(metric.withoutVal) - 1] || metric.withoutVal.toFixed(1) : `${metric.withoutVal.toFixed(1)}${metric.suffix}`}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isBetter ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-muted-foreground mt-3 italic">
              Based on {correlationData.withSessions.count} days with sessions and {correlationData.withoutSessions.count} days without.
            </p>
          </Card>
        )}
      </div>

      {/* Sleep Trend */}
      {trendData.some((d) => d.sleep !== null) && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-600" /> Sleep Hours Trend
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} interval={4} />
              <YAxis domain={[0, 12]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => v !== null ? [`${v}h`, "Sleep"] : ["—", "Sleep"]} />
              <Line type="monotone" dataKey="sleep" name="Sleep" stroke="#6366f1" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}