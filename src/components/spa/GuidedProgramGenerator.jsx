import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import FormattedAIResponse from "@/components/ui/FormattedAIResponse";
import { motion } from "framer-motion";
import { format, subDays, parseISO, isAfter } from "date-fns";
import { Wind, Brain, Heart, Moon, Sparkles, Loader2, Play, Calendar, CheckCircle2 } from "lucide-react";

const programTypes = [
  { key: "relaxation", label: "Guided Relaxation", icon: Wind, color: "from-teal-400 to-cyan-500", desc: "Deep breathing & progressive muscle relaxation" },
  { key: "meditation", label: "Meditation", icon: Brain, color: "from-purple-400 to-indigo-500", desc: "Mindfulness & guided visualization" },
  { key: "stress_reduction", label: "Stress Reduction", icon: Heart, color: "from-rose-400 to-pink-500", desc: "Targeted techniques for high-stress periods" },
  { key: "sleep", label: "Sleep Enhancement", icon: Moon, color: "from-indigo-400 to-blue-500", desc: "Evening wind-down & sleep-promoting rituals" },
];

export default function GuidedProgramGenerator() {
  const [journals, setJournals] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [program, setProgram] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.WellnessJournal.list("-date", 30);
        setJournals(data);
      } catch (e) { console.error(e); }
      setLoadingData(false);
    };
    load();
  }, []);

  const buildContext = () => {
    const recent = journals.slice(0, 14);
    if (recent.length === 0) return "No mood journal entries available. Create a general program suitable for anyone.";

    const avgMood = (recent.reduce((s, j) => s + (j.mood_score || 3), 0) / recent.length).toFixed(1);
    const avgStress = (recent.reduce((s, j) => s + (j.stress_score || 3), 0) / recent.length).toFixed(1);
    const sleepEntries = recent.filter((j) => j.sleep_hours != null);
    const avgSleep = sleepEntries.length > 0 ? (sleepEntries.reduce((s, j) => s + j.sleep_hours, 0) / sleepEntries.length).toFixed(1) : "unknown";
    const moodLabels = { 1: "poor", 2: "low", 3: "okay", 4: "good", 5: "great" };
    const stressLabels = { 1: "minimal", 2: "low", 3: "moderate", 4: "high", 5: "severe" };
    const sleepLabels = { 1: "terrible", 2: "poor", 3: "fair", 4: "good", 5: "excellent" };

    const latest = recent[0];
    const trends = [];
    if (recent.length >= 7) {
      const last7 = recent.slice(0, 7);
      const prev7 = recent.slice(7, 14);
      const last7Mood = last7.reduce((s, j) => s + (j.mood_score || 3), 0) / last7.length;
      const prev7Mood = prev7.length > 0 ? prev7.reduce((s, j) => s + (j.mood_score || 3), 0) / prev7.length : last7Mood;
      if (last7Mood < prev7Mood - 0.3) trends.push("Mood has been declining over the past week");
      if (last7Mood > prev7Mood + 0.3) trends.push("Mood has been improving over the past week");
    }

    return `USER WELLNESS DATA (last ${recent.length} journal entries):
- Average mood score: ${avgMood}/5 (${moodLabels[Math.round(avgMood)] || "okay"})
- Average stress level: ${avgStress}/5 (${stressLabels[Math.round(avgStress)] || "moderate"})
- Average sleep hours: ${avgSleep}h
- Latest mood: ${moodLabels[latest?.mood_score] || "okay"}, Latest stress: ${stressLabels[latest?.stress_score] || "moderate"}, Latest sleep quality: ${sleepLabels[latest?.sleep_score] || "fair"} (${latest?.sleep_hours || "unknown"}h)
${trends.length > 0 ? `- Trends: ${trends.join("; ")}` : ""}
- Recent notes: ${recent.slice(0, 5).map((j) => j.notes).filter(Boolean).join(" | ") || "none provided"}`;
  };

  const generateProgram = async (typeKey) => {
    const type = programTypes.find((t) => t.key === typeKey);
    if (!type) return;
    setSelectedType(typeKey);
    setGenerating(true);
    setProgram(null);
    try {
      const context = buildContext();
      const typePrompts = {
        relaxation: "Create a guided relaxation program with step-by-step breathing exercises, progressive muscle relaxation, and grounding techniques. Include specific durations for each step.",
        meditation: "Create a guided meditation program with mindfulness exercises, body scan, and visualization. Include specific instructions for posture, breathing, and focus.",
        stress_reduction: "Create a stress reduction program with targeted techniques for the user's current stress level. Include coping strategies, reframing exercises, and quick stress-relief tools.",
        sleep: "Create a sleep enhancement program with an evening wind-down routine, sleep-promoting rituals, and techniques to improve sleep quality based on the user's sleep data.",
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI Wellness Spa consultant specializing in personalized wellness programs. Based on the user's actual mood journal and sleep data below, create a personalized ${type.label.toLowerCase()} program.

${context}

${typePrompts[typeKey]}

Format the response in Markdown with these sections:
## Your Wellness Snapshot
Brief summary of their current state based on the data (2-3 sentences).

## Personalized ${type.label} Program
### Step 1: [Name] (X min)
[Detailed instructions]
### Step 2: [Name] (X min)
[Detailed instructions]
(Include 4-6 steps)

## Why This Works for You
Explain how this program addresses their specific mood, stress, and sleep patterns.

## Daily Practice Tips
2-3 tips for incorporating this into their routine.

Keep the tone warm, calming, and encouraging. Be specific and actionable — no vague advice. Reference their actual data points where relevant.`,
      });
      setProgram(response);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate program", variant: "destructive" });
    }
    setGenerating(false);
  };

  const dataSummary = () => {
    if (journals.length === 0) return null;
    const recent = journals.slice(0, 14);
    const avgMood = recent.reduce((s, j) => s + (j.mood_score || 3), 0) / recent.length;
    const avgStress = recent.reduce((s, j) => s + (j.stress_score || 3), 0) / recent.length;
    const sleepEntries = recent.filter((j) => j.sleep_hours != null);
    const avgSleep = sleepEntries.length > 0 ? sleepEntries.reduce((s, j) => s + j.sleep_hours, 0) / sleepEntries.length : null;
    return { avgMood, avgStress, avgSleep, count: recent.length };
  };

  const summary = dataSummary();

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-sm">AI-Guided Wellness Programs</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Personalized relaxation, meditation & stress-reduction programs based on your mood journal and sleep data</p>
        </div>

        {/* Data Summary */}
        {loadingData ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-purple-600" /></div>
        ) : summary ? (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-2 bg-purple-50 rounded-lg">
              <p className="text-lg font-bold text-purple-600">{summary.avgMood.toFixed(1)}</p>
              <p className="text-[9px] text-muted-foreground">Avg Mood</p>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-600">{summary.avgStress.toFixed(1)}</p>
              <p className="text-[9px] text-muted-foreground">Avg Stress</p>
            </div>
            <div className="text-center p-2 bg-indigo-50 rounded-lg">
              <p className="text-lg font-bold text-indigo-600">{summary.avgSleep ? summary.avgSleep.toFixed(1) : "—"}</p>
              <p className="text-[9px] text-muted-foreground">Avg Sleep (h)</p>
            </div>
            <div className="text-center p-2 bg-pink-50 rounded-lg">
              <p className="text-lg font-bold text-pink-600">{summary.count}</p>
              <p className="text-[9px] text-muted-foreground">Entries</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 mb-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-700">No mood journal entries yet — log your mood in the Mood tab for personalized programs.</p>
          </div>
        )}

        {/* Program Type Selection */}
        <div className="grid grid-cols-2 gap-2">
          {programTypes.map((type) => {
            const Icon = type.icon;
            const isActive = selectedType === type.key;
            return (
              <button
                key={type.key}
                onClick={() => generateProgram(type.key)}
                disabled={generating}
                className={`text-left p-3 rounded-xl border transition-all ${isActive ? "border-purple-400 bg-purple-50" : "border-border hover:border-purple-300 hover:bg-purple-50/50"} ${generating && !isActive ? "opacity-50" : ""}`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-semibold">{type.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{type.desc}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Generating State */}
      {generating && (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
            <p className="text-sm text-muted-foreground">Analyzing your wellness data and crafting a personalized program...</p>
          </div>
        </Card>
      )}

      {/* Generated Program */}
      {program && !generating && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {programTypes.find((t) => t.key === selectedType)?.label}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => generateProgram(selectedType)} disabled={generating}>
                <RefreshCw className="w-3 h-3 mr-1.5" />Regenerate
              </Button>
            </div>
            <FormattedAIResponse content={program} theme="emerald" />
          </Card>
        </motion.div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <Shield className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-[10px] text-purple-800">Wellness guidance only — not medical advice. Consult a healthcare professional for medical concerns.</p>
      </div>
    </div>
  );
}