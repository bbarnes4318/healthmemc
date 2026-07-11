import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Calendar, Award, AlertTriangle, Pill } from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, parseISO } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const STATUS_COLORS = { taken: "#22c55e", missed: "#ef4444", skipped: "#f59e0b" };

export default function AdherenceAnalytics() {
  const { currentMemberId } = useFamilyMember();
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const medFilter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
      const [meds, allLogs] = await Promise.all([
        base44.entities.Medication.filter(medFilter),
        base44.entities.MedicationLog.filter({}),
      ]);
      const filteredLogs = currentMemberId ? allLogs.filter((l) => l.family_member_id === currentMemberId) : allLogs;
      setMedications(meds);
      setLogs(filteredLogs);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [currentMemberId]);

  // Monthly adherence: last 30 days grouped by day
  const monthlyData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayLogs = logs.filter((l) => l.scheduled_date === dateStr);
      const taken = dayLogs.filter((l) => l.status === "taken").length;
      const missed = dayLogs.filter((l) => l.status === "missed").length;
      const skipped = dayLogs.filter((l) => l.status === "skipped").length;
      const total = taken + missed;
      const rate = total > 0 ? Math.round((taken / total) * 100) : null;
      return { date: format(day, "MMM d"), taken, missed, skipped, rate, dateStr };
    });
  }, [logs]);

  // Monthly success score
  const monthlyScore = useMemo(() => {
    const totalTaken = monthlyData.reduce((s, d) => s + d.taken, 0);
    const totalExpected = monthlyData.reduce((s, d) => s + d.taken + d.missed, 0);
    return totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 0;
  }, [monthlyData]);

  // Per-medication adherence
  const perMedication = useMemo(() => {
    return medications.map((med) => {
      const medLogs = logs.filter((l) => l.medication_name === med.name);
      const taken = medLogs.filter((l) => l.status === "taken").length;
      const missed = medLogs.filter((l) => l.status === "missed").length;
      const total = taken + missed;
      const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
      return { name: med.name, dosage: med.dosage, taken, missed, total, rate };
    }).sort((a, b) => a.rate - b.rate);
  }, [medications, logs]);

  // Gap detection: consecutive missed days
  const gaps = useMemo(() => {
    const gapList = [];
    medications.forEach((med) => {
      const medLogs = logs
        .filter((l) => l.medication_name === med.name && l.status === "missed")
        .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
      if (medLogs.length === 0) return;
      let streakStart = medLogs[0].scheduled_date;
      let streakEnd = medLogs[0].scheduled_date;
      let streakCount = 1;
      for (let i = 1; i < medLogs.length; i++) {
        const prev = parseISO(medLogs[i - 1].scheduled_date);
        const curr = parseISO(medLogs[i].scheduled_date);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streakEnd = medLogs[i].scheduled_date;
          streakCount++;
        } else {
          if (streakCount >= 2) {
            gapList.push({ med: med.name, start: streakStart, end: streakEnd, count: streakCount });
          }
          streakStart = medLogs[i].scheduled_date;
          streakEnd = medLogs[i].scheduled_date;
          streakCount = 1;
        }
      }
      if (streakCount >= 2) {
        gapList.push({ med: med.name, start: streakStart, end: streakEnd, count: streakCount });
      }
    });
    return gapList.sort((a, b) => b.count - a.count);
  }, [medications, logs]);

  // Current month calendar data
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const today = new Date();

  const calendarData = useMemo(() => {
    return monthDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayLogs = logs.filter((l) => l.scheduled_date === dateStr);
      const taken = dayLogs.filter((l) => l.status === "taken").length;
      const missed = dayLogs.filter((l) => l.status === "missed").length;
      const isFuture = day > today;
      let status = "none";
      if (isFuture) status = "future";
      else if (taken > 0 && missed === 0) status = "perfect";
      else if (taken > 0 && missed > 0) status = "partial";
      else if (taken === 0 && missed > 0) status = "missed";
      else if (day <= today && medications.length > 0) status = "no-data";
      return { date: day, dateStr, status, taken, missed };
    });
  }, [logs, medications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
      </div>
    );
  }

  if (medications.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Pill className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No active medications to analyze.</p>
      </Card>
    );
  }

  const scoreColor = monthlyScore >= 80 ? "text-emerald-600" : monthlyScore >= 60 ? "text-amber-600" : "text-red-600";
  const scoreBg = monthlyScore >= 80 ? "bg-emerald-50 border-emerald-200" : monthlyScore >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <div className="space-y-4">
      {/* Monthly Success Score */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`p-5 border ${scoreBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                <Award className={`w-6 h-6 ${scoreColor}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">30-Day Adherence Score</p>
                <p className={`text-3xl font-bold ${scoreColor}`}>{monthlyScore}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {monthlyData.reduce((s, d) => s + d.taken, 0)} doses taken
              </p>
              <p className="text-xs text-muted-foreground">
                {monthlyData.reduce((s, d) => s + d.missed, 0)} doses missed
              </p>
              {monthlyScore >= 80 ? (
                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1 justify-end">
                  <TrendingUp className="w-3 h-3" /> Great consistency!
                </p>
              ) : monthlyScore < 60 ? (
                <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1 justify-end">
                  <TrendingDown className="w-3 h-3" /> Needs attention
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Daily Adherence Rate Line Chart */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-sm">Daily Adherence Rate — Last 30 Days</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
              formatter={(value, name) => [value != null ? `${value}%` : "—", "Adherence"]}
            />
            <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Goal 80%", fontSize: 9, fill: "#22c55e", position: "right" }} />
            <Line type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Per-Medication Adherence */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-4">Per-Medication Adherence</h3>
        <ResponsiveContainer width="100%" height={Math.max(150, perMedication.length * 40)}>
          <BarChart data={perMedication} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, "Adherence"]} />
            <ReferenceLine x={80} stroke="#22c55e" strokeDasharray="4 4" />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
              {perMedication.map((entry, i) => (
                <Cell key={i} fill={entry.rate >= 80 ? "#22c55e" : entry.rate >= 60 ? "#f59e0b" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Gap Detection */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-sm">Intake Gaps — Consecutive Missed Days</h3>
        </div>
        {gaps.length === 0 ? (
          <div className="py-6 text-center">
            <Award className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No multi-day gaps detected. Great job staying consistent!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {gaps.slice(0, 8).map((gap, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-red-50 rounded-lg border border-red-100">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                  <Pill className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{gap.med}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(gap.start), "MMM d")} — {format(parseISO(gap.end), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-red-600">{gap.count}</p>
                  <p className="text-[10px] text-muted-foreground">days missed</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Monthly Calendar Heatmap */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-sm">{format(new Date(), "MMMM yyyy")} — Daily Calendar</h3>
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {/* Pad start */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {calendarData.map((day) => {
            const bgClass = {
              perfect: "bg-emerald-500 text-white",
              partial: "bg-amber-400 text-white",
              missed: "bg-red-500 text-white",
              "no-data": "bg-muted text-muted-foreground",
              future: "bg-transparent text-muted-foreground/40",
              none: "bg-transparent text-muted-foreground",
            }[day.status];
            return (
              <div
                key={day.dateStr}
                className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-medium ${bgClass}`}
                title={day.taken > 0 || day.missed > 0 ? `${day.taken} taken, ${day.missed} missed` : ""}
              >
                {format(day.date, "d")}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-3 h-3 rounded bg-emerald-500" /> All taken
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-3 h-3 rounded bg-amber-400" /> Partial
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-3 h-3 rounded bg-red-500" /> Missed
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-3 h-3 rounded bg-muted" /> No data
          </span>
        </div>
      </Card>
    </div>
  );
}