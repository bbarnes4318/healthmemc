import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  Loader2, Flame, Beef, Wheat, Droplet, Target, ChevronLeft, ChevronRight, CheckCircle, Edit3
} from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays, parseISO } from "date-fns";

const targetConfig = [
  { key: "calories", label: "Calories", icon: Flame, color: "#f59e0b", unit: "kcal", goalKey: "calorie_goal" },
  { key: "protein_g", label: "Protein", icon: Beef, color: "#ef4444", unit: "g", goalKey: "protein_goal" },
  { key: "carbs_g", label: "Carbs", icon: Wheat, color: "#3b82f6", unit: "g", goalKey: "carbs_goal" },
  { key: "fat_g", label: "Fat", icon: Droplet, color: "#8b5cf6", unit: "g", goalKey: "fat_goal" },
];

export default function NutritionGoalComparison() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalForm, setGoalForm] = useState({ calorie_goal: "", protein_goal: "", carbs_goal: "", fat_goal: "" });
  const [savingGoals, setSavingGoals] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const memberFilter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const [logData, goalData] = await Promise.all([
        base44.entities.NutritionLog.filter(memberFilter, "-date", 500),
        base44.entities.NutritionGoal.filter(memberFilter, "-created_date", 10),
      ]);
      setLogs(logData);
      const activeGoal = goalData[0] || null;
      setGoal(activeGoal);
      if (activeGoal) {
        setGoalForm({
          calorie_goal: String(activeGoal.calorie_goal || ""),
          protein_goal: String(activeGoal.protein_goal || ""),
          carbs_goal: String(activeGoal.carbs_goal || ""),
          fat_goal: String(activeGoal.fat_goal || ""),
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentMemberId]);

  useEffect(() => { load(); }, [load]);

  const dayLogs = logs.filter((l) => l.date === selectedDate);

  const totals = targetConfig.reduce((acc, t) => {
    acc[t.key] = dayLogs.reduce((sum, l) => sum + (l[t.key] || 0), 0);
    return acc;
  }, {});

  const handleSaveGoals = async () => {
    setSavingGoals(true);
    try {
      const payload = {
        calorie_goal: parseFloat(goalForm.calorie_goal) || 2000,
        protein_goal: parseFloat(goalForm.protein_goal) || 50,
        carbs_goal: parseFloat(goalForm.carbs_goal) || 250,
        fat_goal: parseFloat(goalForm.fat_goal) || 70,
        family_member_id: currentMemberId || undefined,
      };
      if (goal) {
        await base44.entities.NutritionGoal.update(goal.id, payload);
      } else {
        const created = await base44.entities.NutritionGoal.create(payload);
        setGoal(created);
      }
      toast({ title: "Nutrition goals updated" });
      setEditingGoals(false);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save goals", variant: "destructive" });
    }
    setSavingGoals(false);
  };

  const shiftDate = (delta) => {
    const d = parseISO(selectedDate);
    setSelectedDate(format(subDays(d, -delta), "yyyy-MM-dd"));
  };

  const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");

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
            <h3 className="font-semibold text-sm">Daily Nutrition vs Goals</h3>
            <p className="text-xs text-muted-foreground">Track protein, carbs & calories against your targets</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditingGoals(!editingGoals)}>
          <Edit3 className="w-3 h-3 mr-1.5" />
          {editingGoals ? "Cancel" : "Edit Goals"}
        </Button>
      </div>

      {/* Date Selector */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shiftDate(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium">
          {isToday ? "Today" : format(parseISO(selectedDate), "MMM d, yyyy")}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shiftDate(1)} disabled={isToday}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {editingGoals ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Set your daily nutrition targets:</p>
          <div className="grid grid-cols-2 gap-3">
            {targetConfig.map((t) => (
              <div key={t.key}>
                <label className="text-xs font-medium mb-1 flex items-center gap-1">
                  <t.icon className="w-3 h-3" style={{ color: t.color }} />
                  {t.label} Goal ({t.unit})
                </label>
                <Input
                  type="number"
                  value={goalForm[t.goalKey]}
                  onChange={(e) => setGoalForm({ ...goalForm, [t.goalKey]: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <Button onClick={handleSaveGoals} disabled={savingGoals} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {savingGoals ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Save Goals
          </Button>
        </div>
      ) : (
        <>
          {/* Progress Bars */}
          <div className="space-y-4">
            {targetConfig.map((t) => {
              const current = totals[t.key] || 0;
              const targetVal = goal ? (goal[t.goalKey] || 0) : 0;
              const pct = targetVal > 0 ? Math.min(100, Math.round((current / targetVal) * 100)) : 0;
              const isMet = current >= targetVal && targetVal > 0;
              const isOver = current > targetVal * 1.1 && targetVal > 0;

              return (
                <div key={t.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${t.color}15` }}>
                        <t.icon className="w-3.5 h-3.5" style={{ color: t.color }} />
                      </div>
                      <span className="text-sm font-medium">{t.label}</span>
                      {isMet && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold" style={{ color: t.color }}>
                        {Math.round(current)}
                      </span>
                      <span className="text-xs text-muted-foreground"> / {targetVal} {t.unit}</span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: isOver ? "#ef4444" : t.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                    {isOver && (
                      <div className="absolute right-1 top-0 bottom-0 flex items-center">
                        <span className="text-[8px] font-bold text-white">+{Math.round(pct - 100)}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{pct}% of goal</span>
                    {isOver && <span className="text-[10px] text-red-500 font-medium">Over target</span>}
                    {isMet && !isOver && <span className="text-[10px] text-emerald-600 font-medium">Goal met!</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Meal Breakdown */}
          {dayLogs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Meals on {format(parseISO(selectedDate), "MMM d")}</p>
              <div className="space-y-1.5">
                {dayLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-muted/30">
                    <span className="font-medium capitalize w-16 shrink-0">{log.meal_type}</span>
                    <span className="flex-1 truncate text-muted-foreground">{log.food_name}</span>
                    <span className="text-amber-600 font-medium">{Math.round(log.calories || 0)} cal</span>
                    <span className="text-red-500">{Math.round(log.protein_g || 0)}p</span>
                    <span className="text-blue-500">{Math.round(log.carbs_g || 0)}c</span>
                    <span className="text-violet-500">{Math.round(log.fat_g || 0)}f</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dayLogs.length === 0 && (
            <div className="mt-4 text-center py-4">
              <p className="text-xs text-muted-foreground">No meals logged for this day</p>
              <p className="text-[10px] text-muted-foreground mt-1">Add nutrition logs to see your progress against goals</p>
            </div>
          )}

          {!goal && (
            <div className="mt-4 p-3 rounded-md bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800">No nutrition goals set yet. Click "Edit Goals" to set your daily targets for calories, protein, carbs, and fat.</p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}