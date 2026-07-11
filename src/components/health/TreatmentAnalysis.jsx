import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Loader2, Pill, Activity, Scissors, Leaf,
  Clock, AlertTriangle, Shield, Lightbulb, TrendingUp, Stethoscope
} from "lucide-react";
import { motion } from "framer-motion";

const severityStyles = {
  mild: "bg-emerald-100 text-emerald-700",
  moderate: "bg-amber-100 text-amber-700",
  severe: "bg-orange-100 text-orange-700",
  emergency: "bg-red-100 text-red-700",
};

const treatmentTypeIcons = {
  medication: Pill,
  procedure: Scissors,
  therapy: Activity,
  lifestyle: Leaf,
};

export default function TreatmentAnalysis() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setSearched(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a medical treatment analysis expert with access to current clinical guidelines and research. A user is asking about treatments for: "${query}".

Provide an extensive, evidence-based analysis of the best treatments for this condition. Include first-line treatments, medication options with dosages, procedural interventions, alternative therapies, lifestyle modifications, recovery expectations, and important warnings.

Use current medical guidelines (e.g., CDC, WHO, AHA, ADA, AAP) and cite reputable sources. Be thorough but practical — the user wants to understand their treatment options before discussing with their doctor.

If the query is not a medical condition or treatment, explain what treatments are relevant and why. If it's an emergency condition, state that clearly at the top.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            condition_overview: { type: "string" },
            severity: { type: "string", enum: ["mild", "moderate", "severe", "emergency"] },
            is_emergency: { type: "boolean" },
            first_line_treatments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  treatment: { type: "string" },
                  type: { type: "string", enum: ["medication", "procedure", "therapy", "lifestyle"] },
                  description: { type: "string" },
                  effectiveness: { type: "string" },
                },
              },
            },
            medication_options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  class: { type: "string" },
                  typical_dosage: { type: "string" },
                  notes: { type: "string" },
                },
              },
            },
            procedural_interventions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  procedure: { type: "string" },
                  description: { type: "string" },
                  recovery_time: { type: "string" },
                },
              },
            },
            alternative_therapies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  therapy: { type: "string" },
                  evidence: { type: "string" },
                },
              },
            },
            lifestyle_modifications: {
              type: "array",
              items: { type: "string" },
            },
            recovery_timeline: { type: "string" },
            success_rates: { type: "string" },
            warnings: { type: "array", items: { type: "string" } },
            when_to_seek_care: { type: "string" },
            references: { type: "array", items: { type: "string" } },
          },
        },
      });
      setResult(response);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const quickSearches = [
    "Type 2 Diabetes", "Hypertension", "Migraine", "Lower Back Pain",
    "Anxiety Disorder", "GERD", "Osteoarthritis", "Asthma",
  ];

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Stethoscope className="w-5 h-5 text-sky-600" />
          <h3 className="font-semibold text-sm">AI Treatment Analysis</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Search for any condition or symptom to get an evidence-based breakdown of the best treatment options,
          medications, procedures, alternative therapies, and recovery expectations.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Type 2 Diabetes, torn meniscus, chronic migraines..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={!query.trim() || loading} className="bg-sky-600 hover:bg-sky-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Analyze
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {quickSearches.map((q) => (
            <button
              key={q}
              onClick={() => { setQuery(q); }}
              className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-sky-50 hover:text-sky-700 transition"
            >
              {q}
            </button>
          ))}
        </div>
      </Card>

      {loading && (
        <Card className="p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Analyzing treatments and gathering evidence-based recommendations...</p>
        </Card>
      )}

      {!loading && searched && !result && (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Could not retrieve treatment analysis. Please try again.</p>
        </Card>
      )}

      {!loading && result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Emergency Banner */}
          {result.is_emergency && (
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-sm font-semibold text-red-700">
                  This condition may require emergency care. Call 911 or go to the nearest ER if symptoms are severe.
                </p>
              </div>
            </Card>
          )}

          {/* Overview */}
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-display font-semibold text-sm">Condition Overview</h3>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${severityStyles[result.severity] || "bg-gray-100 text-gray-700"}`}>
                {result.severity}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{result.condition_overview}</p>
          </Card>

          {/* First-Line Treatments */}
          {result.first_line_treatments?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" /> First-Line Treatments
              </h3>
              <div className="space-y-3">
                {result.first_line_treatments.map((t, i) => {
                  const Icon = treatmentTypeIcons[t.type] || Activity;
                  return (
                    <div key={i} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-sky-600" />
                        </div>
                        <p className="text-sm font-medium">{t.treatment}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize ml-auto">{t.type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                      {t.effectiveness && (
                        <p className="text-xs text-emerald-600 mt-1">Effectiveness: {t.effectiveness}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Medication Options */}
          {result.medication_options?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                <Pill className="w-4 h-4 text-violet-600" /> Medication Options
              </h3>
              <div className="space-y-2">
                {result.medication_options.map((m, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{m.name}</p>
                      {m.class && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{m.class}</span>}
                    </div>
                    {m.typical_dosage && <p className="text-xs text-muted-foreground mt-0.5">Typical: {m.typical_dosage}</p>}
                    {m.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{m.notes}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Procedural Interventions */}
          {result.procedural_interventions?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-orange-600" /> Procedural & Surgical Options
              </h3>
              <div className="space-y-2">
                {result.procedural_interventions.map((p, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium">{p.procedure}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                    {p.recovery_time && (
                      <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Recovery: {p.recovery_time}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Alternative Therapies */}
          {result.alternative_therapies?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600" /> Alternative & Complementary Therapies
              </h3>
              <div className="space-y-2">
                {result.alternative_therapies.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{a.therapy}</p>
                      {a.evidence && <p className="text-xs text-muted-foreground">Evidence: {a.evidence}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Lifestyle Modifications */}
          {result.lifestyle_modifications?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" /> Lifestyle Modifications
              </h3>
              <ul className="space-y-1">
                {result.lifestyle_modifications.map((l, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    {l}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Recovery & Success */}
          {(result.recovery_timeline || result.success_rates) && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" /> Recovery & Prognosis
              </h3>
              {result.recovery_timeline && (
                <p className="text-sm text-muted-foreground mb-2"><strong className="text-foreground">Timeline:</strong> {result.recovery_timeline}</p>
              )}
              {result.success_rates && (
                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Success Rates:</strong> {result.success_rates}</p>
              )}
            </Card>
          )}

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <Card className="p-5 border-amber-200 bg-amber-50">
              <h3 className="font-display font-semibold text-sm mb-2 text-amber-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Important Warnings
              </h3>
              <ul className="space-y-1">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* When to Seek Care */}
          {result.when_to_seek_care && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-sm mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-600" /> When to Seek Professional Care
              </h3>
              <p className="text-sm text-muted-foreground">{result.when_to_seek_care}</p>
            </Card>
          )}

          {/* References */}
          {result.references?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-xs mb-2">References</h3>
              <ul className="space-y-1">
                {result.references.map((r, i) => (
                  <li key={i} className="text-xs text-muted-foreground">{i + 1}. {r}</li>
                ))}
              </ul>
            </Card>
          )}

          <div className="flex items-start gap-2 p-4 bg-sky-50 rounded-xl border border-sky-200">
            <Shield className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
            <p className="text-xs text-sky-800">
              This analysis is generated by AI using internet-based medical sources and is for educational purposes only.
              Always consult a licensed healthcare provider before starting, stopping, or changing any treatment.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}