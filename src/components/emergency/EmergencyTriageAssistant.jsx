import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Loader2, Sparkles, Phone, AlertTriangle, Activity, Stethoscope, HeartPulse } from "lucide-react";
import FormattedAIResponse from "@/components/ui/FormattedAIResponse";
import VoiceInputButton from "@/components/voice/VoiceInputButton";
import { motion } from "framer-motion";

export default function EmergencyTriageAssistant() {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

  const assessEmergency = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setTriageResult(null);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an Emergency Clinical Triage Specialist utilizing the Emergency Severity Index (ESI Level 1-5).

Evaluate the following acute emergency symptoms:
"${symptoms}"

TRIAGE PROTOCOL:
1. TRIAGE LEVEL: Assign an ESI Level (1: Resuscitation / Immediate Life Threat, 2: Emergent / High Risk, 3: Urgent, 4: Less Urgent, 5: Non-Urgent).
2. IMMEDIATE ACTION: Should they call 911 immediately or go to the nearest ER?
3. STEP-BY-STEP FIRST-AID: Provide immediate, clear 1-2-3 first-aid steps while help is on the way (e.g. CPR guidance, pressure on bleeding, seating position, keeping calm).
4. RED FLAGS TO WATCH FOR: Specific worsening signs requiring 911 call.

Important: Put a high-visibility emergency warning at the top if ESI Level is 1 or 2.`,
        model: "claude_sonnet_4_6",
      });

      setTriageResult(response);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const RED_FLAG_REGEX = /chest pain|shortness of breath|difficulty breathing|unconscious|fainting|seizure|anaphylaxis|swollen throat|slurred speech|facial droop|numbness|paralysis|uncontrolled bleeding|heavy bleeding|poisoning|overdose|severe burn|suicid/i;
  const isRedFlag = RED_FLAG_REGEX.test(symptoms);

  return (
    <Card className="p-5 border-red-200 bg-gradient-to-br from-red-50 to-rose-50/50">
      {isRedFlag && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 p-4 bg-red-600 text-white rounded-xl shadow-lg border border-red-700">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 animate-pulse text-yellow-300" />
              <div>
                <h4 className="font-bold text-sm text-yellow-300 uppercase tracking-wide">🚨 Critical Life-Threat Symptoms Detected</h4>
                <p className="text-xs text-red-100 font-medium">Do not wait for AI evaluation. Call 911 or go to the nearest Emergency Room immediately.</p>
              </div>
            </div>
            <a href="tel:911" className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-red-950 font-extrabold text-xs rounded-lg shadow animate-bounce">
              Call 911 Now
            </a>
          </div>
        </motion.div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-red-950">AI Emergency Clinical Triage</h3>
            <p className="text-xs text-red-700">Instant acute symptom evaluation & step-by-step first-aid</p>
          </div>
        </div>
        <a href="tel:911" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition">
          <Phone className="w-3.5 h-3.5" /> Call 911
        </a>
      </div>

      <div className="space-y-3">
        <Textarea
          placeholder="Describe acute emergency symptoms (e.g., severe chest pain radiating to arm, sudden numbness, severe difficulty breathing, deep laceration)..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows={3}
          className="bg-white/80 border-red-200 resize-none text-sm placeholder:text-red-300"
        />

        <div className="flex items-center justify-between">
          <VoiceInputButton value={symptoms} onChange={setSymptoms} />
          <Button
            onClick={assessEmergency}
            disabled={!symptoms.trim() || loading}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
            {loading ? "Evaluating Triage..." : "Assess Emergency Triage"}
          </Button>
        </div>
      </div>

      {triageResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <Card className="p-4 bg-white border border-red-200">
            <FormattedAIResponse content={triageResult} theme="rose" />
          </Card>
        </motion.div>
      )}
    </Card>
  );
}
