import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Plus, Minus, CheckCircle } from "lucide-react";
import { startOfWeek, parseISO } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";

export default function PTGoals() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [logs, setLogs] = useState([]);
  const [goal, setGoal] = useState(5);
  const [loading, setLoading] = useState(true);

  const storageKey = `pt_weekly_goal${currentMemberId ? `_${currentMemberId}` : ""}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setGoal(parseInt(saved));

    const load = async () => {
      try {
        const data = await base44.entities.ExerciseLog.list("-date", 200);
        const filtered = currentMemberId ? data.filter((l) => l.family_member_id === currentMemberId) : data;
        setLogs(filtered);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId, storageKey]);

  const thisWeekCount = useMemo(() => {
    const weekStart = startOfWeek(new Date());
    return logs.filter((l) => parseISO(l.date) >= weekStart).length;
  }, [logs]);

  const progress = goal > 0 ? Math.min(Math.round((thisWeekCount / goal) * 100), 100) : 0;
  const remaining = Math.max(goal - thisWeekCount, 0);
  const goalReached = thisWeekCount >= goal;

  const adjustGoal = (delta) => {
    const newGoal = Math.max(1, goal + delta);
    setGoal(newGoal);
    localStorage.setItem(storageKey, String(newGoal));
  };

  const setGoalValue = (val) => {
    const n = Math.max(1, parseInt(val) || 1);
    setGoal(n);
    localStorage.setItem(storageKey, String(n));
  };

  if (loading) return null;

  return (
    <Card className="p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-orange-600" /> Weekly Exercise Goal
        </h4>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustGoal(-1)} disabled={goal <= 1}>
            <Minus className="w-3 h-3" />
          </Button>
          <Input
            type="number"
            min="1"
            value={goal}
            onChange={(e) => setGoalValue(e.target.value)}
            className="w-14 h-7 text-center text-sm"
          />
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustGoal(1)}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            This week: <strong className="text-orange-600">{thisWeekCount}</strong> / {goal} sessions
            <span className="text-muted-foreground ml-1">· {currentMemberName}</span>
          </span>
          <span className={`font-medium flex items-center gap-1 ${goalReached ? "text-emerald-600" : "text-muted-foreground"}`}>
            {goalReached ? <><CheckCircle className="w-3 h-3" /> Goal reached!</> : `${remaining} to go`}
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${goalReached ? "bg-emerald-500" : "bg-orange-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {progress}% complete · {goalReached
            ? "Great work — you've hit your weekly target!"
            : `Log ${remaining} more exercise ${remaining === 1 ? "session" : "sessions"} this week to reach your goal.`}
        </p>
      </div>
    </Card>
  );
}