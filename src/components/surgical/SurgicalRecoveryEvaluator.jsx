import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Activity, ShieldAlert, CheckCircle2 } from "lucide-react";
import FormattedAIResponse from "@/components/ui/FormattedAIResponse";
import { motion } from "framer-motion";

export default function SurgicalRecoveryEvaluator() {
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const evaluateRecovery = async () => {
    setLoading(true);
    setEvaluation(null);

    try {
      const logs = await base44.entities.SurgicalRecoveryLog.list("-date", 10).catch(() => []);
      const safeLogs = Array.isArray(logs) ? logs : [];

      const logSummary = safeLogs.map((l) => ({
        date: l.date,
        surgery: l.surgery_type,
        days_post_op: l.days_post_op,
        pain_score: l.pain_score,
        notes: l.notes || "",
        complications: l.complications || [],
      }));

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Post-Operative Surgical Recovery Evaluator.

Analyze the patient's surgical recovery logs (last 10 entries):
${JSON.stringify(logSummary, null, 2)}

CLINICAL EVALUATION GUIDELINES:
1. RECOVERY TRAJECTORY: Evaluate pain trend (improving, stagnant, worsening) relative to days post-op.
2. INFECTION & COMPLICATION RISK: Assess any flagged symptoms (fever, redness, discharge, sudden pain increase).
3. HEALING MILESTONES: Identify expected post-op milestones for their timeframe.
4. SURGEON NOTIFICATION CRITERIA: Specific red flags requiring an immediate call to their surgical team.`,
        model: "claude_sonnet_4_6",
      });

      setEvaluation(response);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <Card className="p-5 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50/40">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Surgical Recovery Evaluator</h3>
            <p className="text-xs text-muted-foreground">Clinical assessment of your post-op healing & pain trends</p>
          </div>
        </div>
        {!evaluation && !loading && (
          <Button onClick={evaluateRecovery} size="sm" className="bg-rose-600 hover:bg-rose-700">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Evaluate Recovery
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6 gap-2 text-rose-700">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs font-medium">Evaluating surgical recovery logs...</span>
        </div>
      )}

      {evaluation && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <Card className="p-4 bg-white border border-rose-200">
            <FormattedAIResponse content={evaluation} theme="rose" />
          </Card>
          <Button variant="ghost" size="sm" onClick={() => setEvaluation(null)} className="text-xs mt-2 text-rose-700">
            Re-evaluate
          </Button>
        </motion.div>
      )}
    </Card>
  );
}
