import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  Heart, Activity, Droplets, Scale, Moon, Thermometer,
  Footprints, Loader2, Bell, Save, AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";

const vitalTypes = [
  { value: "heart_rate", label: "Heart Rate", icon: Heart, unit: "bpm", color: "text-rose-600", bg: "bg-rose-50", defaultLow: 50, defaultHigh: 120, desc: "Normal: 60–100 bpm" },
  { value: "blood_pressure", label: "Blood Pressure", icon: Activity, unit: "mmHg", color: "text-sky-600", bg: "bg-sky-50", defaultLow: 90, defaultHigh: 140, desc: "Systolic · Normal: 90–120" },
  { value: "oxygen_saturation", label: "Oxygen (SpO2)", icon: Droplets, unit: "%", color: "text-cyan-600", bg: "bg-cyan-50", defaultLow: 92, defaultHigh: null, desc: "Normal: 95–100%" },
  { value: "blood_glucose", label: "Blood Glucose", icon: Droplets, unit: "mg/dL", color: "text-violet-600", bg: "bg-violet-50", defaultLow: 60, defaultHigh: 180, desc: "Normal: 70–140 mg/dL" },
  { value: "weight", label: "Weight", icon: Scale, unit: "kg", color: "text-indigo-600", bg: "bg-indigo-50", defaultLow: null, defaultHigh: null, desc: "Set your own range" },
  { value: "sleep_hours", label: "Sleep", icon: Moon, unit: "hrs", color: "text-blue-600", bg: "bg-blue-50", defaultLow: 5, defaultHigh: null, desc: "Recommended: 7–9 hrs" },
  { value: "temperature", label: "Temperature", icon: Thermometer, unit: "°F", color: "text-pink-600", bg: "bg-pink-50", defaultLow: 95, defaultHigh: 100.4, desc: "Normal: 97–99.5°F" },
  { value: "activity_minutes", label: "Activity", icon: Footprints, unit: "min", color: "text-emerald-600", bg: "bg-emerald-50", defaultLow: null, defaultHigh: null, desc: "Set your own range" },
];

export default function VitalThresholdSettings() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [thresholds, setThresholds] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
        const existing = await base44.entities.VitalThreshold.filter(filter);

        const map = {};
        for (const vt of vitalTypes) {
          const found = existing.find((e) => e.vital_type === vt.value);
          map[vt.value] = found || {
            vital_type: vt.value,
            low_threshold: vt.defaultLow,
            high_threshold: vt.defaultHigh,
            enabled: false,
          };
        }
        setThresholds(map);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  const handleChange = (vitalType, field, value) => {
    setThresholds((prev) => ({
      ...prev,
      [vitalType]: {
        ...prev[vitalType],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const vt of vitalTypes) {
        const t = thresholds[vt.value];
        const payload = {
          vital_type: vt.value,
          low_threshold: t.low_threshold === "" ? null : t.low_threshold ? Number(t.low_threshold) : null,
          high_threshold: t.high_threshold === "" ? null : t.high_threshold ? Number(t.high_threshold) : null,
          enabled: t.enabled,
          family_member_id: currentMemberId || null,
        };

        if (t.id) {
          await base44.entities.VitalThreshold.update(t.id, payload);
        } else {
          await base44.entities.VitalThreshold.create(payload);
        }
      }
      toast({ title: "Threshold settings saved", description: "You'll receive email alerts when vitals breach your limits." });
    } catch (e) {
      toast({ title: "Error saving settings", variant: "destructive" });
      console.error(e);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  const enabledCount = Object.values(thresholds).filter((t) => t.enabled).length;

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold">Vital Sign Alerts</h1>
            <p className="text-sm text-muted-foreground">Set thresholds & get notified · {currentMemberName}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-sky-600 hover:bg-sky-700">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-2 p-4 bg-sky-50 rounded-xl border border-sky-200">
        <AlertTriangle className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
        <p className="text-xs text-sky-800">
          Enable alerts for any vital sign and set your high/low thresholds. The system checks every 2 hours and emails you when a reading crosses your limits. You'll receive at most one alert per vital type per day.
        </p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
          <Bell className="w-4 h-4 text-sky-600" />
          <span className="text-sm font-medium">{enabledCount} alert{enabledCount !== 1 ? "s" : ""} active</span>
        </div>
      </div>

      {/* Threshold Cards */}
      <div className="space-y-3">
        {vitalTypes.map((vt, i) => {
          const t = thresholds[vt.value];
          const Icon = vt.icon;
          return (
            <motion.div key={vt.value} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>
              <Card className={`p-4 transition-opacity ${t.enabled ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-4">
                  {/* Icon + Label */}
                  <div className={`w-10 h-10 rounded-xl ${vt.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${vt.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{vt.label}</h3>
                      <span className="text-[10px] text-muted-foreground">{vt.desc}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {/* Low threshold */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] text-muted-foreground font-medium">Low</label>
                        <Input
                          type="number"
                          value={t.low_threshold ?? ""}
                          onChange={(e) => handleChange(vt.value, "low_threshold", e.target.value)}
                          disabled={!t.enabled}
                          className="w-20 h-7 text-xs"
                          placeholder="—"
                        />
                        <span className="text-[10px] text-muted-foreground">{vt.unit}</span>
                      </div>
                      {/* High threshold */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] text-muted-foreground font-medium">High</label>
                        <Input
                          type="number"
                          value={t.high_threshold ?? ""}
                          onChange={(e) => handleChange(vt.value, "high_threshold", e.target.value)}
                          disabled={!t.enabled}
                          className="w-20 h-7 text-xs"
                          placeholder="—"
                        />
                        <span className="text-[10px] text-muted-foreground">{vt.unit}</span>
                      </div>
                    </div>
                  </div>
                  {/* Enable toggle */}
                  <Switch
                    checked={t.enabled}
                    onCheckedChange={(checked) => handleChange(vt.value, "enabled", checked)}
                  />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          These alerts are informational only and not a substitute for professional medical monitoring. In an emergency, call 911 immediately.
        </p>
      </div>
    </div>
  );
}