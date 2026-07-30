import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Loader2, Sparkles, Plus, Trash2, Pill, Utensils, AlertTriangle } from "lucide-react";
import FormattedAIResponse from "@/components/ui/FormattedAIResponse";
import { motion } from "framer-motion";

export default function MedicationInteractionChecker() {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Auto-load patient's active medications for convenience
    const loadMeds = async () => {
      try {
        const activeMeds = await base44.entities.Medication.filter({ active: true });
        if (Array.isArray(activeMeds) && activeMeds.length > 0) {
          setItems(activeMeds.map((m) => m.name));
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadMeds();
  }, []);

  const addItem = () => {
    if (!input.trim()) return;
    if (!items.includes(input.trim())) {
      setItems([...items, input.trim()]);
    }
    setInput("");
  };

  const removeItem = (item) => {
    setItems(items.filter((i) => i !== item));
  };

  const [matrixWarnings, setMatrixWarnings] = useState([]);

  const checkDeterministicMatrix = (itemList) => {
    const lower = itemList.map((i) => i.toLowerCase());
    const warnings = [];

    const has = (term) => lower.some((item) => item.includes(term));

    if ((has("warfarin") || has("coumadin")) && (has("aspirin") || has("ibuprofen") || has("advil") || has("naproxen") || has("nsaid"))) {
      warnings.push({
        pair: "Warfarin + NSAID/Aspirin",
        severity: "Severe High Risk",
        desc: "Significantly increases internal gastrointestinal bleeding risk. Requires urgent pharmacist or doctor consultation.",
      });
    }

    if ((has("lisinopril") || has("enalapril") || has("ramipril")) && (has("potassium") || has("spironolactone"))) {
      warnings.push({
        pair: "ACE Inhibitor + Potassium",
        severity: "Moderate-High Risk",
        desc: "Can cause dangerous buildup of potassium in the blood (Hyperkalemia), leading to cardiac arrhythmias.",
      });
    }

    if ((has("atorvastatin") || has("simvastatin") || has("statin")) && has("grapefruit")) {
      warnings.push({
        pair: "Statin Medication + Grapefruit",
        severity: "High Risk",
        desc: "Grapefruit inhibits CYP3A4 enzymes, dramatically increasing statin concentration in blood and muscle toxicity risk (Rhabdomyolysis).",
      });
    }

    if ((has("sertraline") || has("fluoxetine") || has("zoloft") || has("lexapro")) && (has("st. john") || has("maoi") || has("tramadol"))) {
      warnings.push({
        pair: "SSRI + Serotonergic Agent",
        severity: "Severe High Risk",
        desc: "Potential risk of Serotonin Syndrome (fever, tremor, confusion, rapid heart rate).",
      });
    }

    return warnings;
  };

  const checkInteractions = async () => {
    if (items.length < 2) return;
    setLoading(true);
    setResult(null);
    const matrix = checkDeterministicMatrix(items);
    setMatrixWarnings(matrix);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Senior Clinical Pharmacist and Medication Safety Specialist.

Analyze potential drug-drug and drug-food interactions for the following list of medications/supplements/foods:
${items.map((it, idx) => `${idx + 1}. ${it}`).join("\n")}

INSTRUCTIONS:
1. SUMMARY: Provide an overall interaction risk level (Low, Moderate, High Severe).
2. SPECIFIC INTERACTIONS: Detail each potential interaction, including severity level, mechanisms, and clinical risks.
3. MANAGEMENT & SPACING: Provide practical clinical advice on timing spacing (e.g. separate by 2 hours), food restrictions (e.g. avoid grapefruit, dairy, alcohol), and monitoring tips.
4. WHEN TO CALL A PHARMACIST/DOCTOR: Specific red flag symptoms to watch for.

Format with clear headers, bullet points, and warning callouts.`,
        model: "claude_sonnet_4_6",
      });

      setResult(response);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Medication & Food Interaction Checker</h3>
            <p className="text-xs text-muted-foreground">Check for potential drug-drug and drug-food interactions</p>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Add medication or food (e.g. Lisinopril, Grapefruit, Aspirin)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="flex-1"
          />
          <Button onClick={addItem} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/40 rounded-lg">
            {items.map((item) => (
              <Badge key={item} variant="secondary" className="px-2.5 py-1 flex items-center gap-1.5 text-xs">
                <Pill className="w-3 h-3 text-amber-600" />
                {item}
                <button onClick={() => removeItem(item)} className="hover:text-red-500 transition ml-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Button
          onClick={checkInteractions}
          disabled={items.length < 2 || loading}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {loading ? "Analyzing interactions..." : `Check Interactions (${items.length} items)`}
        </Button>
      </Card>

      {(matrixWarnings.length > 0 || result) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {matrixWarnings.length > 0 && (
            <Card className="p-5 border-red-300 bg-red-50/80">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
                <h4 className="font-bold text-sm text-red-950">Deterministic High-Risk Contraindication Alert</h4>
              </div>
              <div className="space-y-2">
                {matrixWarnings.map((warn, i) => (
                  <div key={i} className="p-3 bg-white rounded-lg border border-red-200">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900">{warn.pair}</span>
                      <Badge className="text-[10px] bg-red-600 text-white font-bold">{warn.severity}</Badge>
                    </div>
                    <p className="text-xs text-red-900">{warn.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result && (
            <Card className="p-5">
              <FormattedAIResponse content={result} theme="amber" />
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
