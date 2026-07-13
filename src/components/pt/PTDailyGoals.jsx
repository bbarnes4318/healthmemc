import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, CheckCircle2, Loader2, TrendingUp, Activity, Timer, Bone, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format } from "date-fns";

const bodyParts = [
  { value: "knee", label: "Knee" }, { value: "shoulder", label: "Shoulder" },
  { value: "hip", label: "Hip" }, { value: "spine", label: "Spine" },
  { value: "ankle", label: "Ankle" }, { value: "wrist", label: "Wrist" },
  { value: "neck", label: "Neck" }, { value: "full_body", label: "Full Body" },
  { value: "other", label: "Other" },
];

export default function PTDailyGoals() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [goal, setGoal] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const load = async () => {
    try {
      const [goalData, logData] = await Promise.all([
        base44.entities.PTDailyGoal.list("-created_date", 50),
        base44.entities.ExerciseLog.list("-date", 200),
      ]);
      const memberGoals = currentMemberId ? goalData.filter((g) => g.family_member_id === currentMemberId) : goalData;
      const memberLogs = currentMemberId ? logData.filter((l) => l.family_member_id === currentMemberId) : logData;
      setGoal(memberGoals[0] || null);
      setLogs(memberLogs);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const todayExercises = useMemo(() => logs.filter((l) => l.date === today), [logs, today]);

  const todayDuration = useMemo(() => 
    todayExercises.reduce((sum, l) => sum + (l.duration_minutes || 0), 0), [todayExercises]);

  const todayRom = useMemo(() => {
    if (!goal?.rom_body_part) return null;
    const partLogs = todayExercises.filter((l) => l.body_part === goal.rom_body_part && l.rom_degrees != null);
    if (partLogs.length === 0) return null;
    return Math.max(...partLogs.map((l) => l.rom_degrees));
  }, [todayExercises, goal]);

  const exerciseProgress = goal?.daily_exercise_count ? Math.min((todayExercises.length / goal.daily_exercise_count) * 100, 100) : 0;
  const durationProgress = goal?.daily_duration_minutes ? Math.min((todayDuration / goal.daily_duration_minutes) * 100, 100) : 0;
  const romProgress = (goal?.daily_rom_target && todayRom != null) ? Math.min((todayRom / goal.daily_rom_target) * 100, 100) : 0;

  const exerciseHit = goal?.daily_exercise_count && todayExercises.length >= goal.daily_exercise_count;
  const durationHit = goal?.daily_duration_minutes && todayDuration >= goal.daily_duration_minutes;
  const romHit = goal?.daily_rom_target && todayRom != null && todayRom >= goal.daily_rom_target;

  const handleSave = async (updates) => {
    setSaving(true);
    try {
      if (goal) {
        await base44.entities.PTDailyGoal.update(goal.id, updates);
        setGoal({ ...goal, ...updates });
      } else {
        const newGoal = await base44.entities.PTDailyGoal.create({
          ...updates,
          family_member_id: currentMemberId || undefined,
        });
        setGoal(newGoal);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const adjustValue = (field, delta, min = 0) => {
    const current = goal?.[field] || 0;
    const newVal = Math.max(min, current + delta);
    handleSave({ [field]: newVal });
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-orange-600" /></div>;
  }

  const goals = [
    {
      label: "Exercises", icon: Activity, color: "orange",
      current: todayExercises.length, target: goal?.daily_exercise_count || 0,
      progress: exerciseProgress, hit: exerciseHit, unit: "",
      onAdjust: (d) => adjustValue("daily_exercise_count", d, 1),
    },
    {
      label: "Duration", icon: Timer, color: "sky",
      current: todayDuration, target: goal?.daily_duration_minutes || 0,
      progress: durationProgress, hit: durationHit, unit: " min",
      onAdjust: (d) => adjustValue("daily_duration_minutes", d, 5),
    },
    {
      label: `ROM: ${bodyParts.find((b) => b.value === goal?.rom_body_part)?.label || "—"}`, icon: Bone, color: "violet",
      current: todayRom ?? 0, target: goal?.daily_rom_target || 0,
      progress: romProgress, hit: romHit, unit: "°",
      onAdjust: (d) => adjustValue("daily_rom_target", d, 5),
      hasValue: todayRom != null,
    },
  ];

  const colorMap = {
    orange: { bg: "bg-orange-500", light: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", icon: "text-orange-500" },
    sky: { bg: "bg-sky-500", light: "bg-sky-50", text: "text-sky-600", border: "border-sky-200", icon: "text-sky-500" },
    violet: { bg: "bg-violet-500", light: "bg-violet-50", text: "text-violet-600", border: "border-violet-200", icon: "text-violet-500" },
  };

  return (
    <Card className="p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-orange-600" /> Daily Activity Goals
          <span className="text-muted-foreground ml-1">· {currentMemberName}</span>
        </h4>
        <span className="text-[10px] text-muted-foreground">{format(new Date(), "EEEE, MMM d")}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {goals.map((g, i) => {
          const colors = colorMap[g.color];
          const Icon = g.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`p-3 rounded-lg border ${g.hit ? `${colors.light} ${colors.border}` : "bg-muted/30 border-border"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-3.5 h-3.5 ${colors.icon}`} />
                <span className="text-[10px] font-medium text-muted-foreground truncate">{g.label}</span>
                {g.hit && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />}
              </div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-lg font-bold">
                    <span className={g.hit ? "text-emerald-600" : colors.text}>{g.current}</span>
                    <span className="text-xs text-muted-foreground"> / {g.target || "—"}{g.unit}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => g.onAdjust(-1)} disabled={saving}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => g.onAdjust(1)} disabled={saving}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${g.hit ? "bg-emerald-500" : colors.bg}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${g.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">
                {g.target === 0 ? "Set a target" :
                  g.hit ? "Goal reached!" :
                  g.hasValue === false && g.label.includes("ROM") ? "No ROM data today" :
                  `${Math.round(g.progress)}% complete`}
              </p>
            </motion.div>
          );
        })}
      </div>

      {goal?.rom_body_part === undefined && (
        <div className="mt-3">
          <Label className="text-xs">ROM Body Part to Track</Label>
          <Select value={goal?.rom_body_part || ""} onValueChange={(v) => handleSave({ rom_body_part: v })}>
            <SelectTrigger className="h-8 mt-1"><SelectValue placeholder="Select body part..." /></SelectTrigger>
            <SelectContent>
              {bodyParts.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {goal?.rom_body_part && (
        <div className="mt-3 flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap">ROM target part:</Label>
          <Select value={goal.rom_body_part} onValueChange={(v) => handleSave({ rom_body_part: v })}>
            <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {bodyParts.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {(exerciseHit && durationHit && romHit) && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <p className="text-xs text-emerald-800 font-medium">All daily targets reached! Great work on your recovery today.</p>
        </motion.div>
      )}
    </Card>
  );
}