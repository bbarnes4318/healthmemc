import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Flame, Apple, Trash2, TrendingUp, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useFamilyMember } from "@/context/FamilyMemberContext";

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

  const today = format(new Date(), "yyyy-MM-dd");

  const load = async () => {
    try {
      const [data, profiles] = await Promise.all([
        base44.entities.NutritionLog.list("-date", 100),
        base44.entities.HealthProfile.filter({}),
      ]);
      const filtered = currentMemberId ? data.filter((l) => l.family_member_id === currentMemberId) : data;
      setLogs(filtered);
      if (profiles.length > 0) setHealthScore(profiles[0].health_score);
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

  const calorieTrend = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayLogs = logs.filter((l) => l.date === format(d, "yyyy-MM-dd"));
      return {
        day: format(d, "EEE"),
        calories: dayLogs.reduce((s, m) => s + (m.calories || 0), 0),
      };
    });
  }, [logs]);

  const avgCalories = Math.round(calorieTrend.reduce((s, d) => s + d.calories, 0) / 7);

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

      {/* Today's Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <p className="text-xs text-muted-foreground font-medium">Calories</p>
          </div>
          <p className="text-xl font-display font-bold text-orange-600">{todayCalories}</p>
          <p className="text-[10px] text-muted-foreground">avg {avgCalories}/day</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded bg-red-400" />
            <p className="text-xs text-muted-foreground font-medium">Protein</p>
          </div>
          <p className="text-xl font-display font-bold text-red-600">{Math.round(todayProtein)}<span className="text-xs">g</span></p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded bg-amber-400" />
            <p className="text-xs text-muted-foreground font-medium">Carbs</p>
          </div>
          <p className="text-xl font-display font-bold text-amber-600">{Math.round(todayCarbs)}<span className="text-xs">g</span></p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded bg-sky-400" />
            <p className="text-xs text-muted-foreground font-medium">Fat</p>
          </div>
          <p className="text-xl font-display font-bold text-sky-600">{Math.round(todayFat)}<span className="text-xs">g</span></p>
        </Card>
      </div>

      {/* Calorie Trend */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> 7-Day Calorie Trend</h4>
          {healthScore && (
            <div className="flex items-center gap-2 text-xs">
              <Activity className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-muted-foreground">Health Score:</span>
              <span className="font-bold text-violet-600">{healthScore}</span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={calorieTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

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