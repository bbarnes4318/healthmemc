import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Activity, Award, Calendar, HeartPulse, Target } from "lucide-react";
import { motion } from "framer-motion";
import { format, subMonths, parseISO, differenceInDays } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  ComposedChart, Bar, Area
} from "recharts";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const sixMonthsAgo = () => subMonths(new Date(), 6).toISOString().split("T")[0];

const bodyPartLabels = {
  knee: "Knee", shoulder: "Shoulder", hip: "Hip", spine: "Spine",
  ankle: "Ankle", wrist: "Wrist", neck: "Neck", full_body: "Full Body", other: "Other",
};

const woundLabels = {
  clean_healing: "Clean Healing", redness: "Redness", swelling: "Swelling",
  discharge: "Discharge", dehiscence: "Dehiscence", infection: "Infection",
  fully_healed: "Fully Healed",
};

const mobilityLabels = {
  bedridden: "Bedridden", limited_assistance: "Limited Assistance",
  with_walker: "With Walker", independent_limited: "Independent (Limited)",
  fully_mobile: "Fully Mobile",
};

export default function MasterRecoveryDashboard() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [exercises, setExercises] = useState([]);
  const [recovery, setRecovery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBodyPart, setSelectedBodyPart] = useState("knee");

  useEffect(() => {
    const load = async () => {
      try {
        const since = sixMonthsAgo();
        const [exData, recData] = await Promise.all([
          base44.entities.ExerciseLog.list("-date", 500),
          base44.entities.SurgicalRecovery.list("-log_date", 500),
        ]);
        const filteredEx = currentMemberId
          ? exData.filter((l) => l.family_member_id === currentMemberId && l.date >= since)
          : exData.filter((l) => l.date >= since);
        const filteredRec = currentMemberId
          ? recData.filter((l) => (l.family_member_id === currentMemberId || !l.family_member_id) && l.log_date >= since)
          : recData.filter((l) => l.log_date >= since);
        setExercises(filteredEx);
        setRecovery(filteredRec);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  // Combined ROM trend (exercise ROM + surgical ROM flexion)
  const romTrend = useMemo(() => {
    const exByDate = {};
    exercises
      .filter((l) => l.body_part === selectedBodyPart && l.rom_degrees != null)
      .forEach((l) => {
        if (!exByDate[l.date] || l.rom_degrees > exByDate[l.date]) exByDate[l.date] = l.rom_degrees;
      });

    const recByDate = {};
    recovery
      .filter((l) => l.rom_flexion != null)
      .forEach((l) => {
        if (!recByDate[l.log_date] || l.rom_flexion > recByDate[l.log_date]) recByDate[l.log_date] = l.rom_flexion;
      });

    const allDates = [...new Set([...Object.keys(exByDate), ...Object.keys(recByDate)])].sort();
    return allDates.map((d) => ({
      date: format(parseISO(d), "MMM d"),
      exerciseROM: exByDate[d] || null,
      surgicalROM: recByDate[d] || null,
    }));
  }, [exercises, recovery, selectedBodyPart]);

  // Combined pain trend (exercise pain + surgical pain)
  const painTrend = useMemo(() => {
    const exByDate = {};
    exercises
      .filter((l) => l.body_part === selectedBodyPart && l.pain_level != null)
      .forEach((l) => {
        if (!(l.date in exByDate)) exByDate[l.date] = l.pain_level;
      });

    const recByDate = {};
    recovery
      .filter((l) => l.pain_level != null)
      .forEach((l) => {
        if (!(l.log_date in recByDate)) recByDate[l.log_date] = l.pain_level;
      });

    const allDates = [...new Set([...Object.keys(exByDate), ...Object.keys(recByDate)])].sort();
    return allDates.map((d) => ({
      date: format(parseISO(d), "MMM d"),
      exercisePain: exByDate[d] ?? null,
      surgicalPain: recByDate[d] ?? null,
    }));
  }, [exercises, recovery, selectedBodyPart]);

  // Milestones from surgical recovery
  const milestones = useMemo(() => {
    const all = recovery.flatMap((l) =>
      (l.milestones_reached || []).map((m) => ({ milestone: m, date: l.log_date, surgery: l.surgery_name }))
    );
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [recovery]);

  // Activity volume per month
  const monthlyActivity = useMemo(() => {
    const months = {};
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(new Date(), i);
      const key = format(m, "yyyy-MM");
      const label = format(m, "MMM");
      months[key] = { month: label, sessions: 0, totalMinutes: 0 };
      monthLabels.push(key);
    }
    exercises.forEach((l) => {
      const key = (l.date || "").slice(0, 7);
      if (key in months) {
        months[key].sessions++;
        months[key].totalMinutes += l.duration_minutes || 0;
      }
    });
    return monthLabels.map((k) => months[k]);
  }, [exercises]);

  // Summary stats
  const stats = useMemo(() => {
    const totalSessions = exercises.length;
    const totalRecoveryLogs = recovery.length;
    const surgeries = [...new Set(recovery.map((l) => l.surgery_name))];
    const allPain = [...exercises.map((l) => l.pain_level), ...recovery.map((l) => l.pain_level)].filter((p) => p != null);
    const avgPain = allPain.length ? (allPain.reduce((s, p) => s + p, 0) / allPain.length).toFixed(1) : "—";
    const firstPain = allPain.length > 1 ? allPain[0] : null;
    const lastPain = allPain.length > 1 ? allPain[allPain.length - 1] : null;
    const painChange = firstPain != null && lastPain != null ? (lastPain - firstPain) : null;

    const allROM = exercises.filter((l) => l.body_part === selectedBodyPart && l.rom_degrees != null).map((l) => l.rom_degrees);
    const firstROM = allROM.length > 1 ? allROM[0] : null;
    const lastROM = allROM.length > 1 ? allROM[allROM.length - 1] : null;
    const romChange = firstROM != null && lastROM != null ? (lastROM - firstROM) : null;

    return { totalSessions, totalRecoveryLogs, surgeries: surgeries.length, avgPain, painChange, romChange, milestoneCount: milestones.length };
  }, [exercises, recovery, milestones, selectedBodyPart]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-600" />
          Master Recovery Dashboard
        </h2>
        <p className="text-xs text-muted-foreground">
          6-month aggregated view for {currentMemberName} — PT mobility, pain trends & surgical milestones
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Activity} label="PT Sessions" value={stats.totalSessions} color="text-orange-600" bg="bg-orange-50" />
        <StatCard icon={HeartPulse} label="Recovery Logs" value={stats.totalRecoveryLogs} color="text-rose-600" bg="bg-rose-50" />
        <StatCard icon={Award} label="Milestones" value={stats.milestoneCount} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={Target} label="Avg Pain" value={`${stats.avgPain}/10`} color="text-amber-600" bg="bg-amber-50" />
      </div>

 {/* ROM Trend */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-orange-600" /> Range of Motion Trend
          </h3>
          <Select value={selectedBodyPart} onValueChange={setSelectedBodyPart}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(bodyPartLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {romTrend.length === 0 ? (
          <EmptyChart label="ROM data" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={romTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: "Degrees", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="exerciseROM" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="PT Exercise ROM (°)" connectNulls />
              <Line type="monotone" dataKey="surgicalROM" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} name="Surgical ROM Flexion (°)" connectNulls strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        )}
        {stats.romChange != null && (
          <p className="text-xs mt-2 text-center">
            <span className={stats.romChange >= 0 ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
              {stats.romChange >= 0 ? "↑" : "↓"} {Math.abs(stats.romChange)}° change
            </span>
            <span className="text-muted-foreground"> over 6 months for {bodyPartLabels[selectedBodyPart]}</span>
          </p>
        )}
      </Card>

      {/* Pain Trend */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
          <HeartPulse className="w-4 h-4 text-rose-600" /> Pain Level Trends
        </h3>
        {painTrend.length === 0 ? (
          <EmptyChart label="pain data" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={painTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} label={{ value: "Pain (0-10)", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="exercisePain" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="PT Exercise Pain" connectNulls />
              <Line type="monotone" dataKey="surgicalPain" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="Surgical Pain" connectNulls strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        )}
        {stats.painChange != null && (
          <p className="text-xs mt-2 text-center">
            <span className={stats.painChange <= 0 ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
              {stats.painChange <= 0 ? "↓" : "↑"} {Math.abs(stats.painChange)} point change
            </span>
            <span className="text-muted-foreground"> in pain over 6 months</span>
          </p>
        )}
      </Card>

      {/* Monthly Activity Volume */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
          <Calendar className="w-4 h-4 text-blue-600" /> Monthly Activity Volume
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={monthlyActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="sessions" fill="#f97316" radius={[4, 4, 0, 0]} name="Sessions" />
            <Area yAxisId="right" type="monotone" dataKey="totalMinutes" stroke="#0ea5e9" fill="#e0f2fe" name="Total Minutes" />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Milestones Timeline */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
          <Award className="w-4 h-4 text-emerald-600" /> Recovery Milestones
        </h3>
        {milestones.length === 0 ? (
          <div className="py-6 text-center">
            <Award className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No milestones recorded yet</p>
            <p className="text-xs text-muted-foreground">Log milestones in your surgical recovery tracker to see them here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {milestones.slice(0, 12).map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.milestone}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.surgery} · {format(parseISO(m.date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
      <p className={`text-xl font-display font-bold ${color}`}>{value}</p>
    </Card>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="py-8 text-center">
      <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
      <p className="text-xs text-muted-foreground">No {label} for the selected period</p>
    </div>
  );
}