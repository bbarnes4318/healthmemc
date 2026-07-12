import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Flame, Drumstick, Droplet, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";

function ProgressBar({ value, max, color, label, icon: Icon, unit }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const over = value > max && max > 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          {label}
        </span>
        <span className="text-xs font-semibold">
          {Math.round(value)}<span className="text-muted-foreground font-normal">/{max}{unit}</span>
          {over && <span className="text-red-500 ml-1">⚠</span>}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? "bg-red-500" : color.replace("text-", "bg-")}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function NutritionProgressBars() {
  const { currentMemberId } = useFamilyMember();
  const [logs, setLogs] = useState([]);
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [allLogs, goals] = await Promise.all([
          base44.entities.NutritionLog.list("-date", 100),
          base44.entities.NutritionGoal.list("-created_date", 50),
        ]);
        const filtered = currentMemberId ? allLogs.filter((l) => l.family_member_id === currentMemberId) : allLogs.filter((l) => !l.family_member_id);
        setLogs(filtered);
        const match = currentMemberId
          ? goals.find((g) => g.family_member_id === currentMemberId)
          : goals.find((g) => !g.family_member_id);
        setGoal(match || { calorie_goal: 2000, protein_goal: 50, fat_goal: 70, carbs_goal: 250 });
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayMeals = useMemo(() => logs.filter((l) => l.date === today), [logs, today]);
  const todayCalories = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const todayProtein = todayMeals.reduce((s, m) => s + (m.protein_g || 0), 0);
  const todayFat = todayMeals.reduce((s, m) => s + (m.fat_g || 0), 0);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /></div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Today's Nutrition Goals
        </h3>
        <span className="text-[10px] text-muted-foreground">{format(new Date(), "MMM d")}</span>
      </div>
      <div className="space-y-3">
        <ProgressBar value={todayCalories} max={goal?.calorie_goal || 2000} color="text-orange-500" label="Calories" icon={Flame} unit="kcal" />
        <ProgressBar value={todayProtein} max={goal?.protein_goal || 50} color="text-red-500" label="Protein" icon={Drumstick} unit="g" />
        <ProgressBar value={todayFat} max={goal?.fat_goal || 70} color="text-sky-500" label="Fat" icon={Droplet} unit="g" />
      </div>
    </Card>
  );
}