import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, HeartPulse, Activity, Droplet, Scale, Moon, Footprints, Thermometer } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const vitalConfig = {
  blood_pressure: { label: "Blood Pressure", icon: HeartPulse, color: "#ef4444", unit: "mmHg" },
  heart_rate: { label: "Heart Rate", icon: Activity, color: "#f97316", unit: "bpm" },
  oxygen_saturation: { label: "Oxygen Sat", icon: Droplet, color: "#3b82f6", unit: "%" },
  blood_glucose: { label: "Blood Glucose", icon: Droplet, color: "#8b5cf6", unit: "mg/dL" },
  weight: { label: "Weight", icon: Scale, color: "#10b981", unit: "kg" },
  sleep_hours: { label: "Sleep", icon: Moon, color: "#6366f1", unit: "hrs" },
  activity_minutes: { label: "Activity", icon: Footprints, color: "#14b8a6", unit: "min" },
  temperature: { label: "Temperature", icon: Thermometer, color: "#f59e0b", unit: "°C" },
};

export default function VitalSummary() {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.VitalRecord.list("-recorded_at", 50)
      .then(setVitals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const byType = {};
  vitals.forEach((v) => {
    if (!byType[v.type]) byType[v.type] = [];
    byType[v.type].push(v);
  });

  const types = Object.keys(byType);

  if (types.length === 0) {
    return (
      <Card className="p-8 text-center">
        <HeartPulse className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No vital records yet</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {types.map((type) => {
        const config = vitalConfig[type] || { label: type, icon: Activity, color: "#64748b", unit: "" };
        const records = byType[type].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
        const latest = records[records.length - 1];
        const chartData = records.map((r) => ({
          time: new Date(r.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: r.value,
        }));
        const Icon = config.icon;

        return (
          <Card key={type} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.color + "20" }}>
                <Icon className="w-4 h-4" style={{ color: config.color }} />
              </div>
              <span className="text-sm font-medium">{config.label}</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold">
                {type === "blood_pressure" && latest.secondary_value ? `${latest.value}/${latest.secondary_value}` : latest.value}
              </span>
              <span className="text-xs text-muted-foreground">{config.unit}</span>
            </div>
            {chartData.length > 1 && (
              <ResponsiveContainer width="100%" height={48}>
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} dot={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={["dataMin - 5", "dataMax + 5"]} hide />
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              {new Date(latest.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </Card>
        );
      })}
    </div>
  );
}