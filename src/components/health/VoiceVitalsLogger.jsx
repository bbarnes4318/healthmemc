import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  Mic, MicOff, Loader2, Check, X, Heart, Activity, Scale,
  Thermometer, Moon, Droplets, Footprints, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const vitalTypes = [
  { value: "heart_rate", label: "Heart Rate", unit: "bpm", icon: Heart, color: "#ef4444",
    keywords: ["heart rate", "heart", "pulse", "bpm", "beats"] },
  { value: "blood_pressure", label: "Blood Pressure", unit: "mmHg", icon: Activity, color: "#3b82f6",
    keywords: ["blood pressure", "bp", "pressure"] },
  { value: "oxygen_saturation", label: "Oxygen (SpO2)", unit: "%", icon: Droplets, color: "#06b6d4",
    keywords: ["oxygen", "spo2", "saturation", "o2"] },
  { value: "blood_glucose", label: "Blood Glucose", unit: "mg/dL", icon: Droplets, color: "#8b5cf6",
    keywords: ["glucose", "blood sugar", "sugar"] },
  { value: "weight", label: "Weight", unit: "kg", icon: Scale, color: "#f59e0b",
    keywords: ["weight", "weigh", "pounds", "kilograms", "kg", "lbs"] },
  { value: "sleep_hours", label: "Sleep", unit: "hrs", icon: Moon, color: "#6366f1",
    keywords: ["sleep", "slept", "hours of sleep"] },
  { value: "activity_minutes", label: "Activity", unit: "min", icon: Footprints, color: "#22c55e",
    keywords: ["activity", "exercise", "steps", "walked", "minutes"] },
  { value: "temperature", label: "Temperature", unit: "°F", icon: Thermometer, color: "#ec4899",
    keywords: ["temperature", "fever", "temp"] },
];

function parseVitalsFromSpeech(text) {
  const lower = text.toLowerCase();
  const results = [];

  for (const vType of vitalTypes) {
    for (const keyword of vType.keywords) {
      if (lower.includes(keyword)) {
        // For blood pressure, look for "X over Y" or "X/Y"
        if (vType.value === "blood_pressure") {
          const overMatch = lower.match(/(\d+)\s*(?:over|slash|\/)\s*(\d+)/);
          if (overMatch) {
            results.push({
              type: vType.value,
              label: vType.label,
              unit: vType.unit,
              value: overMatch[1],
              secondary_value: overMatch[2],
              icon: vType.icon,
              color: vType.color,
            });
            break;
          }
          const slashMatch = text.match(/(\d+)\s*\/\s*(\d+)/);
          if (slashMatch) {
            results.push({
              type: vType.value,
              label: vType.label,
              unit: vType.unit,
              value: slashMatch[1],
              secondary_value: slashMatch[2],
              icon: vType.icon,
              color: vType.color,
            });
            break;
          }
        }

        // Extract the first number after the keyword
        const keywordIdx = lower.indexOf(keyword);
        const afterKeyword = text.slice(keywordIdx + keyword.length);
        const numMatch = afterKeyword.match(/(\d+\.?\d*)/);
        if (numMatch) {
          // Check we haven't already found this type
          if (!results.find((r) => r.type === vType.value)) {
            results.push({
              type: vType.value,
              label: vType.label,
              unit: vType.unit,
              value: numMatch[1],
              icon: vType.icon,
              color: vType.color,
            });
          }
          break;
        }
      }
    }
  }

  // If no structured vital found but there's text, treat as a note
  if (results.length === 0 && text.trim().length > 3) {
    results.push({ type: "note", label: "Voice Note", value: text.trim() });
  }

  return results;
}

export default function VoiceVitalsLogger({ onSaved }) {
  const { toast } = useToast();
  const { currentMemberId } = useFamilyMember();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState([]);
  const [saving, setSaving] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setSupported(true);
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    setTranscript("");
    setParsed([]);
    setListening(true);

    recognition.onresult = (event) => {
      let fullText = "";
      for (let i = 0; i < event.results.length; i++) {
        fullText += event.results[i][0].transcript;
      }
      setTranscript(fullText);
      if (event.results[event.results.length - 1].isFinal) {
        const results = parseVitalsFromSpeech(fullText);
        setParsed(results);
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error !== "no-speech") {
        toast({ title: "Voice error", description: event.error, variant: "destructive" });
      }
    };

    recognition.onend = () => {
      setListening(false);
      // Parse whatever we have
      if (transcript) {
        const results = parseVitalsFromSpeech(transcript);
        if (results.length > 0) setParsed(results);
      }
    };

    recognition.start();
  }, [toast, transcript]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    if (transcript) {
      const results = parseVitalsFromSpeech(transcript);
      setParsed(results);
    }
  };

  const removeParsed = (idx) => {
    setParsed(parsed.filter((_, i) => i !== idx));
  };

  const updateParsedValue = (idx, value) => {
    setParsed(parsed.map((p, i) => i === idx ? { ...p, value } : p));
  };

  const handleSave = async () => {
    const vitalsToSave = parsed.filter((p) => p.type !== "note" && p.value);
    const noteEntry = parsed.find((p) => p.type === "note");

    if (vitalsToSave.length === 0 && !noteEntry) {
      toast({ title: "Nothing to save", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Save vitals
      for (const v of vitalsToSave) {
        await base44.entities.VitalRecord.create({
          type: v.type,
          value: parseFloat(v.value),
          secondary_value: v.secondary_value ? parseFloat(v.secondary_value) : undefined,
          unit: v.unit,
          recorded_at: new Date().toISOString(),
          notes: noteEntry ? noteEntry.value : undefined,
          family_member_id: currentMemberId || undefined,
        });
      }

      // If only a note with no vitals, save as a note on a general record
      if (noteEntry && vitalsToSave.length === 0) {
        await base44.entities.MedicalRecord.create({
          title: "Voice Note",
          category: "other",
          date: new Date().toISOString().split("T")[0],
          notes: noteEntry.value,
          family_member_id: currentMemberId || undefined,
        });
      }

      toast({
        title: `Saved ${vitalsToSave.length} vital${vitalsToSave.length !== 1 ? "s" : ""}${noteEntry && vitalsToSave.length > 0 ? " + note" : ""}`,
      });
      setParsed([]);
      setTranscript("");
      onSaved?.();
    } catch (e) {
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  if (!supported) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
          <Mic className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Voice Vitals Logger</h3>
          <p className="text-xs text-muted-foreground">Dictate vitals like "heart rate 72, blood pressure 120 over 80"</p>
        </div>
      </div>

      {/* Mic button */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={listening ? stopListening : startListening}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-colors shrink-0 ${
            listening ? "bg-red-600 animate-pulse" : "bg-gradient-to-br from-sky-500 to-indigo-600"
          }`}
        >
          {listening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </motion.button>

        <div className="flex-1 min-h-[56px] flex items-center">
          {listening ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
              <span className="text-sm text-muted-foreground">Listening...</span>
            </div>
          ) : transcript ? (
            <p className="text-sm text-gray-700 italic">"{transcript}"</p>
          ) : (
            <p className="text-sm text-muted-foreground">Tap the mic and speak your vitals</p>
          )}
        </div>
      </div>

      {/* Example phrases */}
      {!listening && !transcript && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {["Heart rate 72", "Blood pressure 120 over 80", "Weight 75 kg", "Temperature 98.6"].map((ex) => (
            <span key={ex} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              "{ex}"
            </span>
          ))}
        </div>
      )}

      {/* Parsed results */}
      <AnimatePresence>
        {parsed.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2"
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Detected — review and save:
            </p>
            {parsed.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border">
                {p.icon ? (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${p.color}15` }}>
                    <p.icon className="w-4 h-4" style={{ color: p.color }} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4 text-sky-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{p.label}</p>
                  {p.type === "note" ? (
                    <p className="text-[10px] text-muted-foreground truncate">{p.value}</p>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        value={p.value}
                        onChange={(e) => updateParsedValue(idx, e.target.value)}
                        className="h-7 w-20 text-xs"
                      />
                      {p.secondary_value && (
                        <>
                          <span className="text-xs text-muted-foreground">/</span>
                          <span className="text-xs font-medium">{p.secondary_value}</span>
                        </>
                      )}
                      <span className="text-[10px] text-muted-foreground">{p.unit}</span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeParsed(idx)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-sky-600 hover:bg-sky-700 h-9"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Save to Records
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}