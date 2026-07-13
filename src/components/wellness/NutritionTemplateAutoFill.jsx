import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  Loader2, Sparkles, Check, ChevronRight, Target, Flame, Beef, Wheat,
  Droplet, Wand2, TrendingUp, Activity, Heart, Zap, Apple
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const mealTypeConfig = {
  breakfast: { label: "Breakfast", icon: "🌅", color: "bg-amber-100 text-amber-700" },
  lunch: { label: "Lunch", icon: "☀️", color: "bg-sky-100 text-sky-700" },
  dinner: { label: "Dinner", icon: "🌙", color: "bg-indigo-100 text-indigo-700" },
  snack: { label: "Snack", icon: "🍎", color: "bg-emerald-100 text-emerald-700" },
};

export default function NutritionTemplateAutoFill({ onMealsAdded }) {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [goals, setGoals] = useState(null);
  const [profile, setProfile] = useState(null);
  const [exerciseLogs, setExerciseLogs] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [applying, setApplying] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const memberFilter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const [tpls, goalData, profiles, exercises, todayMeals] = await Promise.all([
        base44.entities.NutritionMealTemplate.list("-created_date", 50),
        base44.entities.NutritionGoal.filter(memberFilter).then((r) => r[0] || null),
        base44.entities.HealthProfile.filter(memberFilter).then((r) => r[0] || null),
        base44.entities.ExerciseLog.filter(memberFilter, "-date", 30),
        base44.entities.NutritionLog.filter({ ...memberFilter, date: today }),
      ]);

      const filteredTpls = currentMemberId
        ? tpls.filter((t) => t.family_member_id === currentMemberId || !t.family_member_id)
        : tpls;
      setTemplates(filteredTpls);
      setGoals(goalData);
      setProfile(profiles);
      setExerciseLogs(exercises);
      setTodayLogs(todayMeals);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentMemberId, today]);

  useEffect(() => { load(); }, [load]);

  // Analyze user's health context to generate recommendations
  const healthContext = useMemo(() => {
    const ctx = {
      calorieGoal: goals?.calorie_goal || 2000,
      proteinGoal: goals?.protein_goal || 50,
      carbsGoal: goals?.carbs_goal || 250,
      fatGoal: goals?.fat_goal || 70,
      isDiabetic: false,
      isHeartCondition: false,
      isActive: false,
      wantsHighProtein: false,
      wantsLowCarb: false,
      wantsLowFat: false,
      conditions: [],
    };

    if (profile?.chronic_conditions) {
      const conditions = profile.chronic_conditions.map((c) => c.toLowerCase());
      ctx.conditions = profile.chronic_conditions;
      if (conditions.some((c) => c.includes("diabet"))) {
        ctx.isDiabetic = true;
        ctx.wantsLowCarb = true;
      }
      if (conditions.some((c) => c.includes("heart") || c.includes("hypertension") || c.includes("cholesterol"))) {
        ctx.isHeartCondition = true;
        ctx.wantsLowFat = true;
      }
    }

    // Active lifestyle check
    const recentExercises = exerciseLogs.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      const daysAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    });
    if (recentExercises.length >= 3) {
      ctx.isActive = true;
      ctx.wantsHighProtein = true;
    }

    // High protein ratio goal
    if (ctx.proteinGoal > 0 && ctx.calorieGoal > 0) {
      const proteinCaloriePct = (ctx.proteinGoal * 4 / ctx.calorieGoal) * 100;
      if (proteinCaloriePct > 25) ctx.wantsHighProtein = true;
    }

    return ctx;
  }, [goals, profile, exerciseLogs]);

  // Score templates based on health context
  const scoredTemplates = useMemo(() => {
    return templates.map((tpl) => {
      let score = 50;
      const reasons = [];

      const calories = tpl.calories || 0;
      const protein = tpl.protein_g || 0;
      const carbs = tpl.carbs_g || 0;
      const fat = tpl.fat_g || 0;

      // High protein preference
      if (healthContext.wantsHighProtein) {
        if (protein >= 20) { score += 20; reasons.push("High protein"); }
        else if (protein >= 10) { score += 8; }
      }

      // Low carb preference (diabetic)
      if (healthContext.wantsLowCarb) {
        if (carbs <= 15) { score += 18; reasons.push("Low carb"); }
        else if (carbs <= 30) { score += 5; }
        else if (carbs > 50) { score -= 15; reasons.push("High carb"); }
      }

      // Low fat preference (heart condition)
      if (healthContext.wantsLowFat) {
        if (fat <= 5) { score += 15; reasons.push("Low fat"); }
        else if (fat > 15) { score -= 10; }
      }

      // Active lifestyle — higher calorie meals
      if (healthContext.isActive && calories >= 400) {
        score += 10; reasons.push("Energy-dense");
      }

      // Calorie fit — meals that fit well into daily goal
      const mealsPerDay = 4;
      const targetPerMeal = healthContext.calorieGoal / mealsPerDay;
      const calorieDiff = Math.abs(calories - targetPerMeal);
      if (calorieDiff < 100) { score += 10; }
      else if (calorieDiff > 300) { score -= 8; }

      score = Math.max(0, Math.min(100, score));

      return { ...tpl, score, reasons, matchLevel: score >= 70 ? "high" : score >= 50 ? "medium" : "low" };
    }).sort((a, b) => b.score - a.score);
  }, [templates, healthContext]);

  // Already logged today
  const todayTotals = useMemo(() => {
    return todayLogs.reduce((acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (log.protein_g || 0),
      carbs: acc.carbs + (log.carbs_g || 0),
      fat: acc.fat + (log.fat_g || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todayLogs]);

  // Selected totals
  const selectedTotals = useMemo(() => {
    const selectedTpls = scoredTemplates.filter((t) => selected.has(t.id));
    return selectedTpls.reduce((acc, tpl) => ({
      calories: acc.calories + (tpl.calories || 0),
      protein: acc.protein + (tpl.protein_g || 0),
      carbs: acc.carbs + (tpl.carbs_g || 0),
      fat: acc.fat + (tpl.fat_g || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [selected, scoredTemplates]);

  const projectedTotals = {
    calories: todayTotals.calories + selectedTotals.calories,
    protein: todayTotals.protein + selectedTotals.protein,
    carbs: todayTotals.carbs + selectedTotals.carbs,
    fat: todayTotals.fat + selectedTotals.fat,
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAutoSelect = () => {
    // Auto-select best templates to fill the day (one per meal type)
    const byMealType = {};
    scoredTemplates.forEach((t) => {
      const mt = t.meal_type || "snack";
      if (!byMealType[mt] || byMealType[mt].score < t.score) byMealType[mt] = t;
    });
    const best = Object.values(byMealType);
    setSelected(new Set(best.map((t) => t.id)));
    toast({ title: "Smart selection applied", description: `${best.length} templates matched to your goals.` });
  };

  const handleApply = async () => {
    const selectedTpls = scoredTemplates.filter((t) => selected.has(t.id));
    if (selectedTpls.length === 0) return;
    setApplying(true);
    try {
      await base44.entities.NutritionLog.bulkCreate(
        selectedTpls.map((tpl) => ({
          meal_type: tpl.meal_type,
          food_name: tpl.food_name,
          calories: tpl.calories,
          protein_g: tpl.protein_g || undefined,
          carbs_g: tpl.carbs_g || undefined,
          fat_g: tpl.fat_g || undefined,
          notes: tpl.notes,
          date: today,
          family_member_id: currentMemberId || undefined,
        }))
      );
      toast({ title: "Meals added!", description: `${selectedTpls.length} template meal${selectedTpls.length > 1 ? "s" : ""} added to today's log.` });
      setSelected(new Set());
      if (onMealsAdded) onMealsAdded();
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to add meals", variant: "destructive" });
    }
    setApplying(false);
  };

  if (loading) {
    return (
      <Card className="p-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Wand2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No saved meal templates yet</p>
        <p className="text-xs text-muted-foreground mt-1">Save meal templates first to enable smart auto-fill.</p>
      </Card>
    );
  }

  const goalStats = [
    { label: "Calories", current: projectedTotals.calories, goal: healthContext.calorieGoal, unit: "", color: "bg-orange-500", icon: Flame },
    { label: "Protein", current: projectedTotals.protein, goal: healthContext.proteinGoal, unit: "g", color: "bg-red-500", icon: Beef },
    { label: "Carbs", current: projectedTotals.carbs, goal: healthContext.carbsGoal, unit: "g", color: "bg-amber-500", icon: Wheat },
    { label: "Fat", current: projectedTotals.fat, goal: healthContext.fatGoal, unit: "g", color: "bg-sky-500", icon: Droplet },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Smart Template Auto-Fill</h3>
            <p className="text-xs text-muted-foreground">Select templates matched to your health & fitness goals</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleAutoSelect} className="h-8 text-xs">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Auto-Select Best Match
        </Button>
      </div>

      {/* Health context badges */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span className="text-[10px] font-medium text-muted-foreground uppercase">Your Profile:</span>
        {healthContext.isActive && (
          <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-[10px]">
            <Activity className="w-2.5 h-2.5 mr-0.5" /> Active Lifestyle
          </Badge>
        )}
        {healthContext.wantsHighProtein && (
          <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
            <Beef className="w-2.5 h-2.5 mr-0.5" /> High Protein Target
          </Badge>
        )}
        {healthContext.isDiabetic && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
            <Apple className="w-2.5 h-2.5 mr-0.5" /> Low Carb Focus
          </Badge>
        )}
        {healthContext.isHeartCondition && (
          <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px]">
            <Heart className="w-2.5 h-2.5 mr-0.5" /> Heart-Healthy
          </Badge>
        )}
        {!healthContext.isActive && !healthContext.wantsHighProtein && !healthContext.isDiabetic && !healthContext.isHeartCondition && (
          <Badge variant="outline" className="text-[10px]">General Wellness</Badge>
        )}
      </div>

      {/* Goal progress bars */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {goalStats.map((stat) => {
          const pct = stat.goal > 0 ? Math.min(100, Math.round((stat.current / stat.goal) * 100)) : 0;
          const overGoal = stat.current > stat.goal && stat.goal > 0;
          const GIcon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg bg-muted/30 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <GIcon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">{stat.label}</span>
                </div>
                <span className={`text-[10px] font-bold ${overGoal ? "text-amber-600" : "text-foreground"}`}>{pct}%</span>
              </div>
              <p className="text-xs font-semibold">
                {Math.round(stat.current)}<span className="text-muted-foreground"> / {stat.goal}{stat.unit}</span>
              </p>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                <div className={`h-full rounded-full ${overGoal ? "bg-amber-500" : stat.color} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Template list */}
      <div className="space-y-2 mb-4">
        {scoredTemplates.map((tpl, i) => {
          const isSelected = selected.has(tpl.id);
          const mt = mealTypeConfig[tpl.meal_type] || mealTypeConfig.snack;
          return (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <button
                onClick={() => toggleSelect(tpl.id)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  isSelected ? "border-emerald-500 bg-emerald-50" : "border-border bg-card hover:border-emerald-200 hover:bg-muted/30"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg ${mt.color} flex items-center justify-center text-base shrink-0`}>
                  {mt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold truncate">{tpl.template_name}</p>
                    {tpl.matchLevel === "high" && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px] shrink-0">
                        <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> Best Match
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{tpl.food_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{tpl.calories} cal</span>
                    {tpl.protein_g ? <span className="text-[10px] text-red-500">{tpl.protein_g}g P</span> : null}
                    {tpl.carbs_g ? <span className="text-[10px] text-amber-600">{tpl.carbs_g}g C</span> : null}
                    {tpl.fat_g ? <span className="text-[10px] text-sky-500">{tpl.fat_g}g F</span> : null}
                    {tpl.reasons.length > 0 && (
                      <span className="text-[9px] text-emerald-600 italic">· {tpl.reasons.join(", ")}</span>
                    )}
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                  isSelected ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/30"
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Apply button */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div>
                <p className="text-xs font-semibold text-emerald-800">
                  {selected.size} meal{selected.size > 1 ? "s" : ""} selected
                </p>
                <p className="text-[10px] text-emerald-600">
                  +{Math.round(selectedTotals.calories)} cal · {Math.round(selectedTotals.protein)}g protein · {Math.round(selectedTotals.carbs)}g carbs
                </p>
              </div>
              <Button size="sm" onClick={handleApply} disabled={applying} className="bg-emerald-600 hover:bg-emerald-700">
                {applying ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
                Add to Today's Log
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}