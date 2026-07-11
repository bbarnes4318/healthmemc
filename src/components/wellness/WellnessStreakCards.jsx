import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Pill, Dumbbell, Plus, Minus, Flame, Trophy, Loader2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const WATER_GOAL = 8;

export default function WellnessStreakCards() {
  const { currentMemberId } = useFamilyMember();
  const [waterLogs, setWaterLogs] = useState([]);
  const [medLogs, setMedLogs] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waterAction, setWaterAction] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const loadData = async () => {
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const medFilter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
      const [water, meds, exercise, medList] = await Promise.all([
        base44.entities.WellnessLog.filter(filter),
        currentMemberId
          ? base44.entities.MedicationLog.filter({ family_member_id: currentMemberId })
          : base44.entities.MedicationLog.filter({}),
        base44.entities.ExerciseLog.filter(filter),
        base44.entities.Medication.filter(medFilter),
      ]);
      setWaterLogs(water);
      setMedLogs(meds);
      setExerciseLogs(exercise);
      setMedications(medList);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [currentMemberId]);

  const isWaterMet = (dateStr) => {
    const log = waterLogs.find((l) => l.date === dateStr);
    return !!(log && log.water_cups >= WATER_GOAL);
  };

  const isMedsMet = (dateStr) => {
    if (medications.length === 0) return null;
    const dayLogs = medLogs.filter((l) => l.scheduled_date === dateStr);
    return medications.every((med) =>
      dayLogs.some((l) => l.medication_name === med.name && l.status === "taken")
    );
  };

  const isExerciseMet = (dateStr) => {
    return exerciseLogs.some((l) => l.date === dateStr);
  };

  const calcStreak = (goalFn) => {
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
      const met = goalFn(dateStr);
      if (met === true) streak++;
      else if (met === false && i > 0) break;
    }
    return streak;
  };

  const getBadges = (goalFn, weeks = 4) => {
    const badges = [];
    for (let w = 0; w < weeks; w++) {
      const ref = subDays(new Date(), w * 7);
      const weekStart = startOfWeek(ref);
      const weekEnd = endOfWeek(ref);
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      let metCount = 0;
      days.forEach((d) => {
        if (goalFn(format(d, "yyyy-MM-dd")) === true) metCount++;
      });
      badges.push({ metDays: metCount, totalDays: 7, completed: metCount === 7 });
    }
    return badges;
  };

  const adjustWater = async (delta) => {
    setWaterAction(true);
    try {
      const existing = waterLogs.find((l) => l.date === today);
      if (existing) {
        const newCups = Math.max(0, (existing.water_cups || 0) + delta);
        await base44.entities.WellnessLog.update(existing.id, { water_cups: newCups });
      } else if (delta > 0) {
        await base44.entities.WellnessLog.create({
          date: today,
          water_cups: delta,
          family_member_id: currentMemberId || undefined,
        });
      }
      await loadData();
    } catch (e) { console.error(e); }
    setWaterAction(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
      </div>
    );
  }

  const todayWater = waterLogs.find((l) => l.date === today)?.water_cups || 0;
  const todayMedsTaken = medications.length > 0
    ? medications.filter((med) =>
        medLogs.some((l) => l.medication_name === med.name && l.scheduled_date === today && l.status === "taken")
      ).length
    : 0;
  const todayExercise = exerciseLogs.some((l) => l.date === today);

  const waterStreak = calcStreak(isWaterMet);
  const medsStreak = calcStreak(isMedsMet);
  const exerciseStreak = calcStreak(isExerciseMet);

  const waterBadges = getBadges(isWaterMet);
  const medsBadges = getBadges(isMedsMet);
  const exerciseBadges = getBadges(isExerciseMet);

  const totalBadges = [...waterBadges, ...medsBadges, ...exerciseBadges].filter((b) => b.completed).length;

  const cards = [
    {
      key: "water",
      title: "Water",
      icon: Droplets,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      ring: "ring-cyan-200",
      todayValue: `${todayWater}`,
      todayGoal: `/${WATER_GOAL}`,
      todayUnit: "cups",
      met: todayWater >= WATER_GOAL,
      streak: waterStreak,
      badges: waterBadges,
      action: (
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 rounded-full border-cyan-300 text-cyan-600"
            onClick={() => adjustWater(-1)}
            disabled={waterAction || todayWater === 0}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 rounded-full border-cyan-300 text-cyan-600 hover:bg-cyan-50"
            onClick={() => adjustWater(1)}
            disabled={waterAction}
          >
            {waterAction ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          </Button>
        </div>
      ),
      link: null,
    },
    {
      key: "meds",
      title: "Medications",
      icon: Pill,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
      todayValue: medications.length > 0 ? `${todayMedsTaken}` : "—",
      todayGoal: medications.length > 0 ? `/${medications.length}` : "",
      todayUnit: medications.length > 0 ? "taken" : "no meds",
      met: medications.length > 0 && todayMedsTaken === medications.length,
      streak: medsStreak,
      badges: medsBadges,
      action: null,
      link: "/pharmacy",
      linkLabel: "Manage meds",
    },
    {
      key: "exercise",
      title: "Exercise",
      icon: Dumbbell,
      color: "text-orange-600",
      bg: "bg-orange-50",
      ring: "ring-orange-200",
      todayValue: todayExercise ? "✓" : "0",
      todayGoal: "/1",
      todayUnit: todayExercise ? "done" : "not yet",
      met: todayExercise,
      streak: exerciseStreak,
      badges: exerciseBadges,
      action: null,
      link: "/wellness",
      linkLabel: "Log exercise",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-display font-semibold flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Wellness Streaks
        </h2>
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-600">{totalBadges}</span>
          <span className="text-xs text-muted-foreground">weekly badges earned</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Card className={`p-4 h-full ${card.met ? `ring-1 ${card.ring}` : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm">{card.title}</h3>
                </div>
                {card.action}
              </div>

              <div className="flex items-end gap-1 mb-3">
                <span className={`text-2xl font-display font-bold ${card.met ? card.color : "text-foreground"}`}>
                  {card.todayValue}
                </span>
                {card.todayGoal && <span className="text-sm text-muted-foreground mb-1">{card.todayGoal}</span>}
                <span className="text-xs text-muted-foreground mb-1 ml-1">{card.todayUnit}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Flame className={`w-4 h-4 ${card.streak > 0 ? "text-orange-500" : "text-muted-foreground/30"}`} />
                  <span className="text-sm font-medium">{card.streak}</span>
                  <span className="text-xs text-muted-foreground">day streak</span>
                </div>
                <div className="flex gap-1">
                  {card.badges.map((badge, bi) => (
                    <div
                      key={bi}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        badge.completed ? "bg-amber-400 text-white" : "bg-muted text-muted-foreground/50"
                      }`}
                      title={`Week ${bi + 1}: ${badge.metDays}/${badge.totalDays} days met`}
                    >
                      {badge.metDays}
                    </div>
                  ))}
                </div>
              </div>

              {card.link && (
                <Link
                  to={card.link}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition"
                >
                  {card.linkLabel}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}