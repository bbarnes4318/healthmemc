import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  Pill, Loader2, AlertTriangle, CheckCircle, Clock, Mail,
  Package, RefreshCw, Boxes, TrendingDown, Edit2, Save
} from "lucide-react";
import { motion } from "framer-motion";

function parseDosesPerDay(frequency, timeOfDay) {
  if (timeOfDay && timeOfDay.length > 0) return timeOfDay.length;
  if (!frequency) return 1;
  const f = frequency.toLowerCase();
  if (f.includes("as needed") || f.includes("prn")) return 0;
  if (f.includes("four") || f.includes("4x") || f.includes("qid")) return 4;
  if (f.includes("three") || f.includes("3x") || f.includes("tid")) return 3;
  if (f.includes("twice") || f.includes("2x") || f.includes("bid")) return 2;
  if (f.includes("once") || f.includes("1x") || f.includes("daily") || f.includes("qd")) return 1;
  const match = f.match(/every\s+(\d+)\s*hours?/);
  if (match) return Math.floor(24 / parseInt(match[1]));
  return 1;
}

function getSupplyStatus(daysRemaining, remaining) {
  if (remaining != null && remaining <= 0) return { level: "empty", label: "Empty", color: "text-red-700", bg: "bg-red-100", bar: "bg-red-500", border: "border-red-300" };
  if (daysRemaining == null) return { level: "unknown", label: "Set Supply", color: "text-muted-foreground", bg: "bg-muted", bar: "bg-muted-foreground", border: "border-border" };
  if (daysRemaining <= 3) return { level: "critical", label: "Critical", color: "text-red-700", bg: "bg-red-100", bar: "bg-red-500", border: "border-red-300" };
  if (daysRemaining <= 7) return { level: "low", label: "Low Supply", color: "text-amber-700", bg: "bg-amber-100", bar: "bg-amber-500", border: "border-amber-300" };
  if (daysRemaining <= 14) return { level: "moderate", label: "Moderate", color: "text-sky-700", bg: "bg-sky-100", bar: "bg-sky-500", border: "border-sky-300" };
  return { level: "ok", label: "Well Stocked", color: "text-emerald-700", bg: "bg-emerald-100", bar: "bg-emerald-500", border: "border-emerald-300" };
}

export default function PharmacyInventoryTracker() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [requestingRefill, setRequestingRefill] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
      const [meds, medLogs] = await Promise.all([
        base44.entities.Medication.filter(filter),
        base44.entities.MedicationLog.filter({ status: "taken" }),
      ]);
      setMedications(meds);
      setLogs(medLogs);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentMemberId]);

  useEffect(() => { load(); }, [load]);

  const inventory = useMemo(() => {
    return medications.map((med) => {
      const dosesPerDay = parseDosesPerDay(med.frequency, med.time_of_day);
      const refDate = med.refill_date ? new Date(med.refill_date) : (med.start_date ? new Date(med.start_date) : null);
      const takenCount = logs.filter((l) => {
        if (l.medication_name !== med.name) return false;
        if (refDate) {
          const logDate = new Date(l.scheduled_date || l.taken_at || l.created_date);
          if (logDate < refDate) return false;
        }
        return true;
      }).length;
      const originalSupply = med.supply_quantity || 0;
      const remaining = Math.max(0, originalSupply - takenCount);
      const daysRemaining = dosesPerDay > 0 && originalSupply > 0 ? Math.floor(remaining / dosesPerDay) : null;
      const pct = originalSupply > 0 ? Math.round((remaining / originalSupply) * 100) : 0;
      return { ...med, remaining, dosesPerDay, daysRemaining, takenCount, originalSupply, pct, status: getSupplyStatus(daysRemaining, remaining) };
    }).sort((a, b) => {
      // Sort by urgency: empty > critical > low > moderate > ok > unknown
      const order = { empty: 0, critical: 1, low: 2, moderate: 3, ok: 4, unknown: 5 };
      return (order[a.status.level] ?? 5) - (order[b.status.level] ?? 5);
    });
  }, [medications, logs]);

  const summary = useMemo(() => {
    const total = inventory.length;
    const critical = inventory.filter((m) => m.status.level === "critical" || m.status.level === "empty").length;
    const low = inventory.filter((m) => m.status.level === "low").length;
    const ok = inventory.filter((m) => m.status.level === "ok" || m.status.level === "moderate").length;
    const needsRefill = inventory.filter((m) => m.status.level === "critical" || m.status.level === "empty" || m.status.level === "low").length;
    return { total, critical, low, ok, needsRefill };
  }, [inventory]);

  const handleSaveSupply = async (medId) => {
    setSavingId(medId);
    try {
      const val = parseInt(editValue);
      if (isNaN(val) || val < 0) {
        toast({ title: "Invalid quantity", variant: "destructive" });
        return;
      }
      await base44.entities.Medication.update(medId, { supply_quantity: val, refill_requested: false });
      setEditingId(null);
      setEditValue("");
      load();
      toast({ title: "Supply updated" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to update", variant: "destructive" });
    }
    setSavingId(null);
  };

  const handleRequestRefill = async (med) => {
    setRequestingRefill(med.id);
    try {
      const user = await base44.auth.me();
      if (user?.email) {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `Refill Request: ${med.name}`,
          body: `This is a reminder from Health Me Medical Center to request a refill for your medication.\n\nMedication: ${med.name}\nDosage: ${med.dosage}\nFrequency: ${med.frequency}\nRemaining: ${med.remaining} units (${med.daysRemaining ?? "?"} ${med.daysRemaining === 1 ? "day" : "days"} until empty)\nPrescribing Provider: ${med.prescribing_provider || "Not specified"}\n\nPlease contact your provider or pharmacy to request a refill before you run out.\n\n— Health Me Medical Center`,
        });
      }
      await base44.entities.Medication.update(med.id, { refill_requested: true });
      load();
      toast({ title: "Refill reminder sent", description: `Notification sent for ${med.name}` });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to send reminder", variant: "destructive" });
    }
    setRequestingRefill(null);
  };

  if (loading) {
    return (
      <Card className="p-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </Card>
    );
  }

  if (medications.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No active medications</p>
        <p className="text-xs text-muted-foreground mt-1">Add medications in the Pharmacy to track your supply inventory.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Boxes className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Pharmacy Inventory Tracker</h3>
          <p className="text-xs text-muted-foreground">Monitor medication supply and get alerted before you run out</p>
        </div>
        <Button size="sm" variant="ghost" onClick={load} className="h-7 text-xs">
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
          <p className="text-lg font-display font-bold text-foreground">{summary.total}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Total Meds</p>
        </div>
        <div className="rounded-lg bg-red-50 p-2.5 text-center border border-red-100">
          <p className="text-lg font-display font-bold text-red-700">{summary.critical}</p>
          <p className="text-[9px] text-red-600 uppercase">Critical</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-2.5 text-center border border-amber-100">
          <p className="text-lg font-display font-bold text-amber-700">{summary.low}</p>
          <p className="text-[9px] text-amber-600 uppercase">Low</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2.5 text-center border border-emerald-100">
          <p className="text-lg font-display font-bold text-emerald-700">{summary.ok}</p>
          <p className="text-[9px] text-emerald-600 uppercase">In Stock</p>
        </div>
      </div>

      {/* Alert banner */}
      {summary.needsRefill > 0 && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-xs text-red-800">
              <span className="font-semibold">{summary.needsRefill} medication{summary.needsRefill !== 1 ? "s" : ""}</span> need a refill soon. Request refills below to avoid running out.
            </p>
          </div>
        </motion.div>
      )}

      {/* Medication inventory list */}
      <div className="space-y-3">
        {inventory.map((med) => {
          const isEditing = editingId === med.id;
          return (
            <div key={med.id} className={`p-3 rounded-lg border ${med.status.border} bg-card`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg ${med.status.bg} flex items-center justify-center shrink-0`}>
                  <Pill className={`w-4 h-4 ${med.status.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{med.name}</p>
                    <span className="text-xs text-muted-foreground">{med.dosage}</span>
                    <Badge variant="outline" className={`text-[9px] ${med.status.bg} ${med.status.color} ${med.status.border}`}>
                      {med.status.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {med.dosesPerDay > 0 ? `${med.dosesPerDay}×/day` : "As needed"}
                    {med.prescribing_provider ? ` · ${med.prescribing_provider}` : ""}
                  </p>

                  {/* Supply bar */}
                  {med.originalSupply > 0 ? (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">
                          {med.remaining} of {med.originalSupply} remaining
                          {med.takenCount > 0 && ` · ${med.takenCount} taken`}
                        </span>
                        {med.daysRemaining != null && (
                          <span className={`text-[10px] font-semibold ${med.status.color}`}>
                            {med.daysRemaining} {med.daysRemaining === 1 ? "day" : "days"} left
                          </span>
                        )}
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${med.status.bar} transition-all`}
                          style={{ width: `${med.pct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">No supply quantity set —</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Qty"
                            className="h-6 w-16 text-xs px-2"
                            autoFocus
                          />
                          <Button size="icon" className="h-6 w-6" onClick={() => handleSaveSupply(med.id)} disabled={savingId === med.id}>
                            {savingId === med.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => { setEditingId(med.id); setEditValue(""); }}>
                          <Edit2 className="w-2.5 h-2.5 mr-1" /> Set quantity
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {med.originalSupply > 0 && !isEditing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2"
                      onClick={() => { setEditingId(med.id); setEditValue(String(med.originalSupply)); }}
                    >
                      <Edit2 className="w-2.5 h-2.5 mr-0.5" /> Edit
                    </Button>
                  )}
                  {isEditing && med.originalSupply > 0 && (
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  )}
                  {isEditing && med.originalSupply === 0 && null}
                  {med.originalSupply > 0 && isEditing && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Qty"
                        className="h-6 w-16 text-xs px-2"
                      />
                      <Button size="icon" className="h-6 w-6" onClick={() => handleSaveSupply(med.id)} disabled={savingId === med.id}>
                        {savingId === med.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      </Button>
                    </div>
                  )}
                  {med.refill_requested ? (
                    <span className="text-[9px] text-emerald-600 flex items-center gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" /> Refill requested
                    </span>
                  ) : med.originalSupply > 0 && (med.status.level === "critical" || med.status.level === "empty" || med.status.level === "low") && !isEditing ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-6 text-[10px] ${med.status.color} ${med.status.border} hover:bg-muted`}
                      disabled={requestingRefill === med.id}
                      onClick={() => handleRequestRefill(med)}
                    >
                      {requestingRefill === med.id ? <Loader2 className="w-2.5 h-2.5 animate-spin mr-0.5" /> : <Mail className="w-2.5 h-2.5 mr-0.5" />}
                      Request Refill
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}