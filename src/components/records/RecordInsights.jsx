import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, AlertTriangle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

export default function RecordInsights({ records }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateInsights = async () => {
    if (records.length === 0) return;
    setLoading(true);
    setError("");
    setInsights(null);

    const recordsSummary = records.map((r) => ({
      title: r.title,
      category: r.category,
      date: r.date,
      provider: r.provider,
      notes: r.notes?.substring(0, 500),
    }));

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a medical data analyst. Analyze the following medical records for a patient and provide key insights. Focus on:
1. TRENDS: Identify any patterns over time (e.g., recurring lab abnormalities, improving or worsening values, chronic issues)
2. ANOMALIES: Flag anything unusual or concerning (e.g., unexpected lab results, new allergies, potential drug interactions)
3. CHANGES: What has changed since previous records?
4. RECOMMENDATIONS: Suggested follow-up actions or questions to ask their doctor

Format your response in clear sections with markdown headers. Be concise but specific. If there are lab results, mention the specific values and whether they are in normal range.

Patient Records (JSON):
${JSON.stringify(recordsSummary, null, 2)}

Add a disclaimer that this AI analysis is for informational purposes only and does not replace professional medical advice.`,
        response_json_schema: {
          type: "object",
          properties: {
            trends: { type: "array", items: { type: "string" } },
            anomalies: { type: "array", items: { type: "string" } },
            changes: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
          },
        },
      });

      setInsights(response);
    } catch (e) {
      setError("Failed to generate insights. Please try again.");
      console.error(e);
    }
    setLoading(false);
  };

  if (records.length === 0) return null;

  return (
    <div className="mb-6">
      <Card className="p-5 bg-gradient-to-br from-violet-50 to-sky-50 border-violet-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm">AI Record Insights</h3>
              <p className="text-xs text-muted-foreground">Automated trend & anomaly detection across your records</p>
            </div>
          </div>
          {!insights && !loading && (
            <Button size="sm" onClick={generateInsights} className="bg-violet-600 hover:bg-violet-700">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Analyze Records
            </Button>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-6 justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
            <span className="text-sm text-muted-foreground">Analyzing {records.length} records for trends and anomalies...</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 py-4 text-center">{error}</p>
        )}

        {insights && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mt-3">
            {insights.summary && (
              <div className="p-3 bg-white/60 rounded-lg">
                <p className="text-sm text-gray-700">{insights.summary}</p>
              </div>
            )}

            {insights.trends?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-violet-700 mb-1.5 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Key Trends</p>
                <div className="space-y-1.5">
                  {insights.trends.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600 pl-2">
                      <ArrowUp className="w-3 h-3 text-violet-500 mt-0.5 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.anomalies?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Anomalies & Flags</p>
                <div className="space-y-1.5">
                  {insights.anomalies.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600 pl-2 p-2 bg-amber-50 rounded">
                      <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.changes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-sky-700 mb-1.5 flex items-center gap-1"><ArrowDown className="w-3.5 h-3.5" /> Changes Over Time</p>
                <div className="space-y-1.5">
                  {insights.changes.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600 pl-2">
                      <Minus className="w-3 h-3 text-sky-500 mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.recommendations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Recommendations</p>
                <div className="space-y-1.5">
                  {insights.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600 pl-2 p-2 bg-emerald-50 rounded">
                      <span className="text-emerald-600 font-bold shrink-0">{i + 1}.</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-800">This AI-generated analysis is for informational purposes only and does not replace professional medical advice. Always consult your healthcare provider.</p>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setInsights(null)} className="text-xs">
              Re-analyze
            </Button>
          </motion.div>
        )}
      </Card>
    </div>
  );
}