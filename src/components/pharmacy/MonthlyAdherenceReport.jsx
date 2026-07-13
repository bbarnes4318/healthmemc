import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  Loader2, FileDown, Calendar, TrendingUp, CheckCircle, XCircle, MinusCircle, Pill
} from "lucide-react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO, subMonths } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { generateMonthlyAdherencePdf } from "@/lib/generateMonthlyAdherencePdf";

export default function MonthlyAdherenceReport() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  // Build last 12 months options
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const d = subMonths(new Date(), i);
      return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const medFilter = currentMemberId ? { family_member_id: currentMemberId } : {};
        const [meds, profiles, me] = await Promise.all([
          base44.entities.Medication.filter(medFilter),
          base44.entities.HealthProfile.filter(medFilter).then((r) => r[0] || null),
          base44.auth.me().catch(() => null),
        ]);
        setMedications(meds);
        setProfile(profiles);
        setUser(me);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  // Load logs for selected month
  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const [year, month] = selectedMonth.split("-").map(Number);
        const start = startOfMonth(new Date(year, month - 1));
        const end = endOfMonth(new Date(year, month - 1));
        const startDateStr = format(start, "yyyy-MM-dd");
        const endDateStr = format(end, "yyyy-MM-dd");

        const memberFilter = currentMemberId ? { family_member_id: currentMemberId } : {};
        const allLogs = await base44.entities.MedicationLog.filter(memberFilter, "-scheduled_date", 500);
        const monthLogs = allLogs.filter((l) => {
          if (!l.scheduled_date) return false;
          return l.scheduled_date >= startDateStr && l.scheduled_date <= endDateStr;
        });
        setLogs(monthLogs);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadLogs();
  }, [selectedMonth, currentMemberId]);

  const stats = useMemo(() => {
    const byStatus = { taken: 0, missed: 0, skipped: 0 };
    const byMed = {};
    logs.forEach((log) => {
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;
      const name = log.medication_name || "Unknown";
      if (!byMed[name]) byMed[name] = { taken: 0, missed: 0, skipped: 0, total: 0 };
      byMed[name][log.status] = (byMed[name][log.status] || 0) + 1;
      byMed[name].total++;
    });
    const total = logs.length;
    const rate = total > 0 ? ((byStatus.taken / total) * 100) : 0;
    return { ...byStatus, total, rate, byMed };
  }, [logs]);

  const dailyBreakdown = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const days = eachDayOfInterval({ start, end });
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayLogs = logs.filter((l) => l.scheduled_date === dateStr);
      const taken = dayLogs.filter((l) => l.status === "taken").length;
      const missed = dayLogs.filter((l) => l.status === "missed").length;
      const skipped = dayLogs.filter((l) => l.status === "skipped").length;
      const total = dayLogs.length;
      const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
      return { date: format(day, "MMM d"), dateStr, taken, missed, skipped, total, rate };
    });
  }, [logs, selectedMonth]);

  const chartData = useMemo(() => {
    return dailyBreakdown.filter((d) => d.total > 0).map((d) => ({
      day: d.date,
      Taken: d.taken,
      Missed: d.missed,
      Skipped: d.skipped,
    }));
  }, [dailyBreakdown]);

  // Merge medication details with stats
  const medSummary = useMemo(() => {
    return medications.map((med) => {
      const s = stats.byMed[med.name] || { taken: 0, missed: 0, skipped: 0, total: 0 };
      const rate = s.total > 0 ? Math.round((s.taken / s.total) * 100) : 0;
      return { ...med, ...s, rate };
    }).sort((a, b) => b.missed - a.missed);
  }, [medications, stats]);

  const monthLabel = monthOptions.find((m) => m.value === selectedMonth)?.label || "";

  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      generateMonthlyAdherencePdf({
        user,
        profile,
        monthLabel,
        medications: medSummary,
        logs,
        stats,
        dailyBreakdown,
      });
      toast({ title: "Report generated", description: "Your monthly adherence report has been downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate report", variant: "destructive" });
    }
    setGenerating(false);
  };

  if (loading && logs.length === 0) {
    return (
      <Card className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </Card>
    );
  }

  const rateColor = stats.rate >= 80 ? "text-emerald-600" : stats.rate >= 50 ? "text-amber-600" : "text-red-600";
  const rateBg = stats.rate >= 80 ? "bg-emerald-50 border-emerald-200" : stats.rate >= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <div className="space-y-4">
      {/* Header & controls */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Monthly Adherence Report</h3>
              <p className="text-xs text-muted-foreground">Taken vs missed doses — printable for your doctor visit</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleGeneratePdf} disabled={generating || logs.length === 0} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
              {generating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 mr-1.5" />}
              Print Report
            </Button>
          </div>
        </div>

        {/* Overall stats */}
        <div className={`rounded-xl border p-4 ${rateBg}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">{monthLabel}</p>
              <p className={`text-3xl font-display font-bold ${rateColor}`}>{stats.rate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">overall adherence rate</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Taken</p>
                <p className="text-xl font-bold text-emerald-600">{stats.taken}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Missed</p>
                <p className="text-xl font-bold text-red-600">{stats.missed}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Skipped</p>
                <p className="text-xl font-bold text-muted-foreground">{stats.skipped}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Daily chart */}
      {chartData.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-semibold">Daily Breakdown</h4>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Taken" stackId="a" fill="#22c55e" name="Taken" />
              <Bar dataKey="Missed" stackId="a" fill="#ef4444" name="Missed" />
              <Bar dataKey="Skipped" stackId="a" fill="#d1d5db" name="Skipped" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Per-medication breakdown */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Pill className="w-4 h-4 text-emerald-600" />
          <h4 className="text-sm font-semibold">Per-Medication Breakdown</h4>
        </div>
        {medSummary.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No medications found for this period.</p>
        ) : (
          <div className="space-y-2">
            {medSummary.map((med) => (
              <div key={med.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{med.name}</p>
                  <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-3 h-3" /> {med.taken}
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-3 h-3" /> {med.missed}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MinusCircle className="w-3 h-3" /> {med.skipped}
                  </span>
                  <Badge className={`${med.rate >= 80 ? "bg-emerald-100 text-emerald-700" : med.rate >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"} text-[10px]`}>
                    {med.rate}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {logs.length === 0 && (
        <Card className="p-6 text-center">
          <Pill className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No medication logs for {monthLabel}.</p>
          <p className="text-xs text-muted-foreground mt-1">Track your daily doses in the Adherence tab to build your report.</p>
        </Card>
      )}
    </div>
  );
}