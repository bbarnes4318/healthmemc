import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Activity, Heart, Droplets, Thermometer, Scale, Moon,
  Footprints, Plus, Loader2, TrendingUp, FlaskConical
} from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import moment from "moment";
import LabMarkerTrend from "@/components/health/LabMarkerTrend";
import DermatologyTrendChart from "@/components/health/DermatologyTrendChart";
import VisionTrendChart from "@/components/health/VisionTrendChart";
import { generateHealthDashboardPdf } from "@/lib/generateHealthDashboardPdf";
import MedicationAdherenceTrend from "@/components/pharmacy/MedicationAdherenceTrend";
import MedicationAdherenceMonthly from "@/components/pharmacy/MedicationAdherenceMonthly";
import MonthlyProgressReportButton from "@/components/health/MonthlyProgressReportButton";
import CriticalRecordsBanner from "@/components/records/CriticalRecordsBanner";
import TreatmentCorrelationAnalyzer from "@/components/health/TreatmentCorrelationAnalyzer";
import { Download } from "lucide-react";

const vitalTypes = [
  { value: "heart_rate", label: "Heart Rate", icon: Heart, unit: "bpm", color: "#ef4444", bg: "bg-red-50" },
  { value: "blood_pressure", label: "Blood Pressure", icon: Activity, unit: "mmHg", color: "#3b82f6", bg: "bg-blue-50" },
  { value: "oxygen_saturation", label: "Oxygen (SpO2)", icon: Droplets, unit: "%", color: "#06b6d4", bg: "bg-cyan-50" },
  { value: "blood_glucose", label: "Blood Glucose", icon: Droplets, unit: "mg/dL", color: "#8b5cf6", bg: "bg-violet-50" },
  { value: "weight", label: "Weight", icon: Scale, unit: "kg", color: "#f59e0b", bg: "bg-amber-50" },
  { value: "sleep_hours", label: "Sleep", icon: Moon, unit: "hrs", color: "#6366f1", bg: "bg-indigo-50" },
  { value: "activity_minutes", label: "Activity", icon: Footprints, unit: "min", color: "#22c55e", bg: "bg-green-50" },
  { value: "temperature", label: "Temperature", icon: Thermometer, unit: "°F", color: "#ec4899", bg: "bg-pink-50" },
];

export default function HealthDashboard() {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("heart_rate");
  const [form, setForm] = useState({ type: "heart_rate", value: "", secondary_value: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadVitals();
  }, []);

  const loadVitals = async () => {
    try {
      const data = await base44.entities.VitalRecord.list("-recorded_at", 200);
      setVitals(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.value) return;
    setSaving(true);
    try {
      const vitalType = vitalTypes.find((v) => v.value === form.type);
      await base44.entities.VitalRecord.create({
        type: form.type,
        value: parseFloat(form.value),
        secondary_value: form.secondary_value ? parseFloat(form.secondary_value) : undefined,
        unit: vitalType?.unit,
        recorded_at: new Date().toISOString(),
        notes: form.notes || undefined,
      });
      setForm({ type: "heart_rate", value: "", secondary_value: "", notes: "" });
      setDialogOpen(false);
      loadVitals();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const getLatestValue = (type) => {
    const record = vitals.find((v) => v.type === type);
    if (!record) return "—";
    if (type === "blood_pressure" && record.secondary_value) {
      return `${record.value}/${record.secondary_value}`;
    }
    return record.value;
  };

  const getChartData = (type) => {
    return vitals
      .filter((v) => v.type === type)
      .sort((a, b) => new Date(a.recorded_at || a.created_date) - new Date(b.recorded_at || b.created_date))
      .slice(-14)
      .map((v) => ({
        date: moment(v.recorded_at || v.created_date).format("MMM D"),
        value: v.value,
      }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  const selectedVitalType = vitalTypes.find((v) => v.value === selectedType);
  const chartData = getChartData(selectedType);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Health Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track and monitor your vitals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => generateHealthDashboardPdf(vitals)} title="Download PDF report">
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-sky-600 hover:bg-sky-700">
                <Plus className="w-4 h-4 mr-2" /> Log Vital
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Log Vital Sign</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vitalTypes.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={form.type === "blood_pressure" ? "Systolic" : "Value"}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
                {form.type === "blood_pressure" && (
                  <Input
                    type="number"
                    placeholder="Diastolic"
                    value={form.secondary_value}
                    onChange={(e) => setForm({ ...form, secondary_value: e.target.value })}
                  />
                )}
              </div>
              <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={handleSave} disabled={!form.value || saving} className="w-full bg-sky-600 hover:bg-sky-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vital Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {vitalTypes.map((vital) => {
          const latest = getLatestValue(vital.value);
          const isSelected = selectedType === vital.value;
          return (
            <motion.div key={vital.value} whileTap={{ scale: 0.98 }}>
              <Card
                className={`p-4 cursor-pointer transition-all ${isSelected ? "ring-2 ring-sky-500 shadow-md" : "hover:shadow-sm"}`}
                onClick={() => setSelectedType(vital.value)}
              >
                <div className={`w-9 h-9 rounded-lg ${vital.bg} flex items-center justify-center mb-2`}>
                  <vital.icon className="w-4 h-4" style={{ color: vital.color }} />
                </div>
                <p className="text-xs text-muted-foreground font-medium">{vital.label}</p>
                <p className="text-xl font-display font-bold mt-0.5" style={{ color: vital.color }}>
                  {latest}
                </p>
                <p className="text-xs text-muted-foreground">{vital.unit}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Chart */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: selectedVitalType?.color }} />
          <h3 className="font-display font-semibold">{selectedVitalType?.label} Trend</h3>
        </div>
        {chartData.length < 2 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Log at least 2 readings to see trends
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={selectedVitalType?.color}
                strokeWidth={2}
                dot={{ r: 4, fill: selectedVitalType?.color }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Critical Records Alert */}
      <CriticalRecordsBanner />

      {/* Monthly Progress Report Button */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Monthly Health Progress Report</h3>
        <MonthlyProgressReportButton variant="default" className="bg-orange-600 hover:bg-orange-700" />
      </div>

      {/* 30-Day Medication Adherence Bar Chart */}
      <MedicationAdherenceMonthly />

      {/* Medication Adherence Trend */}
      <MedicationAdherenceTrend />

      {/* Lab Marker Trends */}
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical className="w-4 h-4 text-sky-600" />
        <h3 className="font-display font-semibold text-sm">Lab Marker Trends</h3>
      </div>
      <LabMarkerTrend />

      {/* Specialty Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DermatologyTrendChart />
        <VisionTrendChart />
      </div>

      {/* Treatment Correlation Analyzer */}
      <TreatmentCorrelationAnalyzer />
    </div>
  );
}