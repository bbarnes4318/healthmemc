import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ShieldAlert, AlertTriangle, Loader2, Pill, RefreshCw, CheckCircle2, Activity, Sparkles,
} from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { useToast } from "@/components/ui/use-toast";
import DrugInteractionAlert from "@/components/pharmacy/DrugInteractionAlert";

export default function MedicationSafetyScanner() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [newMedName, setNewMedName] = useState("");
  const [checkingNew, setCheckingNew] = useState(false);
  const [newMedInteractions, setNewMedInteractions] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);

  const load = async () => {
    try {
      const user = await base44.auth.me();
      const filter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
      const [meds, profiles] = await Promise.all([
        base44.entities.Medication.filter(filter),
        base44.entities.HealthProfile.filter({ created_by_id: user.id }),
      ]);
      setMedications(meds);
      if (profiles.length > 0 && profiles[0].allergies) {
        setAllergies(profiles[0].allergies);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const runFullScan = async () => {
    if (medications.length === 0) return;
    setScanning(true);
    setResults(null);
    try {
      const medNames = medications.map((m) => `${m.name} (${m.dosage}, ${m.frequency})`);
      const allergyList = allergies.length > 0 ? allergies.join(", ") : "None reported";

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical pharmacology and allergy safety expert. Perform a comprehensive medication safety scan for this patient.

CURRENT MEDICATIONS:
${medNames.join("\n")}

KNOWN ALLERGIES:
${allergyList}

Perform TWO checks:

1. DRUG-DRUG INTERACTIONS: Check every medication against every other medication on the list. For each interaction found, provide:
   - medication_a: first medication name
   - medication_b: second medication name
   - severity: "severe" (contraindicated, life-threatening), "moderate" (may need dose adjustment or monitoring), or "mild" (minor)
   - risk: short label (e.g., "Increased bleeding risk", "Serotonin syndrome")
   - description: what happens mechanistically
   - recommendation: practical advice

2. ALLERGY CHECK: Check each medication against the patient's known allergies. For each allergy match found, provide:
   - medication: the medication name
   - allergen: the allergen it matches
   - severity: "severe" (anaphylaxis risk), "moderate", or "mild"
   - description: why this medication may trigger the allergy
   - recommendation: what to do

Only report genuine, clinically recognized interactions and allergy concerns. If none found, return empty arrays.`,
        response_json_schema: {
          type: "object",
          properties: {
            drug_interactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  medication_a: { type: "string" },
                  medication_b: { type: "string" },
                  severity: { type: "string", enum: ["severe", "moderate", "mild"] },
                  risk: { type: "string" },
                  description: { type: "string" },
                  recommendation: { type: "string" },
                },
              },
            },
            allergy_alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  medication: { type: "string" },
                  allergen: { type: "string" },
                  severity: { type: "string", enum: ["severe", "moderate", "mild"] },
                  description: { type: "string" },
                  recommendation: { type: "string" },
                },
              },
            },
            summary: { type: "string" },
          },
        },
      });
      setResults(response);
      toast({ title: "Safety scan complete" });
    } catch (e) {
      console.error(e);
      toast({ title: "Scan failed", variant: "destructive" });
    }
    setScanning(false);
  };

  const checkNewMedication = async () => {
    if (!newMedName.trim() || medications.length === 0) return;
    setCheckingNew(true);
    setNewMedInteractions(null);
    try {
      const existingNames = medications.map((m) => `${m.name} (${m.dosage}, ${m.frequency})`);
      const allergyList = allergies.length > 0 ? allergies.join(", ") : "None reported";

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical pharmacology and allergy safety expert. Check a NEW medication/supplement against the patient's existing medications AND known allergies.

NEW medication/supplement: ${newMedName.trim()}

EXISTING medications:
${existingNames.join("\n")}

KNOWN ALLERGIES:
${allergyList}

Check for:
1. Drug-drug interactions between the NEW medication and each EXISTING medication
2. Allergic reaction risk between the NEW medication and any known allergy

For each finding, provide:
- new_medication: the new medication name
- existing_medication: the existing medication or allergen it interacts with
- severity: "severe", "moderate", or "mild"
- risk: short label
- description: what happens
- recommendation: practical advice

Only report genuine, clinically recognized interactions and allergy risks. Return empty array if none found.`,
        response_json_schema: {
          type: "object",
          properties: {
            interactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  new_medication: { type: "string" },
                  existing_medication: { type: "string" },
                  severity: { type: "string", enum: ["severe", "moderate", "mild"] },
                  risk: { type: "string" },
                  description: { type: "string" },
                  recommendation: { type: "string" },
                },
              },
            },
          },
        },
      });

      const interactions = response.interactions || [];
      if (interactions.length > 0) {
        setNewMedInteractions(interactions);
        setAlertOpen(true);
      } else {
        toast({ title: "No interactions or allergy risks found", description: `${newMedName.trim()} appears safe with your current medications` });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Check failed", variant: "destructive" });
    }
    setCheckingNew(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>;
  }

  const hasResults = results && (results.drug_interactions?.length > 0 || results.allergy_alerts?.length > 0);
  const hasSevere = results?.drug_interactions?.some((i) => i.severity === "severe") || results?.allergy_alerts?.some((i) => i.severity === "severe");

  return (
    <div className="space-y-6">
      {/* Allergy Display */}
      {allergies.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Known Allergies on File</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {allergies.map((a, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-red-200 text-red-800 font-medium">{a}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Full Scan */}
      <Card className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Full Medication Safety Scan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scans all {medications.length} active medication{medications.length !== 1 ? "s" : ""} against each other and your known allergies for interactions and allergic reaction risks.
            </p>
          </div>
        </div>
        <Button onClick={runFullScan} disabled={scanning || medications.length === 0} className="w-full bg-amber-600 hover:bg-amber-700">
          {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {scanning ? "Scanning..." : "Run Safety Scan"}
        </Button>
      </Card>

      {/* New Med Check */}
      <Card className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Check a New Prescription or Supplement</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Before adding a new medication or supplement, check it against your current list and allergies.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Warfarin, St. John's Wort, Ibuprofen"
            value={newMedName}
            onChange={(e) => setNewMedName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") checkNewMedication(); }}
          />
          <Button onClick={checkNewMedication} disabled={!newMedName.trim() || checkingNew || medications.length === 0} className="bg-violet-600 hover:bg-violet-700">
            {checkingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
          </Button>
        </div>
      </Card>

      {/* Scan Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {hasResults ? (
            <Card className={`p-5 ${hasSevere ? "border-red-300" : "border-amber-300"}`}>
              <div className="flex items-center gap-2 mb-4">
                {hasSevere ? <ShieldAlert className="w-5 h-5 text-red-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
                <h3 className="font-semibold text-sm">Safety Scan Results</h3>
              </div>

              {results.summary && (
                <p className="text-xs text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">{results.summary}</p>
              )}

              {/* Allergy Alerts */}
              {results.allergy_alerts?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Allergy Alerts ({results.allergy_alerts.length})
                  </h4>
                  <div className="space-y-2">
                    {results.allergy_alerts.map((alert, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${alert.severity === "severe" ? "bg-red-50 border-red-200" : alert.severity === "moderate" ? "bg-amber-50 border-amber-200" : "bg-sky-50 border-sky-200"}`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold">{alert.medication} → {alert.allergen}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${alert.severity === "severe" ? "bg-red-200 text-red-800" : alert.severity === "moderate" ? "bg-amber-200 text-amber-800" : "bg-sky-200 text-sky-800"}`}>{alert.severity}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                        {alert.recommendation && <p className="text-xs italic text-muted-foreground mt-1">💡 {alert.recommendation}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drug Interactions */}
              {results.drug_interactions?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Drug Interactions ({results.drug_interactions.length})
                  </h4>
                  <div className="space-y-2">
                    {results.drug_interactions.map((interaction, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${interaction.severity === "severe" ? "bg-red-50 border-red-200" : interaction.severity === "moderate" ? "bg-amber-50 border-amber-200" : "bg-sky-50 border-sky-200"}`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold">{interaction.medication_a} + {interaction.medication_b}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${interaction.severity === "severe" ? "bg-red-200 text-red-800" : interaction.severity === "moderate" ? "bg-amber-200 text-amber-800" : "bg-sky-200 text-sky-800"}`}>{interaction.severity}</span>
                        </div>
                        {interaction.risk && <p className="text-xs font-medium text-muted-foreground mb-0.5">{interaction.risk}</p>}
                        <p className="text-xs text-muted-foreground">{interaction.description}</p>
                        {interaction.recommendation && <p className="text-xs italic text-muted-foreground mt-1">💡 {interaction.recommendation}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-5 border-green-200 bg-green-50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-sm text-green-900">All Clear</h3>
                  <p className="text-xs text-green-800 mt-0.5">No drug interactions or allergy risks found among your {medications.length} medications.</p>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      )}

      {/* New Medication Interaction Alert */}
      <DrugInteractionAlert
        open={alertOpen}
        interactions={newMedInteractions}
        newMedName={newMedName}
        onConfirm={() => { setAlertOpen(false); setNewMedName(""); setNewMedInteractions(null); }}
        onCancel={() => { setAlertOpen(false); setNewMedInteractions(null); }}
      />

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          This safety scanner is AI-powered and for informational purposes only. Always consult your doctor or pharmacist before starting, stopping, or combining medications and supplements.
        </p>
      </div>
    </div>
  );
}