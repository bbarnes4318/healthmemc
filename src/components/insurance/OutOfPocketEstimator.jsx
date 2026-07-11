import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, DollarSign, AlertCircle, TrendingDown, CheckCircle2 } from "lucide-react";

const commonProcedures = [
  { name: "MRI Scan", typicalCost: 1500 },
  { name: "CT Scan", typicalCost: 1200 },
  { name: "Colonoscopy", typicalCost: 2500 },
  { name: "Endoscopy", typicalCost: 1800 },
  { name: "Knee Arthroscopy", typicalCost: 8000 },
  { name: "Cataract Surgery", typicalCost: 3500 },
  { name: "Hernia Repair", typicalCost: 6000 },
  { name: "Tonsillectomy", typicalCost: 5200 },
  { name: "Gallbladder Removal", typicalCost: 7500 },
  { name: "Cardiac Stress Test", typicalCost: 900 },
  { name: "Physical Therapy (per session)", typicalCost: 150 },
  { name: "Emergency Room Visit", typicalCost: 1200 },
  { name: "Outpatient Surgery", typicalCost: 5000 },
  { name: "Custom", typicalCost: 0 },
];

function CostBreakdownRow({ label, amount, isTotal }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${isTotal ? "border-t pt-2 mt-1" : ""}`}>
      <span className={`text-xs ${isTotal ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm font-medium ${isTotal ? "text-sky-700" : ""}`}>${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
  );
}

export default function OutOfPocketEstimator({ insuranceCards }) {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [procedureName, setProcedureName] = useState("");
  const [procedureCost, setProcedureCost] = useState("");
  const [copay, setCopay] = useState("");
  const [deductible, setDeductible] = useState("");
  const [deductibleMet, setDeductibleMet] = useState("");
  const [coinsurance, setCoinsurance] = useState("");
  const [oopMax, setOopMax] = useState("");

  const selectedCard = insuranceCards?.find((c) => c.id === selectedCardId);

  const selectCard = (id) => {
    setSelectedCardId(id);
    const card = insuranceCards.find((c) => c.id === id);
    if (card) {
      setCopay(card.copay_amount?.toString() || "");
      setDeductible(card.deductible_amount?.toString() || "");
      setDeductibleMet(card.deductible_met?.toString() || "0");
      setCoinsurance(card.coinsurance_percentage?.toString() || "");
      setOopMax(card.out_of_pocket_max?.toString() || "");
    }
  };

  const selectProcedure = (name) => {
    setProcedureName(name);
    const proc = commonProcedures.find((p) => p.name === name);
    if (proc && proc.typicalCost > 0) {
      setProcedureCost(proc.typicalCost.toString());
    }
  };

  const calculation = useMemo(() => {
    const cost = parseFloat(procedureCost);
    if (!cost || cost <= 0) return null;

    const copayAmt = parseFloat(copay) || 0;
    const deductibleTotal = parseFloat(deductible) || 0;
    const deductibleUsed = parseFloat(deductibleMet) || 0;
    const deductibleRemaining = Math.max(0, deductibleTotal - deductibleUsed);
    const coinsurancePct = parseFloat(coinsurance) || 0;
    const oopMaximum = parseFloat(oopMax) || 0;

    // Step 1: Apply copay first (if any)
    const copayApplied = copayAmt;

    // Step 2: Apply deductible to remaining procedure cost
    const afterCopay = cost - copayApplied;
    const deductibleApplied = Math.min(deductibleRemaining, Math.max(0, afterCopay));
    const afterDeductible = Math.max(0, afterCopay - deductibleApplied);

    // Step 3: Apply coinsurance to the amount after deductible
    const patientCoinsurance = afterDeductible * (coinsurancePct / 100);
    const insurancePays = afterDeductible * (1 - coinsurancePct / 100);

    // Step 4: Total out-of-pocket before OOP max
    let totalOOP = copayApplied + deductibleApplied + patientCoinsurance;

    // Step 5: Cap at out-of-pocket maximum
    const oopCapped = oopMaximum > 0 && totalOOP > oopMaximum;
    if (oopCapped) totalOOP = oopMaximum;

    const deductibleRemainingAfter = Math.max(0, deductibleRemaining - deductibleApplied);
    const oopRemaining = oopMaximum > 0 ? Math.max(0, oopMaximum - totalOOP) : null;

    return {
      procedureCost: cost,
      copay: copayApplied,
      deductibleApplied,
      deductibleRemaining: deductibleRemainingAfter,
      coinsuranceAmount: patientCoinsurance,
      insurancePays,
      totalOOP,
      oopCapped,
      oopRemaining,
    };
  }, [procedureCost, copay, deductible, deductibleMet, coinsurance, oopMax]);

  return (
    <Card className="p-5 border-sky-200 bg-gradient-to-br from-sky-50/50 to-white">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
          <Calculator className="w-4 h-4 text-sky-600" />
        </div>
        <h3 className="font-semibold text-sm">Out-of-Pocket Cost Estimator</h3>
      </div>

      <div className="space-y-3">
        {/* Insurance plan selector */}
        {insuranceCards && insuranceCards.length > 0 && (
          <div>
            <Label className="text-xs">Select Insurance Plan</Label>
            <Select value={selectedCardId} onValueChange={selectCard}>
              <SelectTrigger><SelectValue placeholder="Choose a saved plan..." /></SelectTrigger>
              <SelectContent>
                {insuranceCards.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.provider_name}{c.plan_name ? ` — ${c.plan_name}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Procedure selector */}
        <div>
          <Label className="text-xs">Planned Procedure</Label>
          <Select value={procedureName} onValueChange={selectProcedure}>
            <SelectTrigger><SelectValue placeholder="Select a procedure..." /></SelectTrigger>
            <SelectContent>
              {commonProcedures.map((p) => (
                <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Procedure cost */}
        <div>
          <Label className="text-xs">Procedure Cost ($)</Label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input type="number" placeholder="1500" value={procedureCost} onChange={(e) => setProcedureCost(e.target.value)} className="pl-8" />
          </div>
        </div>

        {/* Plan details grid */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Copay ($)</Label>
            <Input type="number" placeholder="25" value={copay} onChange={(e) => setCopay(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Coinsurance (%)</Label>
            <Input type="number" placeholder="20" value={coinsurance} onChange={(e) => setCoinsurance(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Annual Deductible ($)</Label>
            <Input type="number" placeholder="1500" value={deductible} onChange={(e) => setDeductible(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Deductible Met ($)</Label>
            <Input type="number" placeholder="0" value={deductibleMet} onChange={(e) => setDeductibleMet(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Out-of-Pocket Max ($)</Label>
            <Input type="number" placeholder="5000" value={oopMax} onChange={(e) => setOopMax(e.target.value)} />
          </div>
        </div>

        {/* Results */}
        {calculation ? (
          <div className="mt-4 p-4 bg-white rounded-xl border border-sky-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-sky-600" />
              <p className="text-sm font-semibold">Estimated Cost Breakdown</p>
            </div>

            <CostBreakdownRow label="Total Procedure Cost" amount={calculation.procedureCost} />

            {calculation.copay > 0 && (
              <CostBreakdownRow label={`Copay`} amount={calculation.copay} />
            )}

            {calculation.deductibleApplied > 0 && (
              <CostBreakdownRow label="Deductible Portion" amount={calculation.deductibleApplied} />
            )}

            {calculation.coinsuranceAmount > 0 && (
              <CostBreakdownRow label={`Coinsurance Portion (patient)`} amount={calculation.coinsuranceAmount} />
            )}

            <CostBreakdownRow label="Insurance Pays" amount={calculation.insurancePays} />

            <div className="flex items-center justify-between py-2 mt-2 border-t-2 border-sky-300 bg-sky-50 -mx-4 -mb-4 px-4 pb-3 rounded-b-xl">
              <div>
                <p className="text-sm font-bold text-sky-800">Your Out-of-Pocket</p>
                {calculation.oopCapped && (
                  <p className="text-[10px] text-sky-600 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Capped at OOP maximum
                  </p>
                )}
              </div>
              <p className="text-2xl font-bold text-sky-700">${calculation.totalOOP.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>

            {calculation.deductibleRemaining > 0 && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Remaining deductible after this procedure: ${calculation.deductibleRemaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
            {calculation.oopRemaining != null && calculation.oopRemaining > 0 && (
              <p className="text-[10px] text-muted-foreground">
                Remaining OOP max: ${calculation.oopRemaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}

            <div className="flex items-start gap-1.5 mt-3 p-2 bg-amber-50 rounded-lg">
              <AlertCircle className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-800">
                This is an estimate based on your plan details. Actual costs may vary based on network status, negotiated rates, and additional fees. Verify with your insurance provider before proceeding.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Calculator className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            Enter a procedure cost to estimate your out-of-pocket expenses
          </div>
        )}
      </div>
    </Card>
  );
}