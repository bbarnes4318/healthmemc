import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  Loader2, Plus, Target, Droplets, Brain, Dumbbell, Apple, Moon,
  Activity, Heart, Zap, Trash2, Minus, Check, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, parseISO } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";

const categoryConfig = {
  hydration: { label: "Hydration", icon: Droplets, color: "#06b6d4", bg: "bg-cyan-50" },
  mindfulness: { label: "Mindfulness", icon: Brain, color: "#8b5cf6", bg: "bg-violet-50" },
  fitness: { label: "Fitness", icon: Dumbbell, color: "#22c55e", bg: "bg-green-50" },
  nutrition: { label: "Nutrition", icon: Apple, color: "#f59e0b", bg: "bg-amber-50" },
  sleep: { label: "Sleep", icon: Moon, color: "#6366f1", bg: "bg-indigo-50" },
  pain_management: { label: "Pain Mgmt", icon: Activity, color: "#ef4444", bg: "bg-red-50" },
  custom: { label: "Custom", icon: Target, color: "#0ea5e9", bg: "bg-sky-50" },
};

export default function CustomWellnessGoalTracker() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [goals, setGoals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    goal_name: "",
    category: "custom",
    target_value: "",
    unit: "",
    frequency: "daily",
  });
  const [logValues, setLogValues] = useState({});
  const [logSaving, setLogSaving] = useState(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const memberFilter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const [goalData, logData] = await Promise.all([
        base44.entities.CustomWellnessGoal.filter(memberFilter, "-created_date", 50),
        base44.entities.CustomWellnessLog.filter(memberFilter, "-date", 200),
      ]);
      setGoals(goalData.filter((g) => g.is_active !== false));
      setLogs(logData);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentMemberId]);

  useEffect(() => { load(); }, [load]);

  // Today's log value per goal
  const todayLogs = useMemo(() => {
    const map = {};
    logs.filter((l) => l.date === today).forEach((l) => {
      map[l.goal_id] = l;
    });
    return map;
  }, [logs, today]);

  // 7-day chart data per goal
  const getChartData = (goalId) => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayLog = logs.find((l) => l.goal_id === goalId && l.date === dateStr);
      return {
        day: format(date, "EEE"),
        value: dayLog?.value || 0,
      };
    });
  };

  const handleCreateGoal = async () => {
    if (!form.goal_name.trim() || !form.target_value || !form.unit.trim()) {
      toast({ title: "Name, target, and unit are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.CustomWellnessGoal.create({
        goal_name: form.goal_name.trim(),
        category: form.category,
        target_value: parseFloat(form.target_value),
        unit: form.unit.trim(),
        frequency: form.frequency,
        is_active: true,
        family_member_id: currentMemberId || undefined,
      });
      toast({ title: "Wellness goal created" });
      setForm({ goal_name: "", category: "custom", target_value: "", unit: "", frequency: "daily" });
      setShowForm(false);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to create goal", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDeleteGoal = async (goal) => {
    try {
      await base44.entities.CustomWellnessGoal.delete(goal.id);
      toast({ title: "Goal removed" });
      load();
    } catch (e) { console.error(e); }
  };

  const handleLog = async (goal, value) => {
    if (!value && value !== 0) return;
    setLogSaving(goal.id);
    const existing = todayLogs[goal.id];
    try {
      if (existing) {
        await base44.entities.CustomWellnessLog.update(existing.id, {
          value: parseFloat(value),
        });
      } else {
        await base44.entities.CustomWellnessLog.create({
          goal_id: goal.id,
          goal_name: goal.goal_name,
          date: today,
          value: parseFloat(value),
          unit: goal.unit,
          family_member_id: currentMemberId || undefined,
        });
      }
      toast({ title: "Progress logged" });
      setLogValues({ ...logValues, [goal.id]: "" });
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to log", variant: "destructive" });
    }
    setLogSaving(null);
  };

  const handleQuickLog = async (goal, delta) => {
    const current = todayLogs[goal.id]?.value || 0;
    const newVal = Math.max(0, current + delta);
    setLogSaving(goal.id);
    const existing = todayLogs[goal.id];
    try {
      if (existing) {
        await base44.entities.CustomWellnessLog.update(existing.id, { value: newVal });
      } else {
        await base44.entities.CustomWellnessLog.create({
          goal_id: goal.id,
          goal_name: goal.goal_name,
          date: today,
          value: newVal,
          unit: goal.unit,
          family_member_id: currentMemberId || undefined,
        });
      }
      load();
    } catch (e) { console.error(e); }
    setLogSaving(null);
  };

  if (loading) {
    return (
      <Card className="p-5 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Custom Wellness Goals</h3>
            <p className="text-xs text-muted-foreground">Track personal health goals alongside your vitals</p>
          </div>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Target className="w-4 h-4 text-emerald-600" /> Create Wellness Goal
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Goal Name</label>
                <Input
                  placeholder="e.g., Daily Water Intake, Meditation Minutes"
                  value={form.goal_name}
                  onChange={(e) => setForm({ ...form, goal_name: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Daily Target</label>
                  <Input
                    type="number"
                    placeholder="8"
                    value={form.target_value}
                    onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Unit</label>
                  <Input
                    placeholder="glasses, min, hrs"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <Button onClick={handleCreateGoal} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-6">
          <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No custom goals yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create goals like daily water intake, meditation minutes, or stretching reps.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {goals.map((goal, i) => {
              const cfg = categoryConfig[goal.category] || categoryConfig.custom;
              const Icon = cfg.icon;
              const todayLog = todayLogs[goal.id];
              const currentVal = todayLog?.value || 0;
              const pct = goal.target_value > 0 ? Math.min(100, Math.round((currentVal / goal.target_value) * 100)) : 0;
              const isComplete = currentVal >= goal.target_value;
              const chartData = getChartData(goal.id);
              const weekTotal = chartData.reduce((s, d) => s + d.value, 0);
              const weekAvg = (weekTotal / 7).toFixed(1);

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{goal.goal_name}</p>
                          {isComplete && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px]">
                              <Check className="w-2.5 h-2.5 mr-0.5" /> Goal met!
                            </Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => handleDeleteGoal(goal)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>Target: {goal.target_value} {goal.unit}/{goal.frequency === "daily" ? "day" : "week"}</span>
                        <span>· 7-day avg: {weekAvg} {goal.unit}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">
                            Today: <span style={{ color: cfg.color }} className="font-bold">{currentVal}</span> / {goal.target_value} {goal.unit}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${isComplete ? "bg-emerald-500" : ""}`}
                            style={{ backgroundColor: isComplete ? undefined : cfg.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>

                      {/* Quick log controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() => handleQuickLog(goal, -1)}
                          disabled={logSaving === goal.id}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          placeholder="Log"
                          value={logValues[goal.id] || ""}
                          onChange={(e) => setLogValues({ ...logValues, [goal.id]: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") handleLog(goal, logValues[goal.id]); }}
                          className="h-7 w-20 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() => handleQuickLog(goal, 1)}
                          disabled={logSaving === goal.id}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleLog(goal, logValues[goal.id])}
                          disabled={!logValues[goal.id] || logSaving === goal.id}
                          className="h-7 text-xs"
                          style={{ backgroundColor: cfg.color }}
                        >
                          {logSaving === goal.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Log"}
                        </Button>
                        {todayLog && (
                          <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Logged today
                          </span>
                        )}
                      </div>

                      {/* Mini 7-day chart */}
                      {chartData.some((d) => d.value > 0) && (
                        <div className="h-16 mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <XAxis dataKey="day" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                                {chartData.map((entry, idx) => (
                                  <Cell key={idx} fill={entry.value >= goal.target_value ? "#22c55e" : cfg.color} />
                                ))}
                              </Bar>
                              <Tooltip
                                contentStyle={{ borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 10 }}
                                formatter={(val) => [`${val} ${goal.unit}`, goal.goal_name]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}