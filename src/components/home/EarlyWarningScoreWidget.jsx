import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, ShieldCheck, HeartPulse, ShieldAlert, Thermometer, Droplets } from "lucide-react";

/**
 * Calculates National Early Warning Score (NEWS2) based on clinical vital thresholds.
 */
function calculateNEWS2(vitals = []) {
  if (!Array.isArray(vitals) || vitals.length === 0) {
    return { score: 0, level: "normal", label: "Normal / Low Risk", color: "bg-emerald-50 text-emerald-800 border-emerald-300" };
  }

  let score = 0;
  const vitalMap = {};
  vitals.forEach((v) => {
    if (v?.type && !vitalMap[v.type]) vitalMap[v.type] = v;
  });

  // Heart rate (bpm)
  if (vitalMap.heart_rate) {
    const hr = Number(vitalMap.heart_rate.value);
    if (hr <= 40 || hr >= 131) score += 3;
    else if (hr >= 111) score += 2;
    else if (hr <= 50 || hr >= 91) score += 1;
  }

  // Blood Pressure Systolic (mmHg)
  if (vitalMap.blood_pressure) {
    const sbp = Number(vitalMap.blood_pressure.value);
    if (sbp <= 90 || sbp >= 220) score += 3;
    else if (sbp <= 100) score += 2;
    else if (sbp <= 110) score += 1;
  }

  // Oxygen Saturation (%)
  if (vitalMap.oxygen_saturation) {
    const spo2 = Number(vitalMap.oxygen_saturation.value);
    if (spo2 <= 91) score += 3;
    else if (spo2 <= 93) score += 2;
    else if (spo2 <= 95) score += 1;
  }

  // Temperature (°F or °C)
  if (vitalMap.temperature) {
    let tempF = Number(vitalMap.temperature.value);
    if (vitalMap.temperature.unit === "C") tempF = tempF * 1.8 + 32;
    if (tempF <= 95.0 || tempF >= 102.3) score += 3;
    else if (tempF >= 100.4) score += 1;
    else if (tempF <= 96.8) score += 1;
  }

  if (score >= 7) {
    return { score, level: "high", label: "High Clinical Risk — Seek Urgent Care", color: "bg-red-50 text-red-800 border-red-300", icon: ShieldAlert };
  }
  if (score >= 5) {
    return { score, level: "moderate", label: "Moderate Risk — Monitor Closely", color: "bg-amber-50 text-amber-800 border-amber-300", icon: AlertTriangle };
  }
  if (score >= 1) {
    return { score, level: "low", label: "Low Risk — Mild Vital Variance", color: "bg-blue-50 text-blue-800 border-blue-300", icon: Activity };
  }
  return { score: 0, level: "normal", label: "Normal Clinical Status", color: "bg-emerald-50 text-emerald-800 border-emerald-300", icon: ShieldCheck };
}

export default function EarlyWarningScoreWidget({ vitals = [] }) {
  const news = calculateNEWS2(vitals);
  const Icon = news.icon || ShieldCheck;

  return (
    <Card className={`p-4 border ${news.color} transition-all`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/80 shadow-sm flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-sm">Clinical Early Warning Index</h3>
              <Badge className="text-[10px] px-2 py-0.5 bg-white/90 border font-bold">
                NEWS2 Score: {news.score}
              </Badge>
            </div>
            <p className="text-xs font-medium mt-0.5">{news.label}</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Based on {vitals.length} recent vital reading{vitals.length !== 1 ? "s" : ""}
        </div>
      </div>
    </Card>
  );
}
