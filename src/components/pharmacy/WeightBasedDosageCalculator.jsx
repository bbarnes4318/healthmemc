import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormattedAIResponse from "@/components/ui/FormattedAIResponse";
import { motion } from "framer-motion";

const medicationTypes = [
  { value: "acetaminophen", label: "Acetaminophen (Tylenol)" },
  { value: "ibuprofen", label: "Ibuprofen (Advil/Motrin)" },
  { value: "amoxicillin", label: "Amoxicillin (Antibiotic)" },
  { value: "azithromycin", label: "Azithromycin (Zithromax)" },
  { value: "diphenhydramine", label: "Diphenhydramine (Benadryl)" },
  { value: "loratadine", label: "Loratadine (Claritin)" },
  { value: "omeprazole", label: "Omeprazole (Prilosec)" },
  { value: "metformin", label: "Metformin" },
  { value: "lisinopril", label: "Lisinopril" },
  { value: "amlodipine", label: "Amlodipine" },
  { value: "levothyroxine", label: "Levothyroxine" },
  { value: "prednisone", label: "Prednisone" },
  { value: "gabapentin", label: "Gabapentin" },
  { value: "sertraline", label: "Sertraline (Zoloft)" },
  { value: "albuterol", label: "Albuterol" },
  { value: "hydrochlorothiazide", label: "Hydrochlorothiazide" },
  { value: "metoprolol", label: "Metoprolol" },
  { value: "warfarin", label: "Warfarin" },
  { value: "insulin", label: "Insulin" },
  { value: "furosemide", label: "Furosemide (Lasix)" },
];

const ageGroups = [
  { value: "adult", label: "Adult (18+)" },
  { value: "pediatric", label: "Pediatric (under 18)" },
  { value: "elderly", label: "Elderly (65+)" },
];

export default function WeightBasedDosageCalculator() {
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [medType, setMedType] = useState("");
  const [ageGroup, setAgeGroup] = useState("adult");
  const [exactMath, setExactMath] = useState(null);

  const calculateExactDose = (med, weightKg) => {
    if (!weightKg || weightKg <= 0) return null;
    switch (med) {
      case "acetaminophen": {
        const minDose = (weightKg * 10).toFixed(0);
        const maxDose = (weightKg * 15).toFixed(0);
        const liquidMlMin = (minDose / 32).toFixed(1);
        const liquidMlMax = (maxDose / 32).toFixed(1);
        return {
          title: "Acetaminophen Exact Clinical Calculation",
          doseMg: `${minDose} mg – ${maxDose} mg per dose`,
          frequency: "Every 4 to 6 hours as needed",
          liquidDose: `${liquidMlMin} mL – ${liquidMlMax} mL (Children's 160 mg / 5 mL Liquid)`,
          maxDaily: `${Math.min(weightKg * 75, 4000).toFixed(0)} mg / day`,
        };
      }
      case "ibuprofen": {
        const minDose = (weightKg * 5).toFixed(0);
        const maxDose = (weightKg * 10).toFixed(0);
        const liquidMlMin = (minDose / 20).toFixed(1);
        const liquidMlMax = (maxDose / 20).toFixed(1);
        return {
          title: "Ibuprofen Exact Clinical Calculation",
          doseMg: `${minDose} mg – ${maxDose} mg per dose`,
          frequency: "Every 6 to 8 hours with food as needed",
          liquidDose: `${liquidMlMin} mL – ${liquidMlMax} mL (Children's 100 mg / 5 mL Liquid)`,
          maxDaily: `${Math.min(weightKg * 40, 2400).toFixed(0)} mg / day`,
        };
      }
      case "amoxicillin": {
        const lowDose = ((weightKg * 25) / 2).toFixed(0);
        const highDose = ((weightKg * 90) / 2).toFixed(0);
        return {
          title: "Amoxicillin Pediatric Calculation",
          doseMg: `${lowDose} mg to ${highDose} mg per dose (BID)`,
          frequency: "Twice daily (every 12 hours)",
          liquidDose: "Check bottle concentration (250mg/5mL or 400mg/5mL)",
          maxDaily: `${Math.min(weightKg * 90, 2000).toFixed(0)} mg / day`,
        };
      }
      default:
        return null;
    }
  };

  const calculate = async () => {
    if (!weight || !medType) return;
    setCalculating(true);
    setResult(null);
    setExactMath(null);

    const weightKg = weightUnit === "lb" ? parseFloat(weight) / 2.2046 : parseFloat(weight);
    const mathRes = calculateExactDose(medType, weightKg);
    setExactMath(mathRes);

    try {
      const medLabel = medicationTypes.find((m) => m.value === medType)?.label || medType;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical pharmacology calculator. Calculate the recommended dosage for the following:

MEDICATION: ${medLabel}
PATIENT WEIGHT: ${weight} ${weightUnit} (${weightKg.toFixed(1)} kg)
PATIENT GROUP: ${ageGroup}

Based on standard clinical dosing guidelines and FDA-approved dosing, provide:

1. **Weight-Based Dosing**: If the medication uses weight-based dosing (mg/kg), calculate the exact dose for this patient's weight.
2. **Standard Adult Dose**: The typical adult dose if weight-based dosing is not standard.
3. **Frequency**: How often the dose should be administered.
4. **Maximum Daily Dose**: The maximum safe daily limit.
5. **Route**: Standard route of administration (oral, IV, etc.)
6. **Key Warnings**: Important contraindications or safety notes.`,
        model: "claude_sonnet_4_6",
      });
      setResult(response);
    } catch (e) { console.error(e); }
    setCalculating(false);
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="font-semibold text-sm">Weight-Based Dosage Calculator</h3>
            <p className="text-xs text-muted-foreground">Calculate recommended dosages based on patient weight and medication type</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-xs mb-1.5 block">Patient Weight *</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="e.g., 70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="flex-1"
              />
              <Select value={weightUnit} onValueChange={setWeightUnit}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Patient Group</Label>
            <Select value={ageGroup} onValueChange={setAgeGroup}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ageGroups.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-4">
          <Label className="text-xs mb-1.5 block">Medication *</Label>
          <Select value={medType} onValueChange={setMedType}>
            <SelectTrigger><SelectValue placeholder="Select a medication" /></SelectTrigger>
            <SelectContent>
              {medicationTypes.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {weight && medType && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
            <Weight className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              Calculating for <strong>{medicationTypes.find((m) => m.value === medType)?.label}</strong> ·
              {" "}<strong>{weight} {weightUnit}</strong>
              {weightUnit === "lb" && ` (${(parseFloat(weight) / 2.2046).toFixed(1)} kg)`} ·
              {" "}<strong className="capitalize">{ageGroup}</strong>
            </p>
          </div>
        )}

        <Button onClick={calculate} disabled={!weight || !medType || calculating} className="w-full bg-amber-600 hover:bg-amber-700">
          {calculating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
          {calculating ? "Calculating dosage..." : "Calculate Recommended Dosage"}
        </Button>
      </Card>

      {(exactMath || result) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {exactMath && (
            <Card className="p-5 border-emerald-300 bg-emerald-50/60">
              <h4 className="text-sm font-bold text-emerald-950 mb-2 font-display flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {exactMath.title}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Calculated Dose</span>
                  <span className="font-bold text-emerald-800 text-sm">{exactMath.doseMg}</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Liquid Volume (mL)</span>
                  <span className="font-bold text-emerald-800 text-sm">{exactMath.liquidDose}</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Dosing Frequency</span>
                  <span className="font-medium text-slate-800">{exactMath.frequency}</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Max Safe Daily Limit</span>
                  <span className="font-medium text-slate-800">{exactMath.maxDaily}</span>
                </div>
              </div>
            </Card>
          )}

          {result && (
            <Card className="p-5">
              <FormattedAIResponse content={result} theme="sky" />
            </Card>
          )}
          <div className="flex items-start gap-2 p-4 bg-red-50 rounded-xl border border-red-200 mt-4">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-xs text-red-800">
              This dosage calculator is for educational and informational purposes only. Always consult a licensed healthcare provider or pharmacist before starting or changing any medication dosage. Doses may need adjustment based on medical history, kidney/liver function, and other medications.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}