import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, Plus, Trash2, TrendingUp, Ruler, Weight, Baby, Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine
} from "recharts";
import { format, parseISO } from "date-fns";

export default function BabyGrowthChart() {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    baby_name: "",
    measurement_date: new Date().toISOString().split("T")[0],
    age_weeks: "",
    age_months: "",
    height_cm: "",
    weight_kg: "",
    head_circumference_cm: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.BabyGrowthLog.list("measurement_date", 200);
      setLogs(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.measurement_date) {
      toast({ title: "Measurement date is required", variant: "destructive" });
      return;
    }
    if (!form.height_cm && !form.weight_kg && !form.head_circumference_cm) {
      toast({ title: "Enter at least one measurement", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.BabyGrowthLog.create({
        ...form,
        age_weeks: form.age_weeks ? Number(form.age_weeks) : null,
        age_months: form.age_months ? Number(form.age_months) : null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        head_circumference_cm: form.head_circumference_cm ? Number(form.head_circumference_cm) : null,
      });
      toast({ title: "Growth measurement logged!" });
      setForm({ baby_name: form.baby_name, measurement_date: new Date().toISOString().split("T")[0], age_weeks: "", age_months: "", height_cm: "", weight_kg: "", head_circumference_cm: "", notes: "" });
      setShowForm(false);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save measurement", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.BabyGrowthLog.delete(id);
      toast({ title: "Measurement removed" });
      load();
    } catch (e) { console.error(e); }
  };

  const chartData = [...logs]
    .sort((a, b) => new Date(a.measurement_date) - new Date(b.measurement_date))
    .map((l) => ({
      date: format(parseISO(l.measurement_date), "MMM d"),
      fullDate: l.measurement_date,
      height_cm: l.height_cm,
      weight_kg: l.weight_kg,
      head_circumference_cm: l.head_circumference_cm,
      age: l.age_months ? `${l.age_months}mo` : l.age_weeks ? `${l.age_weeks}w` : "",
    }));

  const latest = logs.length > 0
    ? [...logs].sort((a, b) => new Date(b.measurement_date) - new Date(a.measurement_date))[0]
    : null;

  const hasHeight = chartData.some((d) => d.height_cm != null);
  const hasWeight = chartData.some((d) => d.weight_kg != null);
  const hasHead = chartData.some((d) => d.head_circumference_cm != null);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Growth Tracker</h3>
            <p className="text-xs text-muted-foreground">Height, weight & head circumference over time</p>
          </div>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Log Measurement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Baby className="w-4 h-4 text-emerald-600" /> Log Growth Measurement
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Date *</label>
                  <Input type="date" value={form.measurement_date} onChange={(e) => setForm({ ...form, measurement_date: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Baby Name</label>
                  <Input placeholder="Baby's name" value={form.baby_name} onChange={(e) => setForm({ ...form, baby_name: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Age (weeks)</label>
                  <Input type="number" step="0.5" placeholder="e.g. 16" value={form.age_weeks} onChange={(e) => setForm({ ...form, age_weeks: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Age (months)</label>
                  <Input type="number" step="0.5" placeholder="e.g. 4" value={form.age_months} onChange={(e) => setForm({ ...form, age_months: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Height (cm)</label>
                  <Input type="number" step="0.1" placeholder="54.5" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Weight (kg)</label>
                  <Input type="number" step="0.01" placeholder="4.2" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Head (cm)</label>
                  <Input type="number" step="0.1" placeholder="36" value={form.head_circumference_cm} onChange={(e) => setForm({ ...form, head_circumference_cm: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Notes</label>
                <Input placeholder="e.g. Pediatrician visit" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-9 text-sm" />
              </div>
              <Button onClick={handleAdd} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Measurement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Latest stats */}
      {latest && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2.5 rounded-lg bg-sky-50 text-center">
            <Ruler className="w-4 h-4 text-sky-600 mx-auto mb-1" />
            <p className="text-sm font-bold">{latest.height_cm ? `${latest.height_cm} cm` : "—"}</p>
            <p className="text-[9px] text-muted-foreground">Height</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-center">
            <Weight className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-sm font-bold">{latest.weight_kg ? `${latest.weight_kg} kg` : "—"}</p>
            <p className="text-[9px] text-muted-foreground">Weight</p>
          </div>
          <div className="p-2.5 rounded-lg bg-violet-50 text-center">
            <Baby className="w-4 h-4 text-violet-600 mx-auto mb-1" />
            <p className="text-sm font-bold">{latest.head_circumference_cm ? `${latest.head_circumference_cm} cm` : "—"}</p>
            <p className="text-[9px] text-muted-foreground">Head Circ.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
      ) : chartData.length === 0 ? (
        <div className="text-center py-8">
          <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No measurements yet</p>
          <p className="text-xs text-muted-foreground mt-1">Log height and weight to see growth trends over time.</p>
        </div>
      ) : chartData.length === 1 ? (
        <div className="text-center py-6 text-xs text-muted-foreground">
          Log at least 2 measurements to see the growth trend chart.
        </div>
      ) : (
        <div className="space-y-4">
          {hasHeight && hasWeight && (
            <div>
              <p className="text-xs font-medium mb-2 text-muted-foreground">Height & Weight Trend</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="height_cm" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Height (cm)" connectNulls />
                  <Line yAxisId="right" type="monotone" dataKey="weight_kg" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Weight (kg)" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {hasHead && (
            <div>
              <p className="text-xs font-medium mb-2 text-muted-foreground">Head Circumference</p>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="head_circumference_cm" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Head (cm)" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Measurement history */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">Measurement History</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {[...logs].sort((a, b) => new Date(b.measurement_date) - new Date(a.measurement_date)).map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 text-xs">
                  <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="font-medium shrink-0 w-20">{l.measurement_date}</span>
                  {l.height_cm && <span className="text-sky-600">{l.height_cm}cm</span>}
                  {l.weight_kg && <span className="text-emerald-600">{l.weight_kg}kg</span>}
                  {l.head_circumference_cm && <span className="text-violet-600">{l.head_circumference_cm}cm</span>}
                  {l.age_months && <span className="text-muted-foreground">{l.age_months}mo</span>}
                  {l.notes && <span className="text-muted-foreground italic truncate flex-1">{l.notes}</span>}
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => handleDelete(l.id)}>
                    <Trash2 className="w-2.5 h-2.5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}