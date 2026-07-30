import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, TrendingDown, Bell, ChevronRight, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { motion, AnimatePresence } from "framer-motion";

const VITAL_LABELS = {
  heart_rate: "Heart Rate", blood_pressure: "Blood Pressure",
  oxygen_saturation: "Oxygen Saturation", blood_glucose: "Blood Glucose",
  weight: "Weight", sleep_hours: "Sleep", temperature: "Temperature",
  activity_minutes: "Activity",
};

const VITAL_UNITS = {
  heart_rate: "bpm", blood_pressure: "mmHg", oxygen_saturation: "%",
  blood_glucose: "mg/dL", weight: "kg", sleep_hours: "hrs",
  temperature: "°F", activity_minutes: "min",
};

export default function VitalAlertBanner() {
  const [thresholds, setThresholds] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifPerm, setNotifPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "denied");
  const notifiedRef = useRef(false);
  const { currentMemberId } = useFamilyMember();

  useEffect(() => {
    const load = async () => {
      try {
        const [tData, vData] = await Promise.all([
          currentMemberId
            ? base44.entities.VitalThreshold.filter({ enabled: true, family_member_id: currentMemberId })
            : base44.entities.VitalThreshold.filter({ enabled: true }),
          currentMemberId
            ? base44.entities.VitalRecord.filter({ family_member_id: currentMemberId }, "-recorded_at", 50)
            : base44.entities.VitalRecord.list("-recorded_at", 50),
        ]);
        setThresholds(Array.isArray(tData) ? tData : []);
        setVitals(Array.isArray(vData) ? vData : []);
      } catch (e) {
        console.error(e);
        setThresholds([]);
        setVitals([]);
      }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  const breaches = [];
  const safeThresholds = Array.isArray(thresholds) ? thresholds : [];
  const safeVitals = Array.isArray(vitals) ? vitals : [];
  for (const threshold of safeThresholds) {
    const vital = safeVitals.find((v) => v.type === threshold.vital_type);
    if (!vital) continue;

    const vitalDate = vital.recorded_at ? new Date(vital.recorded_at) : new Date(vital.created_date);
    const hoursAgo = (Date.now() - vitalDate.getTime()) / (1000 * 60 * 60);
    if (hoursAgo > 24) continue;

    let breached = false, direction = "", displayValue = "";

    if (threshold.vital_type === "blood_pressure") {
      displayValue = `${vital.value}/${vital.secondary_value || "?"} mmHg`;
      if (threshold.high_threshold != null && vital.value > threshold.high_threshold) {
        breached = true; direction = "HIGH";
      } else if (threshold.low_threshold != null && vital.value < threshold.low_threshold) {
        breached = true; direction = "LOW";
      }
    } else {
      displayValue = `${vital.value} ${VITAL_UNITS[threshold.vital_type] || ""}`;
      if (threshold.high_threshold != null && vital.value > threshold.high_threshold) {
        breached = true; direction = "HIGH";
      } else if (threshold.low_threshold != null && vital.value < threshold.low_threshold) {
        breached = true; direction = "LOW";
      }
    }

    if (breached) {
      breaches.push({
        label: VITAL_LABELS[threshold.vital_type] || threshold.vital_type,
        direction, displayValue, recordedAt: vitalDate,
      });
    }
  }

  useEffect(() => {
    if (breaches.length > 0 && !notifiedRef.current && notifPerm === "granted") {
      notifiedRef.current = true;
      new Notification("🚨 Vital Sign Alert", {
        body: `${breaches.length} vital sign${breaches.length > 1 ? "s" : ""} out of range: ${breaches.map((b) => `${b.label} ${b.direction}`).join(", ")}`,
      });
    }
  }, [breaches.length, notifPerm]);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === "granted" && breaches.length > 0) {
      notifiedRef.current = true;
      new Notification("🚨 Vital Sign Alert", {
        body: `${breaches.length} vital sign${breaches.length > 1 ? "s" : ""} out of range: ${breaches.map((b) => `${b.label} ${b.direction}`).join(", ")}`,
      });
    }
  };

  if (loading) return null;

  if (thresholds.length === 0) {
    return (
      <Card className="p-4 border-amber-200 bg-amber-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-700">Set up vital sign alerts</p>
            <p className="text-xs text-amber-600">Get notified when heart rate, blood pressure, or other vitals deviate from your normal range.</p>
          </div>
          <Link to="/vital-thresholds" className="shrink-0">
            <Button variant="outline" size="sm" className="border-amber-200 text-amber-700 hover:bg-amber-100 h-8 text-xs">
              Set Up <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (breaches.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <Card className="p-4 border-red-200 bg-red-50/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-display font-bold text-sm text-red-700">
                  Vital Alert — {breaches.length} reading{breaches.length > 1 ? "s" : ""} out of range
                </h3>
                {notifPerm !== "granted" && (
                  <Button variant="outline" size="sm" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={enableNotifications}>
                    <Bell className="w-3 h-3 mr-1" /> Enable Push
                  </Button>
                )}
              </div>
              <div className="mt-2 space-y-1.5">
                {breaches.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                    {b.direction === "HIGH" ? (
                      <TrendingUp className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{b.label}</span>
                      <span className={`text-xs ml-2 font-semibold ${b.direction === "HIGH" ? "text-red-600" : "text-blue-600"}`}>
                        {b.direction}: {b.displayValue}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {b.recordedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <Link to="/alert-history" className="text-xs text-red-600 hover:underline flex items-center gap-0.5">
                  Alert history <ChevronRight className="w-3 h-3" />
                </Link>
                <Link to="/vital-thresholds" className="text-xs text-red-600 hover:underline flex items-center gap-0.5">
                  Adjust thresholds <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}