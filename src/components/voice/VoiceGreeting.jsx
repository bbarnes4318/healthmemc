import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "voice_greeting_dismissed";

export default function VoiceGreeting({ userName }) {
  const [state, setState] = useState("idle"); // idle → loading → speaking → done
  const [summary, setSummary] = useState(null);
  const spokenRef = useRef(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY) === "true";
    if (dismissed) return;

    let cancelled = false;

    const run = async () => {
      try {
        const user = await base44.auth.me();
        if (!user || cancelled) return;

        const today = new Date().toISOString().split("T")[0];

        // Fetch health data in parallel for the daily summary
        const [appointments, medications, exercises, recoveryLogs, wellnessEntries, journalEntries] = await Promise.all([
          base44.entities.Appointment.filter({ status: "scheduled" }, "date", 10).catch(() => []),
          base44.entities.Medication.filter({ active: true }).catch(() => []),
          base44.entities.ExerciseLog.list("-date", 5).catch(() => []),
          base44.entities.SurgicalRecovery.list("-log_date", 5).catch(() => []),
          base44.entities.WellnessJournal.list("-date", 3).catch(() => []),
          base44.entities.NutritionLog.list("-date", 3).catch(() => []),
        ]);

        if (cancelled) return;

        const firstName = userName ? userName.split(" ")[0] : (user.full_name?.split(" ")[0] || "there");
        const hour = new Date().getHours();
        const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

        // Build context for the AI
        const upcomingAppts = appointments.filter((a) => a.date >= today).slice(0, 3);
        const activeMeds = medications.slice(0, 5);
        const todayExercises = exercises.filter((e) => e.date === today);
        const loggedRecoveryToday = recoveryLogs.some((r) => r.log_date === today);
        const latestWellness = wellnessEntries[0];
        const latestJournal = journalEntries[0];

        const context = {
          name: firstName,
          timeGreeting,
          upcomingAppointments: upcomingAppts.map((a) => `${a.appointment_type || a.title || "Appointment"} on ${a.date}`),
          activeMedications: activeMeds.map((m) => `${m.name} ${m.dosage || ""}`.trim()),
          exercisedToday: todayExercises.length > 0,
          exerciseCount: todayExercises.length,
          lastExercise: exercises[0] ? `${exercises[0].exercise_name} on ${exercises[0].date}` : null,
          loggedRecoveryToday,
          lastRecoveryLog: recoveryLogs[0] ? `${recoveryLogs[0].surgery_name} on ${recoveryLogs[0].log_date}` : null,
          wellnessLoggedToday: latestWellness?.date === today,
          mood: latestWellness?.mood,
          nutritionLoggedToday: latestJournal?.date === today,
        };

        const prompt = `You are a health companion for ${firstName}. Based on the following health data, create a brief, warm voice greeting (max 3 sentences, conversational tone) that:
1. Greets them with "${timeGreeting}, ${firstName}"
2. Summarizes their top 3 health priorities or pending tasks for today based on the data
3. Keeps it encouraging and actionable

Health data: ${JSON.stringify(context)}

Respond with ONLY the spoken greeting text, no markdown, no headers. Keep it under 60 words.`;

        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: null,
        });

        if (cancelled) return;

        const greetingText = typeof response === "string" ? response : response?.text || response?.response || `${timeGreeting}, ${firstName}. Welcome to Health Me Medical Center. Check your daily health tasks today.`;
        setSummary(greetingText);
        setState("speaking");

        // Speak the greeting
        if (!window.speechSynthesis || spokenRef.current) {
          setState("done");
          return;
        }
        spokenRef.current = true;
        const utterance = new SpeechSynthesisUtterance(greetingText);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onend = () => !cancelled && setState("done");
        utterance.onerror = () => !cancelled && setState("done");
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Voice greeting error:", err);
        if (!cancelled) setState("done");
      }
    };

    const timer = setTimeout(run, 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [userName]);

  const handleDismiss = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    sessionStorage.setItem(STORAGE_KEY, "true");
    setState("done");
  };

  if (state === "idle" || state === "done") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white shadow-lg rounded-full pl-4 pr-2 py-2 border border-teal-200 max-w-[90vw]">
      {state === "loading" ? (
        <>
          <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
          <span className="text-xs text-muted-foreground">Preparing your daily summary...</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-teal-600 animate-pulse shrink-0" />
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {summary ? summary.slice(0, 60) + "..." : "Greeting you..."}
          </span>
        </>
      )}
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full shrink-0" onClick={handleDismiss}>
        <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}