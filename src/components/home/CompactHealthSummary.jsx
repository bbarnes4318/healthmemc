import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  Pill, TrendingUp, TrendingDown, Minus,
  Heart, Activity, Moon, Zap, ChevronRight,
} from "lucide-react";

export default function CompactHealthSummary({ medications = [], vitals = [] }) {
  const getTrend = (type) => {
    const records = vitals.filter((v) => v.type === type);
    if (records.length === 0) return null;
    const latest = records[0];
    const previous = records[1];
    let trend = "stable";
    if (previous) {
      if (type === "blood_pressure") {
        if (latest.value > previous.value + 2) trend = "up";
        else if (latest.value < previous.value - 2) trend = "down";
      } else {
        if (latest.value > previous.value * 1.02) trend = "up";
        else if (latest.value < previous.value * 0.98) trend = "down";
      }
    }
    return { latest, trend };
  };

  const vitalConfigs = [
    { type: "heart_rate", label: "Heart Rate", unit: "bpm", icon: Heart, color: "text-rose-600" },
    { type: "blood_pressure", label: "Blood Pressure", unit: "mmHg", icon: Activity, color: "text-sky-600" },
    { type: "sleep_hours", label: "Sleep", unit: "hrs", icon: Moon, color: "text-indigo-600" },
    { type: "activity_minutes", label: "Activity", unit: "min", icon: Zap, color: "text-emerald-600" },
  ];

  const formatValue = (type, record) => {
    if (!record) return "—";
    if (type === "blood_pressure" && record.secondary_value) return `${record.value}/${record.secondary_value}`;
    return record.value;
  };

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {/* Prescriptions */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-display font-semibold flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              Prescriptions
            </h3>
            <Link to="/pharmacy" className="text-xs text-sky-600 hover:underline flex items-center gap-0.5">
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {medications.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3">No active prescriptions</p>
          ) : (
            <div className="space-y-2">
              {medications.slice(0, 4).map((med) => (
                <div key={med.id} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-medium truncate flex-1">{med.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{med.dosage}</span>
                </div>
              ))}
              {medications.length > 4 && (
                <p className="text-xs text-muted-foreground pl-3.5">+{medications.length - 4} more</p>
              )}
            </div>
          )}
        </div>

        {/* Vital Trends */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-display font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              Vital Trends
            </h3>
            <Link to="/dashboard" className="text-xs text-sky-600 hover:underline flex items-center gap-0.5">
              Details <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {vitalConfigs.map(({ type, label, unit, icon: Icon, color }) => {
              const trend = getTrend(type);
              return (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                  <span className="text-muted-foreground text-xs flex-1 truncate">{label}</span>
                  <span className="font-semibold tabular-nums">{formatValue(type, trend?.latest)}</span>
                  <span className="text-xs text-muted-foreground w-8 text-right">{trend?.latest ? unit : ""}</span>
                  {trend && trend.trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />}
                  {trend && trend.trend === "down" && <TrendingDown className="w-3 h-3 text-rose-500 shrink-0" />}
                  {trend && trend.trend === "stable" && <Minus className="w-3 h-3 text-muted-foreground shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}