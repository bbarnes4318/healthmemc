import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles, CalendarPlus, Dumbbell, Flame, Clock, Target, Plus, Check } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const goals = [
  { value: "build_muscle", label: "Build Muscle", icon: Dumbbell },
  { value: "lose_weight", label: "Lose Weight", icon: Flame },
  { value: "improve_endurance", label: "Improve Endurance", icon: Target },
  { value: "increase_flexibility", label: "Increase Flexibility", icon: Sparkles },
  { value: "general_fitness", label: "General Fitness", icon: Plus },
];

const fitnessLevels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const equipmentOptions = [
  "Bodyweight only", "Dumbbells", "Barbell", "Kettlebell", "Resistance bands",
  "Pull-up bar", "Yoga mat", "Bench", "Machines", "None"
];

const bodyParts = [
  { value: "full_body", label: "Full Body" },
  { value: "knee", label: "Knee" },
  { value: "shoulder", label: "Shoulder" },
  { value: "hip", label: "Hip" },
  { value: "spine", label: "Spine/Back" },
  { value: "neck", label: "Neck" },
  { value: "other", label: "Other" },
];

const intensityColors = { low: "bg-green-100 text-green-700", moderate: "bg-amber-100 text-amber-700", high: "bg-red-100 text-red-700" };
const diffColors = { easy: "bg-green-100 text-green-700", medium: "bg-amber-100 text-amber-700", hard: "bg-red-100 text-red-700" };

export default function AIFitnessPlanner() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [workout, setWorkout] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());
  const [targetDate, setTargetDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [addingAll, setAddingAll] = useState(false);
  const [form, setForm] = useState({
    goal: "build_muscle",
    fitnessLevel: "intermediate",
    duration: "30",
    equipment: "Bodyweight only",
    bodyPart: "full_body",
    notes: "",
  });

  const generateWorkout = async () => {
    setLoading(true);
    setWorkout(null);
    setAddedIds(new Set());
    try {
      const goalLabel = goals.find((g) => g.value === form.goal)?.label || form.goal;
      const bodyPartLabel = bodyParts.find((b) => b.value === form.bodyPart)?.label || form.bodyPart;
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert fitness planner. Create a custom workout plan with the following parameters:
- Primary Goal: ${goalLabel}
- Fitness Level: ${form.fitnessLevel}
- Available Time: ${form.duration} minutes
- Equipment Available: ${form.equipment}
- Target Area: ${bodyPartLabel}
- Additional Notes: ${form.notes || "None"}

Create a structured workout with 4-8 exercises. For each exercise, provide the name, target body part (must be one of: knee, shoulder, hip, spine, ankle, wrist, neck, full_body, other), difficulty (easy, medium, hard), intensity (low, moderate, high), recommended sets, reps, duration in minutes (if time-based), and brief form/safety notes.

Make the workout safe, progressive, and aligned with the user's goals and fitness level. Include a warm-up and cool-down consideration in the summary.`,
        response_json_schema: {
          type: "object",
          properties: {
            workout_title: { type: "string" },
            summary: { type: "string" },
            estimated_calories: { type: "number" },
            exercises: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  exercise_name: { type: "string" },
                  body_part: { type: "string", enum: ["knee", "shoulder", "hip", "spine", "ankle", "wrist", "neck", "full_body", "other"] },
                  difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                  intensity: { type: "string", enum: ["low", "moderate", "high"] },
                  sets: { type: "number" },
                  reps: { type: "number" },
                  duration_minutes: { type: "number" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
      });
      setWorkout(response);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate workout", variant: "destructive" });
    }
    setLoading(false);
  };

  const addExerciseToLog = async (exercise, idx) => {
    try {
      await base44.entities.ExerciseLog.create({
        exercise_name: exercise.exercise_name,
        body_part: exercise.body_part || "full_body",
        difficulty: exercise.difficulty || "medium",
        intensity: exercise.intensity || "moderate",
        sets: exercise.sets || undefined,
        reps: exercise.reps || undefined,
        duration_minutes: exercise.duration_minutes || undefined,
        notes: exercise.notes || undefined,
        date: targetDate,
        family_member_id: currentMemberId || undefined,
      });
      setAddedIds((prev) => new Set(prev).add(idx));
      toast({ title: "Added to calendar", description: `${exercise.exercise_name} logged for ${format(new Date(targetDate), "MMM d")}.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to add exercise", variant: "destructive" });
    }
  };

  const addAllToLog = async () => {
    if (!workout?.exercises?.length) return;
    setAddingAll(true);
    let success = 0;
    for (let i = 0; i < workout.exercises.length; i++) {
      if (addedIds.has(i)) continue;
      try {
        const ex = workout.exercises[i];
        await base44.entities.ExerciseLog.create({
          exercise_name: ex.exercise_name,
          body_part: ex.body_part || "full_body",
          difficulty: ex.difficulty || "medium",
          intensity: ex.intensity || "moderate",
          sets: ex.sets || undefined,
          reps: ex.reps || undefined,
          duration_minutes: ex.duration_minutes || undefined,
          notes: ex.notes || undefined,
          date: targetDate,
          family_member_id: currentMemberId || undefined,
        });
        setAddedIds((prev) => new Set(prev).add(i));
        success++;
      } catch (e) { console.error(e); }
    }
    toast({ title: `${success} exercises added`, description: `Workout logged for ${format(new Date(targetDate), "MMM d")}. View it in your Exercise Calendar.` });
    setAddingAll(false);
  };

  return (
    <div className="space-y-4">
      {/* Planner Form */}
      <Card className="p-5">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-violet-600" />
          AI Workout Planner
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Primary Goal</Label>
            <Select value={form.goal} onValueChange={(v) => setForm({ ...form, goal: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {goals.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Fitness Level</Label>
            <Select value={form.fitnessLevel} onValueChange={(v) => setForm({ ...form, fitnessLevel: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {fitnessLevels.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Available Time (minutes)</Label>
            <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Equipment Available</Label>
            <Select value={form.equipment} onValueChange={(v) => setForm({ ...form, equipment: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {equipmentOptions.map((eq) => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Target Area</Label>
            <Select value={form.bodyPart} onValueChange={(v) => setForm({ ...form, bodyPart: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {bodyParts.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Additional Notes (injuries, preferences, etc.)</Label>
            <Input placeholder="e.g., Avoid jumping, bad left knee" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <Button onClick={generateWorkout} disabled={loading} className="w-full mt-4 bg-violet-600 hover:bg-violet-700">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Custom Workout
        </Button>
      </Card>

      {/* Generated Workout */}
      {workout && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h4 className="font-display font-bold text-sm">{workout.workout_title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{workout.summary}</p>
              </div>
              {workout.estimated_calories > 0 && (
                <div className="text-center shrink-0">
                  <Flame className="w-5 h-5 text-orange-500 mx-auto" />
                  <p className="text-xs font-bold text-orange-600">~{workout.estimated_calories}</p>
                  <p className="text-[9px] text-muted-foreground">calories</p>
                </div>
              )}
            </div>

            {/* Date picker + Add All */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-violet-50 rounded-lg border border-violet-200">
              <CalendarPlus className="w-4 h-4 text-violet-600 shrink-0" />
              <div className="flex-1">
                <Label className="text-[10px] text-violet-700">Add to Exercise Calendar on:</Label>
                <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="h-7 text-xs" />
              </div>
              <Button size="sm" onClick={addAllToLog} disabled={addingAll || addedIds.size === workout.exercises?.length} className="bg-violet-600 hover:bg-violet-700 shrink-0">
                {addingAll ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                Add All
              </Button>
            </div>

            {/* Exercise List */}
            <div className="space-y-2">
              {workout.exercises?.map((ex, i) => {
                const added = addedIds.has(i);
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className={`p-3 rounded-lg border transition ${added ? "border-emerald-300 bg-emerald-50" : "border-border"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg ${added ? "bg-emerald-100" : "bg-violet-100"} flex items-center justify-center shrink-0`}>
                          {added ? <Check className="w-4 h-4 text-emerald-600" /> : <Dumbbell className="w-4 h-4 text-violet-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{ex.exercise_name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${diffColors[ex.difficulty] || diffColors.medium}`}>{ex.difficulty}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${intensityColors[ex.intensity] || intensityColors.moderate}`}>{ex.intensity}</span>
                            {ex.sets > 0 && <span className="text-[10px] text-muted-foreground">{ex.sets} sets × {ex.reps || ""} reps</span>}
                            {ex.duration_minutes > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{ex.duration_minutes}min</span>}
                          </div>
                          {ex.notes && <p className="text-[10px] text-muted-foreground mt-1">{ex.notes}</p>}
                        </div>
                        {!added && (
                          <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => addExerciseToLog(ex, i)}>
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}