import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart3, Calendar, TrendingUp, Stethoscope, AlertCircle, Clock, DollarSign, Activity, ChevronRight, Bone as Tooth } from "lucide-react";
import DentalPainTrendChart from "@/components/dental/DentalPainTrendChart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, isAfter, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const procedureLabels = {
  cleaning: "Cleaning", filling: "Filling", root_canal: "Root Canal",
  extraction: "Extraction", crown: "Crown", bridge: "Bridge",
  implant: "Implant", whitening: "Whitening", x_ray: "X-Ray",
  examination: "Examination", other: "Other",
};

const procedureColors = [
  "#06b6d4", "#0ea5e9", "#3b82f6", "#8b5cf6", "#ec4899",
  "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#94a3b8",
];

const severityScore = { mild: 1, moderate: 2, severe: 3 };
const severityLabels = { mild: "Mild", moderate: "Moderate", severe: "Severe" };
const severityColors = { mild: "#22c55e", moderate: "#eab308", severe: "#ef4444" };

export default function DentalDashboard() {
  const [visits, setVisits] = useState([]);
  const [painLogs, setPainLogs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [v, p, a] = await Promise.all([
          base44.entities.DentalVisitLog.list("-visit_date", 200),
          base44.entities.DentalPainLog.list("-created_date", 200),
          base44.entities.Appointment.filter({ status: "scheduled" }, "date", 50),
        ]);
        setVisits(v);
        setPainLogs(p);
        setAppointments(a);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const recentProcedures = useMemo(() => {
    return [...visits].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date)).slice(0, 5);
  }, [visits]);

  const upcomingCheckups = useMemo(() => {
    const now = new Date();
    const followUps = visits
      .filter((v) => v.follow_up_recommended && v.follow_up_date && isAfter(parseISO(v.follow_up_date), now))
      .map((v) => ({
        type: "follow_up",
        date: v.follow_up_date,
        title: `Follow-up: ${procedureLabels[v.procedure_type] || v.procedure_type || "Dental"}`,
        provider: v.dentist_name,
        notes: v.follow_up_notes,
      }));
    const dentalAppts = appointments
      .filter((a) => a.date && isAfter(parseISO(a.date), now) && (a.type === "checkup" || a.type === "specialist" || a.title?.toLowerCase().includes("dental") || a.title?.toLowerCase().includes("dentist")))
      .map((a) => ({
        type: "appointment",
        date: a.date,
        title: a.title,
        provider: a.provider,
        notes: a.notes,
      }));
    return [...followUps, ...dentalAppts].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [visits, appointments]);

  const painTrendData = useMemo(() => {
    if (painLogs.length === 0) return [];
    const sorted = [...painLogs].sort((a, b) => new Date(a.logged_at || a.created_date) - new Date(b.logged_at || b.created_date));
    return sorted.map((log) => ({
      date: format(new Date(log.logged_at || log.created_date), "MMM d"),
      score: severityScore[log.severity] || 1,
      severity: severityLabels[log.severity] || log.severity,
      teeth: log.pain_teeth?.length || 0,
    }));
  }, [painLogs]);

  const painSeverityBreakdown = useMemo(() => {
    const counts = { mild: 0, moderate: 0, severe: 0 };
    painLogs.forEach((p) => { counts[p.severity] = (counts[p.severity] || 0) + 1; });
    return Object.entries(counts).filter(([_, c]) => c > 0).map(([sev, count]) => ({ name: severityLabels[sev], count, fill: severityColors[sev] }));
  }, [painLogs]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (visits.length === 0 && painLogs.length === 0) {
    return (
      <Card className="p-12 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">No dental data yet</p>
        <p className="text-xs text-muted-foreground mt-1">Log visits and pain entries to see your centralized dental dashboard.</p>
      </Card>
    );
  }

  // Existing chart computations
  const procCounts = {};
  visits.forEach((v) => {
    const type = v.procedure_type || "other";
    procCounts[type] = (procCounts[type] || 0) + 1;
  });
  const procData = Object.entries(procCounts)
    .map(([key, count]) => ({ name: procedureLabels[key] || key, count }))
    .sort((a, b) => b.count - a.count);

  const monthCounts = {};
  visits.forEach((v) => {
    if (!v.visit_date) return;
    const month = format(new Date(v.visit_date), "MMM yyyy");
    const sortKey = new Date(v.visit_date).toISOString().slice(0, 7);
    if (!monthCounts[sortKey]) monthCounts[sortKey] = { label: month, count: 0, cost: 0 };
    monthCounts[sortKey].count++;
    if (v.cost) monthCounts[sortKey].cost += v.cost;
  });
  const timeData = Object.entries(monthCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, val]) => val);

  const totalCost = visits.reduce((sum, v) => sum + (v.cost || 0), 0);
  const pieData = procData.map((d, i) => ({ ...d, fill: procedureColors[i % procedureColors.length] }));
  const pendingFollowUps = visits.filter((v) => v.follow_up_recommended).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="w-4 h-4 text-cyan-600" />
            <span className="text-xs text-muted-foreground">Total Visits</span>
          </div>
          <p className="text-2xl font-bold">{visits.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Pain Entries</span>
          </div>
          <p className="text-2xl font-bold">{painLogs.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-cyan-600" />
            <span className="text-xs text-muted-foreground">Upcoming Checkups</span>
          </div>
          <p className="text-2xl font-bold">{upcomingCheckups.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Pending Follow-ups</span>
          </div>
          <p className="text-2xl font-bold">{pendingFollowUps}</p>
        </Card>
      </div>

      {/* Three-column centralized view: Recent Procedures | Pain Trends | Upcoming Checkups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Procedures */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-cyan-600" /> Recent Procedures
            </h3>
            <span className="text-[10px] text-muted-foreground">{visits.length} total</span>
          </div>
          {recentProcedures.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No visits logged</p>
          ) : (
            <div className="space-y-2">
              {recentProcedures.map((v, i) => (
                <motion.div key={v.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <div className="p-2.5 rounded-lg border bg-card hover:shadow-sm transition">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                        <Tooth className="w-3.5 h-3.5 text-cyan-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{v.dentist_name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <Badge variant="outline" className="text-[9px] bg-cyan-50 text-cyan-700 border-cyan-200">{procedureLabels[v.procedure_type] || v.procedure_type}</Badge>
                          <span className="text-[9px] text-muted-foreground">{format(new Date(v.visit_date), "MMM d, yyyy")}</span>
                        </div>
                        {v.tooth_numbers?.length > 0 && (
                          <p className="text-[9px] text-muted-foreground mt-0.5">Teeth: {v.tooth_numbers.map((n) => `#${n}`).join(", ")}</p>
                        )}
                        {v.follow_up_recommended && (
                          <p className="text-[9px] text-amber-600 font-medium mt-0.5 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> Follow-up{v.follow_up_date ? ` ${format(new Date(v.follow_up_date), "MMM d")}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Pain Level Trends */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" /> Pain Level Trends
            </h3>
            <span className="text-[10px] text-muted-foreground">{painLogs.length} entries</span>
          </div>
          {painLogs.length === 0 ? (
            <div className="py-6 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">No pain entries logged</p>
            </div>
          ) : (
            <>
              {painTrendData.length >= 2 && (
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={painTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                    <XAxis dataKey="date" tick={{ fontSize: 8 }} interval="preserveStartEnd" />
                    <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tick={{ fontSize: 8 }} tickFormatter={(v) => severityLabels[Object.keys(severityScore).find((k) => severityScore[k] === v)] || ""} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} formatter={(v, n, p) => [p.payload.severity, "Pain Level"]} />
                    <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: "#ef4444" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {painSeverityBreakdown.length > 0 && (
                <div className="mt-3">
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie data={painSeverityBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={35} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 8 }}>
                        {painSeverityBreakdown.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flex items-center justify-center gap-3 mt-1">
                {painSeverityBreakdown.map((s) => (
                  <div key={s.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fill }} />
                    <span className="text-[9px] text-muted-foreground">{s.name}: {s.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Upcoming Checkups */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600" /> Upcoming Checkups
            </h3>
            <Link to="/appointment-history" className="text-[10px] text-sky-600 hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-2.5 h-2.5" />
            </Link>
          </div>
          {upcomingCheckups.length === 0 ? (
            <div className="py-6 text-center">
              <Calendar className="w-8 h-8 text-muted-foreground/20 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">No upcoming checkups</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Schedule follow-ups from visit logs</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingCheckups.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <div className={`p-2.5 rounded-lg border ${c.type === "follow_up" ? "border-amber-200 bg-amber-50" : "border-sky-200 bg-sky-50"}`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.type === "follow_up" ? "bg-amber-100" : "bg-sky-100"}`}>
                        {c.type === "follow_up" ? <Clock className="w-3.5 h-3.5 text-amber-600" /> : <Calendar className="w-3.5 h-3.5 text-sky-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{c.title}</p>
                        <p className="text-[9px] text-muted-foreground">{format(parseISO(c.date), "MMM d, yyyy")}</p>
                        {c.provider && <p className="text-[9px] text-muted-foreground">{c.provider}</p>}
                        {c.notes && <p className="text-[9px] text-muted-foreground mt-0.5 italic">{c.notes}</p>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 3-Month Pain Intensity & Frequency Trend */}
      <DentalPainTrendChart painLogs={painLogs} />

      {/* Procedure frequency bar chart */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4">Procedure Type Frequency</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={procData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visits over time */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Visits Over Time</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Procedure type pie chart */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Procedure Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 9 }}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Cost over time */}
      {totalCost > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Dental Spending Over Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
              <Bar dataKey="cost" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}