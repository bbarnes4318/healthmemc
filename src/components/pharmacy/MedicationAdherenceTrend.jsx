import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, Pill, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, subDays, isSameDay, parseISO } from "date-fns";

export default function MedicationAdherenceTrend() {
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [meds, medLogs] = await Promise.all([
          base44.entities.Medication.filter({ active: true }),
          base44.entities.MedicationLog.filter({}),
        ]);
        setMedications(meds);
        setLogs(medLogs);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const chartData = useMemo(() => {
    const expectedPerDay = medications.length || 1;
    const days = Array.from({ length: 30 }).map((_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayLogs = logs.filter((l) => l.scheduled_date === dateStr);
      const taken = dayLogs.filter((l) => l.status === "taken").length;
      const missed = dayLogs.filter((l) => l.status === "missed").length;
      const isToday = isSameDay(date, new Date());
      const pending = isToday ? Math.max(0, expectedPerDay - taken - missed) : 0;
      const totalLogged = taken + missed;
      const rate = totalLogged > 0 ? Math.round((taken / totalLogged) * 100) : (isToday ? null : 0);
      return {
        date: format(date, "MMM d"),
        adherence: rate,
        taken,
        missed,
        pending,
        isToday,
      };
    });
    return days;
  }, [logs, medications]);

  const avgAdherence = useMemo(() => {
    const validDays = chartData.filter((d) => d.adherence !== null);
    if (validDays.length === 0) return 0;
    return Math.round(validDays.reduce((s, d) => s + d.adherence, 0) / validDays.length);
  }, [chartData]);

  const totalTaken = chartData.reduce((s, d) => s + d.taken, 0);
  const totalMissed = chartData.reduce((s, d) => s + d.missed, 0);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>
      </Card>
    );
  }

  if (medications.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-sm">30-Day Medication Adherence</h3>
        </div>
        <div className="text-center py-6">
          <Pill className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No active medications. Add medications in the Pharmacy section to track adherence.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600" /> 30-Day Medication Adherence
          </h3>
          <p className="text-[10px] text-muted-foreground">Daily adherence rate over the past month</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${avgAdherence >= 80 ? "text-emerald-600" : avgAdherence >= 50 ? "text-amber-600" : "text-red-600"}`}>
            {avgAdherence}%
          </p>
          <p className="text-[10px] text-muted-foreground">avg adherence</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 text-[10px]">
        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3 h-3" />{totalTaken} taken</span>
        <span className="text-red-500">{totalMissed} missed</span>
        <span className="text-muted-foreground">{medications.length} active med{medications.length !== 1 ? "s" : ""}</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} interval={4} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} unit="%" />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
            formatter={(v, name) => {
              if (v === null) return ["No data", name];
              if (name === "Adherence") return [`${v}%`, name];
              return [v, name];
            }}
          />
          <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Goal 80%", fontSize: 8, fill: "#22c55e", position: "right" }} />
          <Line
            type="monotone"
            dataKey="adherence"
            name="Adherence"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (cx === undefined || cy === undefined || payload.adherence === null) return <circle cx={cx} cy={cy} r={0} />;
              const color = payload.adherence >= 80 ? "#22c55e" : payload.adherence >= 50 ? "#f59e0b" : "#ef4444";
              return <circle key={`d-${payload.date}`} cx={cx} cy={cy} r={2.5} fill={color} />;
            }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5"><circle cx="3" cy="3" r="3" fill="#22c55e" /> On track (≥80%)</span>
        <span className="flex items-center gap-0.5"><circle cx="3" cy="3" r="3" fill="#f59e0b" /> At risk (50-79%)</span>
        <span className="flex items-center gap-0.5"><circle cx="3" cy="3" r="3" fill="#ef4444" /> Low (&lt;50%)</span>
      </div>
    </Card>
  );
}