import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, CalendarDays, Pill } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";

export default function MedicationAdherenceMonthly() {
  const { currentMemberId } = useFamilyMember();
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split("T")[0];
        const medFilter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
        const [meds, allLogs] = await Promise.all([
          base44.entities.Medication.filter(medFilter),
          base44.entities.MedicationLog.filter({}),
        ]);
        const filteredLogs = currentMemberId
          ? allLogs.filter((l) => l.family_member_id === currentMemberId && l.scheduled_date >= thirtyDaysAgo)
          : allLogs.filter((l) => l.scheduled_date >= thirtyDaysAgo);
        setMedications(meds);
        setLogs(filteredLogs);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    loadData();
  }, [currentMemberId]);

  const chartData = useMemo(() => {
    const dailyMeds = medications.length || 1;
    const range = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return range.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayLogs = logs.filter((l) => l.scheduled_date === dateStr);
      const taken = dayLogs.filter((l) => l.status === "taken").length;
      const missed = dayLogs.filter((l) => l.status === "missed").length;
      const skipped = dayLogs.filter((l) => l.status === "skipped").length;
      const scheduled = dailyMeds;
      const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
      return {
        date: format(date, "MMM d"),
        shortDate: format(date, "d"),
        taken,
        missed,
        skipped,
        scheduled,
        adherence: scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0,
        isToday,
      };
    });
  }, [logs, medications]);

  const monthlyStats = useMemo(() => {
    const totalTaken = chartData.reduce((s, d) => s + d.taken, 0);
    const totalMissed = chartData.reduce((s, d) => s + d.missed, 0);
    const totalSkipped = chartData.reduce((s, d) => s + d.skipped, 0);
    const totalScheduled = (medications.length || 1) * 30;
    const adherenceRate = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;
    const bestStreak = (() => {
      let max = 0, current = 0;
      chartData.forEach((d) => {
        if (d.adherence >= 80) { current++; max = Math.max(max, current); }
        else { current = 0; }
      });
      return max;
    })();
    return { totalTaken, totalMissed, totalSkipped, adherenceRate, bestStreak };
  }, [chartData, medications]);

  if (loading) {
    return <Card className="p-5"><div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-amber-600" /></div></Card>;
  }

  if (medications.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Pill className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No active medications. Add medications in your Profile to track adherence.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="font-semibold text-sm">30-Day Medication Adherence</h3>
            <p className="text-xs text-muted-foreground">Taken vs. scheduled doses — spot patterns in your routine</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${monthlyStats.adherenceRate >= 80 ? "text-green-600" : monthlyStats.adherenceRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
            {monthlyStats.adherenceRate}%
          </div>
          <p className="text-xs text-muted-foreground">adherence rate</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-600">{monthlyStats.totalTaken}</p>
          <p className="text-[10px] text-muted-foreground">Taken</p>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <p className="text-lg font-bold text-red-600">{monthlyStats.totalMissed}</p>
          <p className="text-[10px] text-muted-foreground">Missed</p>
        </div>
        <div className="text-center p-2 bg-gray-100 rounded-lg">
          <p className="text-lg font-bold text-gray-600">{monthlyStats.totalSkipped}</p>
          <p className="text-[10px] text-muted-foreground">Skipped</p>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <p className="text-lg font-bold text-amber-600">{monthlyStats.bestStreak}</p>
          <p className="text-[10px] text-muted-foreground">Day Streak (≥80%)</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="shortDate" tick={{ fontSize: 9 }} interval={1} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            labelFormatter={(label, payload) => {
              const item = payload?.[0]?.payload;
              return item ? item.date : label;
            }}
          />
          <Legend />
          <Bar dataKey="taken" name="Taken" fill="#22c55e" radius={[2, 2, 0, 0]} />
          <Bar dataKey="missed" name="Missed" fill="#ef4444" radius={[2, 2, 0, 0]} />
          <Bar dataKey="skipped" name="Skipped" fill="#9ca3af" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Pattern Insight */}
      {monthlyStats.totalMissed > 0 && (
        <div className="mt-3 p-3 bg-amber-50 rounded-lg flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            You missed <strong>{monthlyStats.totalMissed}</strong> dose{monthlyStats.totalMissed !== 1 ? "s" : ""} in the last 30 days.
            {monthlyStats.bestStreak > 0 && ` Your best streak was ${monthlyStats.bestStreak} consecutive days at 80%+ adherence.`}
            {" "}Review the chart above to identify which days of the week are most challenging.
          </p>
        </div>
      )}
    </Card>
  );
}