import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Activity, TrendingDown, Wind, CheckCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const breathLabels = { 1: "Fresh", 2: "Slight", 3: "Noticeable", 4: "Bad", 5: "Severe" };
const breathColors = { 1: "#22c55e", 2: "#84cc16", 3: "#fbbf24", 4: "#f97316", 5: "#ef4444" };

const hygieneItems = [
  { key: "brushed_morning", label: "Brush AM", icon: "🌅" },
  { key: "brushed_evening", label: "Brush PM", icon: "🌙" },
  { key: "flossed", label: "Floss", icon: "🧵" },
  { key: "mouthwash", label: "Mouthwash", icon: "🫧" },
  { key: "tongue_cleaned", label: "Tongue", icon: "👅" },
];

export default function OralCareChart() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");

  const [form, setForm] = useState({
    date: today,
    bad_breath_severity: 1,
    brushed_morning: false,
    brushed_evening: false,
    flossed: false,
    mouthwash: false,
    tongue_cleaned: false,
    notes: "",
  });

  const load = async () => {
    try {
      const data = await base44.entities.OralCareLog.list("-date", 60);
      setLogs(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const todayLog = logs.find((l) => l.date === today);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (todayLog) {
        await base44.entities.OralCareLog.update(todayLog.id, {
          bad_breath_severity: form.bad_breath_severity,
          brushed_morning: form.brushed_morning,
          brushed_evening: form.brushed_evening,
          flossed: form.flossed,
          mouthwash: form.mouthwash,
          tongue_cleaned: form.tongue_cleaned,
          notes: form.notes || undefined,
        });
      } else {
        await base44.entities.OralCareLog.create({
          ...form,
          notes: form.notes || undefined,
        });
      }
      load();
      toast({ title: "Oral care logged", description: "Your daily oral care has been saved." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  // Prefill form if today's log exists
  useEffect(() => {
    if (todayLog) {
      setForm({
        date: today,
        bad_breath_severity: todayLog.bad_breath_severity || 1,
        brushed_morning: todayLog.brushed_morning || false,
        brushed_evening: todayLog.brushed_evening || false,
        flossed: todayLog.flossed || false,
        mouthwash: todayLog.mouthwash || false,
        tongue_cleaned: todayLog.tongue_cleaned || false,
        notes: todayLog.notes || "",
      });
    }
  }, [todayLog]);

  const chartData = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const log = logs.find((l) => l.date === dateStr);
      const hygieneScore = log
        ? hygieneItems.filter((h) => log[h.key]).length
        : null;
      return {
        date: format(date, "MMM d"),
        breath: log?.bad_breath_severity ?? null,
        hygiene: hygieneScore,
      };
    });
  }, [logs]);

  const avgBreath = useMemo(() => {
    const valid = chartData.filter((d) => d.breath !== null);
    if (valid.length === 0) return null;
    return (valid.reduce((s, d) => s + d.breath, 0) / valid.length).toFixed(1);
  }, [chartData]);

  const hygieneCompliance = useMemo(() => {
    const valid = chartData.filter((d) => d.hygiene !== null);
    if (valid.length === 0) return 0;
    const totalPossible = valid.length * hygieneItems.length;
    const totalDone = valid.reduce((s, d) => s + d.hygiene, 0);
    return Math.round((totalDone / totalPossible) * 100);
  }, [chartData]);

  if (loading) {
    return <Card className="p-5"><div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-600" /></div></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Daily Logging Form */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wind className="w-4 h-4 text-cyan-600" />
          <h3 className="text-sm font-semibold">Daily Oral Care Tracker</h3>
          <span className="text-xs text-muted-foreground ml-auto">{format(new Date(), "EEEE, MMM d")}</span>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Bad Breath Severity</Label>
            <div className="flex gap-2 mt-1.5">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => setForm({ ...form, bad_breath_severity: val })}
                  className={`flex-1 p-2 rounded-lg border-2 text-xs font-medium transition ${
                    form.bad_breath_severity === val ? "border-current text-white" : "border-border text-muted-foreground"
                  }`}
                  style={form.bad_breath_severity === val ? { background: breathColors[val], color: "white", borderColor: breathColors[val] } : {}}
                >
                  {val}
                  <span className="block text-[9px] mt-0.5">{breathLabels[val]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Hygiene Activities</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {hygieneItems.map((h) => (
                <button
                  key={h.key}
                  onClick={() => setForm({ ...form, [h.key]: !form[h.key] })}
                  className={`px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition flex items-center gap-1 ${
                    form[h.key] ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground"
                  }`}
                >
                  <span>{h.icon}</span> {h.label}
                  {form[h.key] && <CheckCircle className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          <Textarea placeholder="Notes (e.g., foods that affected breath, mouth sores...)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none text-xs" />

          <Button onClick={handleSave} disabled={saving} className="w-full bg-cyan-600 hover:bg-cyan-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
            {todayLog ? "Update Today's Log" : "Save Today's Log"}
          </Button>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-cyan-600" />
            <p className="text-[10px] text-muted-foreground font-medium">Avg Breath Severity</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: avgBreath ? breathColors[Math.round(parseFloat(avgBreath))] : "#94a3b8" }}>
            {avgBreath ?? "—"}
          </p>
          <p className="text-[9px] text-muted-foreground">Lower is better · 30-day avg</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-[10px] text-muted-foreground font-medium">Hygiene Compliance</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{hygieneCompliance}%</p>
          <p className="text-[9px] text-muted-foreground">Daily activities completed</p>
        </Card>
      </div>

      {/* Breath Severity Trend */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-1">Bad Breath Severity — 30 Day Trend</h3>
        <p className="text-[10px] text-muted-foreground mb-3">Track how your breath quality changes over time</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} interval={5} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={(v, name) => {
                if (v === null) return ["No data", name];
                if (name === "Breath Severity") return [`${v} — ${breathLabels[v]}`, name];
                return [v, name];
              }}
            />
            <Line type="monotone" dataKey="breath" name="Breath Severity" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3, fill: "#06b6d4" }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Hygiene Activity Chart */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-1">Daily Hygiene Activities</h3>
        <p className="text-[10px] text-muted-foreground mb-3">Number of oral care activities completed each day</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} interval={5} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [v ? `${v}/5 activities` : "No data", "Hygiene"]} />
            <Bar dataKey="hygiene" name="Hygiene" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.hygiene === null ? "#e2e8f0" : entry.hygiene >= 4 ? "#22c55e" : entry.hygiene >= 2 ? "#fbbf24" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /> Excellent (4-5)</span>
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-amber-400" /> Fair (2-3)</span>
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-red-500" /> Poor (0-1)</span>
        </div>
      </Card>

      {/* Insight */}
      {avgBreath && hygieneCompliance > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-4 border-cyan-200 bg-cyan-50">
            <div className="flex items-start gap-2">
              <TrendingDown className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-cyan-800">Oral Health Insight</p>
                <p className="text-[10px] text-cyan-700 mt-0.5">
                  {parseFloat(avgBreath) <= 2 && hygieneCompliance >= 70
                    ? "Great job! Your breath quality is good and your hygiene routine is consistent. Keep it up!"
                    : parseFloat(avgBreath) <= 3 && hygieneCompliance >= 50
                    ? "You're on the right track. Try to be more consistent with flossing and tongue cleaning for better results."
                    : "Your breath severity is elevated. Focus on completing all 5 hygiene activities daily, especially tongue cleaning and flossing, which directly impact breath quality."}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}