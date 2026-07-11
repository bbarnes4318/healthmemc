import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Square, Loader2, TrendingUp, Activity, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useFamilyMember } from "@/context/FamilyMemberContext";

export default function StepTracker() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [steps, setSteps] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [healthScore, setHealthScore] = useState(null);
  const [manualSteps, setManualSteps] = useState("");
  const [sensorSupported, setSensorSupported] = useState(true);
  const stepCountRef = useRef(0);
  const lastStepTimeRef = useRef(0);
  const motionHandlerRef = useRef(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const loadData = async () => {
    try {
      const [vitals, profiles] = await Promise.all([
        base44.entities.VitalRecord.filter({ type: "steps" }),
        base44.entities.HealthProfile.filter({}),
      ]);
      const filtered = currentMemberId
        ? vitals.filter((v) => v.family_member_id === currentMemberId)
        : vitals;
      setLogs(filtered);

      const todayRecord = filtered.find((v) => {
        const d = new Date(v.recorded_at);
        return format(d, "yyyy-MM-dd") === today;
      });
      if (todayRecord) {
        setSteps(todayRecord.value);
        stepCountRef.current = todayRecord.value;
      }

      if (profiles.length > 0) setHealthScore(profiles[0].health_score);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
      setSensorSupported(false);
    }
    return () => {
      if (motionHandlerRef.current) {
        window.removeEventListener("devicemotion", motionHandlerRef.current);
      }
    };
  }, [currentMemberId]);

  const handleMotion = (event) => {
    const { accelerationIncludingGravity } = event;
    if (!accelerationIncludingGravity) return;

    const { x, y, z } = accelerationIncludingGravity;
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    const now = Date.now();
    if (magnitude > 12.5 && now - lastStepTimeRef.current > 250) {
      lastStepTimeRef.current = now;
      stepCountRef.current += 1;
      setSteps(stepCountRef.current);
    }
  };

  const startTracking = async () => {
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== "granted") return;
      } catch (e) { console.error(e); return; }
    }
    motionHandlerRef.current = handleMotion;
    window.addEventListener("devicemotion", motionHandlerRef.current);
    setTracking(true);
  };

  const stopTracking = async () => {
    if (motionHandlerRef.current) {
      window.removeEventListener("devicemotion", motionHandlerRef.current);
      motionHandlerRef.current = null;
    }
    setTracking(false);
    await saveSteps(stepCountRef.current);
  };

  const saveSteps = async (stepValue) => {
    if (!stepValue || stepValue === 0) return;
    setSaving(true);
    try {
      const existing = logs.find((v) => {
        const d = new Date(v.recorded_at);
        return format(d, "yyyy-MM-dd") === today;
      });

      if (existing) {
        await base44.entities.VitalRecord.update(existing.id, { value: stepValue });
      } else {
        await base44.entities.VitalRecord.create({
          type: "steps",
          value: stepValue,
          unit: "steps",
          recorded_at: new Date().toISOString(),
          family_member_id: currentMemberId || undefined,
        });
      }
      loadData();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleManualAdd = async () => {
    const val = parseInt(manualSteps);
    if (!val || val <= 0) return;
    const newTotal = steps + val;
    stepCountRef.current = newTotal;
    setSteps(newTotal);
    setManualSteps("");
    await saveSteps(newTotal);
  };

  const stepTrend = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayStr = format(d, "yyyy-MM-dd");
      const dayLog = logs.find((v) => format(new Date(v.recorded_at), "yyyy-MM-dd") === dayStr);
      return {
        day: format(d, "EEE"),
        steps: dayLog ? dayLog.value : 0,
      };
    });
  }, [logs]);

  const avgSteps = Math.round(stepTrend.reduce((s, d) => s + d.steps, 0) / 7);
  const goal = 10000;
  const progress = Math.min(100, Math.round((steps / goal) * 100));

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-600" /> Daily Activity Tracker
        </h3>
        <p className="text-xs text-muted-foreground">Tracking for {currentMemberName} · {format(new Date(), "MMM d")}</p>
      </div>

      {/* Step Counter */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Today's Steps</p>
            <p className="text-3xl font-display font-bold text-cyan-600">{steps.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {progress}% of {goal.toLocaleString()} goal · avg {avgSteps.toLocaleString()}/day
            </p>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e0f2fe" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="28" fill="none" stroke="#06b6d4" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-cyan-600">{progress}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-cyan-100 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-sky-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex gap-2">
          {!tracking ? (
            <Button onClick={startTracking} className="flex-1 bg-cyan-600 hover:bg-cyan-700" disabled={!sensorSupported}>
              <Play className="w-4 h-4 mr-2" /> Start Sensor Tracking
            </Button>
          ) : (
            <Button onClick={stopTracking} variant="destructive" className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Square className="w-4 h-4 mr-2" />}
              {saving ? "Saving..." : "Stop & Save"}
            </Button>
          )}
        </div>

        {!sensorSupported && (
          <p className="text-xs text-amber-600 mt-2">
            Motion sensors not available on this device. Use manual entry below.
          </p>
        )}

        {/* Manual entry */}
        <div className="flex gap-2 mt-3">
          <Input
            type="number"
            placeholder="Add steps manually"
            value={manualSteps}
            onChange={(e) => setManualSteps(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleManualAdd(); }}
            className="flex-1"
          />
          <Button onClick={handleManualAdd} variant="outline" disabled={!manualSteps || saving}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* 7-Day Step Trend */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-cyan-600" /> 7-Day Step Trend</h4>
          {healthScore && (
            <div className="flex items-center gap-2 text-xs">
              <Activity className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-muted-foreground">Health Score:</span>
              <span className="font-bold text-violet-600">{healthScore}</span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stepTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="steps" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Higher daily steps correlate with improved health scores over time
        </p>
      </Card>
    </div>
  );
}