import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Calendar, Moon, Utensils, Pill, Sparkles, AlertCircle } from "lucide-react";
import FormattedAIResponse from "@/components/ui/FormattedAIResponse";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format } from "date-fns";

export default function DosageTimingCalculator() {
  const { currentMemberId } = useFamilyMember();
  const [medications, setMedications] = useState([]);
  const [journals, setJournals] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const today = format(new Date(), "yyyy-MM-dd");
        const [meds, wellness, nutrition] = await Promise.all([
          base44.entities.Medication.filter({ active: true }),
          base44.entities.WellnessJournal.list("-date", 7),
          base44.entities.NutritionLog.filter({ date: today }),
        ]);
        const filteredMeds = currentMemberId
          ? meds.filter((m) => m.active && (m.family_member_id === currentMemberId || !m.family_member_id))
          : meds.filter((m) => m.active);
        const filteredJournals = currentMemberId
          ? wellness.filter((j) => j.family_member_id === currentMemberId || !j.family_member_id)
          : wellness;
        const filteredMeals = currentMemberId
          ? nutrition.filter((n) => n.family_member_id === currentMemberId || !n.family_member_id)
          : nutrition;
        setMedications(filteredMeds);
        setJournals(filteredJournals);
        setMeals(filteredMeals);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  const analyze = async () => {
    setAnalyzing(true);
    setResult(null);
    try {
      const medList = medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        time_of_day: m.time_of_day || [],
        notes: m.notes || "",
        prescribing_provider: m.prescribing_provider || "",
      }));

      const sleepData = journals.map((j) => ({
        date: j.date,
        sleep_hours: j.sleep_hours,
        sleep_quality: j.sleep_quality,
      }));

      const mealData = meals.map((m) => ({
        meal_type: m.meal_type,
        food_name: m.food_name,
      }));

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a medication timing optimizer. Based on the patient's medications, sleep patterns, and meal schedule, suggest the optimal times to take each medication throughout the day.

PATIENT'S ACTIVE MEDICATIONS:
${JSON.stringify(medList, null, 2)}

RECENT SLEEP DATA (last 7 days):
${JSON.stringify(sleepData, null, 2)}

TODAY'S MEALS:
${JSON.stringify(mealData, null, 2)}

INSTRUCTIONS:
1. Create a personalized daily medication schedule with specific clock times.
2. Consider:
   - Sleep/wake times (if sleep data shows late waking, adjust morning meds)
   - Meal times (some meds need food, others need empty stomach)
   - Medication interactions (space out conflicting meds)
   - Frequency requirements (BID = twice daily ~12h apart, TID = three times daily ~8h apart)
3. For each medication, provide:
   - Recommended time(s)
   - Whether to take with food or on empty stomach
   - Why this timing was chosen
   - Any special instructions
4. Provide a daily timeline summary (morning, afternoon, evening, bedtime)
5. Flag any timing conflicts or concerns

Format your response in clear markdown with headers and a timeline table.`,
        model: "claude_sonnet_4_6",
      });
      setResult(response);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  if (loading) {
    return (
      <Card className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
      </Card>
    );
  }

  const avgSleep = journals.length > 0
    ? (journals.reduce((s, j) => s + (j.sleep_hours || 0), 0) / journals.filter((j) => j.sleep_hours).length).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="font-semibold text-sm">Dosage Timing Optimizer</h3>
            <p className="text-xs text-muted-foreground">AI-powered medication schedule based on your sleep and meal patterns</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <Pill className="w-4 h-4 text-amber-600 mb-1" />
            <p className="text-lg font-bold text-amber-700">{medications.length}</p>
            <p className="text-[10px] text-muted-foreground">Active Meds</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <Moon className="w-4 h-4 text-indigo-600 mb-1" />
            <p className="text-lg font-bold text-indigo-700">{avgSleep || "—"}h</p>
            <p className="text-[10px] text-muted-foreground">Avg Sleep</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <Utensils className="w-4 h-4 text-emerald-600 mb-1" />
            <p className="text-lg font-bold text-emerald-700">{meals.length}</p>
            <p className="text-[10px] text-muted-foreground">Meals Today</p>
          </div>
        </div>

        {medications.length === 0 ? (
          <div className="text-center py-6">
            <Pill className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No active medications found.</p>
            <p className="text-xs text-muted-foreground mt-1">Add medications in the "My Meds" tab to get timing suggestions.</p>
          </div>
        ) : (
          <Button onClick={analyze} disabled={analyzing} className="w-full bg-amber-600 hover:bg-amber-700">
            {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {analyzing ? "Analyzing your routine..." : "Generate Optimal Schedule"}
          </Button>
        )}
      </Card>

      {result && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-semibold">Your Personalized Medication Schedule</h4>
          </div>
          <FormattedAIResponse content={result} theme="amber" />
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 mt-4">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              These suggestions are AI-generated based on your routine. Always follow your doctor's prescribing instructions and consult them before changing medication timing.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}