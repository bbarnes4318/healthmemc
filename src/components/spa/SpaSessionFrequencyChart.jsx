import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, BarChart3, TrendingDown } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { subWeeks, startOfWeek, endOfWeek, isWithinInterval, parseISO, subDays } from "date-fns";

export default function SpaSessionFrequencyChart() {
  const [sessions, setSessions] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, j] = await Promise.all([
          base44.entities.SpaWellnessSession.list("-session_date", 200),
          base44.entities.WellnessJournal.list("-date", 30),
        ]);
        setSessions(s);
        setJournals(j);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const chartData = useMemo(() => {
    const now = new Date();
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i));
      const weekEnd = endOfWeek(subWeeks(now, i));
      const interval = { start: weekStart, end: weekEnd };

      const weekSessions = sessions.filter((s) => {
        if (!s.session_date) return false;
        return isWithinInterval(new Date(s.session_date), interval);
      });

      const weekJournals = journals.filter((j) => {
        if (!j.date) return false;
        return isWithinInterval(parseISO(j.date), interval);
      });

      const avgStress = weekJournals.length > 0
        ? weekJournals.reduce((sum, j) => sum + (j.stress_score || 3), 0) / weekJournals.length
        : null;
      const sleepEntries = weekJournals.filter((j) => j.sleep_hours != null);
      const sleepAvg = sleepEntries.length > 0
        ? sleepEntries.reduce((sum, j) => sum + j.sleep_hours, 0) / sleepEntries.length
        : null;

      const weekLabel = i === 0 ? "This week" : i === 1 ? "Last week" : `${i} wks ago`;
      weeks.push({
        week: weekLabel,
        sessions: weekSessions.length,
        stress: avgStress !== null ? Number(avgStress.toFixed(1)) : null,
        sleep: sleepAvg !== null ? Number(sleepAvg.toFixed(1)) : null,
      });
    }
    return weeks;
  }, [sessions, journals]);

  const totalSessions = chartData.reduce((s, d) => s + d.sessions, 0);
  const weeksWithSessions = chartData.filter((d) => d.sessions > 0).length;

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
      </Card>
    );
  }

  if (totalSessions === 0 && journals.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-600" /> Session Frequency vs Wellness Trends
          </h3>
          <p className="text-[10px] text-muted-foreground">Weekly relaxation sessions compared to stress & sleep over the last month</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-purple-600">{totalSessions}</p>
          <p className="text-[10px] text-muted-foreground">sessions / 4 wks</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis yAxisId="left" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Sessions", angle: -90, position: "insideLeft", style: { fontSize: 9, fill: "hsl(var(--muted-foreground))" } }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Score", angle: 90, position: "insideRight", style: { fontSize: 9, fill: "hsl(var(--muted-foreground))" } }} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v, name) => {
            if (v === null) return ["—", name];
            if (name === "Sessions") return [v, name];
            if (name === "Avg Stress") return [v, name];
            if (name === "Avg Sleep (h)") return [`${v}h`, name];
            return [v, name];
          }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar yAxisId="left" dataKey="sessions" name="Sessions" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
          <Line yAxisId="right" type="monotone" dataKey="stress" name="Avg Stress" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line yAxisId="right" type="monotone" dataKey="sleep" name="Avg Sleep (h)" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-purple-500" /> Spa sessions</span>
        <span className="flex items-center gap-1"><div className="w-2.5 h-0.5 bg-blue-500" /> Stress (lower = better)</span>
        <span className="flex items-center gap-1"><div className="w-2.5 h-0.5 bg-indigo-500 border-t border-dashed" /> Sleep hours</span>
      </div>
      {weeksWithSessions > 0 && (
        <div className="mt-2 flex items-center gap-1.5 p-2 bg-purple-50 rounded-lg">
          <TrendingDown className="w-3 h-3 text-purple-600" />
          <p className="text-[10px] text-purple-700">
            {totalSessions} sessions logged across {weeksWithSessions} week{weeksWithSessions > 1 ? "s" : ""}. Compare stress levels on weeks with more sessions to see your wellness impact.
          </p>
        </div>
      )}
    </Card>
  );
}