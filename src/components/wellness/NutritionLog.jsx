import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Flame, Apple, Trash2, Target } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import NutritionTrendChart from "@/components/wellness/NutritionTrendChart";
import NutritionGoalSetter from "@/components/wellness/NutritionGoalSetter";

const mealTypes = [
  { value: "breakfast", label: "Breakfast", icon: "🌅", color: "bg-amber-100 text-amber-700" },
  { value: "lunch", label: "Lunch", icon: "☀️", color: "bg-sky-100 text-sky-700" },
  { value: "dinner", label: "Dinner", icon: "🌙", color: "bg-indigo-100 text-indigo-700" },
  { value: "snack", label: "Snack", icon: "🍎", color: "bg-emerald-100 text-emerald-700" },
];

const emptyMeal = { meal_type: "breakfast", food_name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "", notes: "" };

export default function NutritionLog() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyMeal);
  const [saving, setSaving] = useState(false);
  const [healthScore, setHealthScore] = useState(null);
  const [goal, setGoal] = useState(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const load = async () => {
    try {
      const [data, profiles, goals] = await Promise.all([
        base44.entities.NutritionLog.list("-date", 100),
        base44.entities.HealthProfile.filter({}),
        base44.entities.NutritionGoal.list("-created_date", 50),
      ]);
      const filtered = currentMemberId ? data.filter((l) => l.family_member_id === currentMemberId) : data;
      setLogs(filtered);
      if (profiles.length > 0) setHealthScore(profiles[0].health_score);
      const goalMatch = currentMemberId
        ? goals.find((g) => g.family_member_id === currentMemberId)
        : goals.find((g) => !g.family_member_id);
      setGoal(goalMatch || null);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const handleSave = async () => {
    if (!form.food_name.trim() || !form.calories) return;
    setSaving(true);
    try {
      await base44.entities.NutritionLog.create({
        ...form,
        calories: parseInt(form.calories) || 0,
        protein_g: form.protein_g ? parseFloat(form.protein_g) : undefined,
        carbs_g: form.carbs_g ? parseFloat(form.carbs_g) : undefined,
        fat_g: form.fat_g ? parseFloat(form.fat_g) : undefined,
        date: today,
        family_member_id: currentMemberId || undefined,
      });
      setForm(emptyMeal);
      setDialogOpen(false);
      load();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.NutritionLog.delete(id); load(); } catch (e) { console.error(e); }
  };

  const todayMeals = useMemo(() => logs.filter((l) => l.date === today), [logs, today]);
  const todayCalories = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const todayProtein = todayMeals.reduce((s, m) => s + (m.protein_g || 0), 0);
  const todayCarbs = todayMeals.reduce((s, m) => s + (m.carbs_g || 0), 0);
  const todayFat = todayMeals.reduce((s, m) => s + (m.fat_g || 0), 0);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Apple className="w-4 h-4 text-emerald-600" /> Daily Nutrition Log
          </h3>
          <p className="text-xs text-muted-foreground">Tracking for {currentMemberName} · {format(new Date(), "MMM d")}</p>
        </div>
        <NutritionGoalSetter />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1.5" /> Log Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Log a Meal</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Meal Type</Label>
                <Select value={form.meal_type} onValueChange={(v) => setForm({ ...form, meal_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((m) => <SelectItem key={m.value} value={m.value}>{m.icon} {m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Food Name *</Label>
                <Input placeholder="e.g., Grilled chicken salad" value={form.food_name} onChange={(e) => setForm({ ...form, food_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Calories *</Label>
                <Input type="number" placeholder="e.g., 350" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Protein (g)</Label>
                  <Input type="number" placeholder="0" value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Carbs (g)</Label>
                  <Input type="number" placeholder="0" value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Fat (g)</Label>
                  <Input type="number" placeholder="0" value={form.fat_g} onChange={(e) => setForm({ ...form, fat_g: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Input placeholder="Any notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.food_name.trim() || !form.calories || saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Meal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Summary with Goal Progress */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(() => {
          const bars = [
            { label: "Calories", value: todayCalories, max: goal?.calorie_goal, defaultMax: 2000, color: "bg-orange-500", text: "text-orange-600", unit: "" },
            { label: "Protein", value: todayProtein, max: goal?.protein_goal, defaultMax: 50, color: "bg-red-500", text: "text-red-600", unit: "g" },
            { label: "Carbs", value: todayCarbs, max: goal?.carbs_goal, defaultMax: 250, color: "bg-amber-500", text: "text-amber-600", unit: "g" },
            { label: "Fat", value: todayFat, max: goal?.fat_goal, defaultMax: 70, color: "bg-sky-500", text: "text-sky-600", unit: "g" },
          ];
          return bars.map((b) => {
            const max = b.max || b.defaultMax;
            const pct = max > 0 ? Math.min((b.value / max) * 100, 100) : 0;
            const over = b.value > max && max > 0;
            return (
              <Card key={b.label} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground font-medium">{b.label}</p>
                  {goal && <Target className="w-3 h-3 text-emerald-500" />}
                </div>
                <p className={`text-xl font-display font-bold ${b.text}`}>
                  {Math.round(b.value)}<span className="text-xs">/{max}{b.unit}</span>
                </p>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
                  <div className={`h-full rounded-full transition-all duration-500 ${over ? "bg-red-500" : b.color}`} style={{ width: `${pct}%` }} />
                </div>
                {over && <p className="text-[9px] text-red-500 mt-0.5">Over target</p>}
              </Card>
            );
          });
        })()}
      </div>

      {/* Nutrition Trends */}
      <NutritionTrendChart logs={logs} healthScore={healthScore} />

      {/* Today's Meals */}
      <div>
        <h4 className="text-xs font-semibold mb-2">Today's Meals</h4>
        {todayMeals.length === 0 ? (
          <Card className="p-6 text-center">
            <Apple className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No meals logged today</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {todayMeals.map((meal, i) => {
              const mt = mealTypes.find((m) => m.value === meal.meal_type) || mealTypes[3];
              return (
                <motion.div key={meal.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="p-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${mt.color} flex items-center justify-center text-lg shrink-0`}>
                      {mt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{meal.food_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {meal.calories} cal
                        {meal.protein_g ? ` · ${meal.protein_g}g protein` : ""}
                        {meal.carbs_g ? ` · ${meal.carbs_g}g carbs` : ""}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${mt.color}`}>{mt.label}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 shrink-0" onClick={() => handleDelete(meal.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}