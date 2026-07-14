import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, DollarSign, Receipt } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";

const STATUS_STYLES = {
  paid: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Paid" },
  partially_paid: { bg: "bg-amber-100", text: "text-amber-700", label: "Partial" },
  approved: { bg: "bg-sky-100", text: "text-sky-700", label: "Approved" },
  pending: { bg: "bg-gray-100", text: "text-gray-700", label: "Pending" },
  submitted: { bg: "bg-violet-100", text: "text-violet-700", label: "Submitted" },
  denied: { bg: "bg-red-100", text: "text-red-700", label: "Denied" },
};

function fmtMoney(n) {
  if (n === null || n === undefined) return "—";
  return `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function InsuranceSummaryCard() {
  const [card, setCard] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cards, claimData] = await Promise.all([
          base44.entities.InsuranceCard.list(),
          base44.entities.InsuranceClaim.filter({}, "-service_date", 10),
        ]);
        setCard(cards[0] || null);
        setClaims(claimData);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const totals = useMemo(() => {
    const totalBilled = claims.reduce((s, c) => s + (c.billed_amount || 0), 0);
    const totalPaid = claims.reduce((s, c) => s + (c.insurance_paid || 0), 0);
    const totalPatient = claims.reduce((s, c) => s + (c.patient_responsibility || 0), 0);
    return { totalBilled, totalPaid, totalPatient };
  }, [claims]);

  const deductibleAmount = card?.deductible_amount || 0;
  const deductibleMet = card?.deductible_met || 0;
  const deductiblePct = deductibleAmount > 0 ? Math.min(100, (deductibleMet / deductibleAmount) * 100) : 0;
  const remaining = Math.max(0, deductibleAmount - deductibleMet);

  const oopMax = card?.out_of_pocket_max || 0;
  const oopMet = totals.totalPatient;
  const oopPct = oopMax > 0 ? Math.min(100, (oopMet / oopMax) * 100) : 0;

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <h3 className="font-display font-semibold text-sm">Insurance Summary</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      </Card>
    );
  }

  if (!card) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <h3 className="font-display font-semibold text-sm">Insurance Summary</h3>
        </div>
        <div className="flex flex-col items-center py-6 text-center">
          <ShieldCheck className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No insurance card on file</p>
          <Link to="/insurance-tracker" className="text-xs text-sky-600 hover:underline mt-1">Add your insurance info</Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <h3 className="font-display font-semibold text-sm truncate">Insurance Summary</h3>
          {card.provider_name && (
            <span className="text-xs text-muted-foreground truncate">· {card.provider_name}</span>
          )}
        </div>
        <Link to="/insurance-tracker" className="text-xs text-sky-600 hover:underline shrink-0">View all</Link>
      </div>

      {/* Deductible & Out-of-Pocket Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Deductible */}
        <div className="rounded-xl bg-indigo-50/50 p-3 border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-indigo-700">Deductible</p>
            <p className="text-xs font-semibold text-indigo-600">{deductiblePct.toFixed(0)}% met</p>
          </div>
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-lg font-display font-bold text-indigo-700">{fmtMoney(deductibleMet)}</span>
            <span className="text-xs text-muted-foreground">of {fmtMoney(deductibleAmount)}</span>
          </div>
          <div className="w-full h-2.5 bg-indigo-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${deductiblePct}%` }} />
          </div>
          {remaining > 0 ? (
            <p className="text-[10px] text-muted-foreground mt-1.5">{fmtMoney(remaining)} remaining until deductible met</p>
          ) : (
            <p className="text-[10px] text-emerald-600 font-medium mt-1.5">✓ Deductible fully met</p>
          )}
        </div>

        {/* Out-of-Pocket Max */}
        {oopMax > 0 && (
          <div className="rounded-xl bg-rose-50/50 p-3 border border-rose-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-rose-700">Out-of-Pocket Max</p>
              <p className="text-xs font-semibold text-rose-600">{oopPct.toFixed(0)}% met</p>
            </div>
            <div className="flex items-end justify-between mb-1.5">
              <span className="text-lg font-display font-bold text-rose-700">{fmtMoney(oopMet)}</span>
              <span className="text-xs text-muted-foreground">of {fmtMoney(oopMax)}</span>
            </div>
            <div className="w-full h-2.5 bg-rose-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${oopPct}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">{fmtMoney(Math.max(0, oopMax - oopMet))} remaining</p>
          </div>
        )}
      </div>

      {/* Totals Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg bg-muted/40 p-2.5 text-center">
          <DollarSign className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
          <p className="text-[9px] text-muted-foreground uppercase">Total Billed</p>
          <p className="text-sm font-display font-bold">{fmtMoney(totals.totalBilled)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2.5 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mx-auto mb-1" />
          <p className="text-[9px] text-emerald-700 uppercase">Insurance Paid</p>
          <p className="text-sm font-display font-bold text-emerald-700">{fmtMoney(totals.totalPaid)}</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-2.5 text-center">
          <Receipt className="w-3.5 h-3.5 text-amber-600 mx-auto mb-1" />
          <p className="text-[9px] text-amber-700 uppercase">Your Cost</p>
          <p className="text-sm font-display font-bold text-amber-700">{fmtMoney(totals.totalPatient)}</p>
        </div>
      </div>

      {/* Recent Claims Table */}
      {claims.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recent Claims</h4>
          <div className="space-y-1.5">
            {claims.slice(0, 5).map((claim) => {
              const sStyle = STATUS_STYLES[claim.status] || STATUS_STYLES.pending;
              return (
                <div key={claim.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{claim.service_description}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {claim.service_date ? format(parseISO(claim.service_date), "MMM d, yyyy") : "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold">{fmtMoney(claim.patient_responsibility || 0)}</p>
                    <p className="text-[9px] text-muted-foreground">of {fmtMoney(claim.billed_amount || 0)}</p>
                  </div>
                  <Badge variant="outline" className={`text-[8px] shrink-0 ${sStyle.bg} ${sStyle.text} border-transparent`}>
                    {sStyle.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}