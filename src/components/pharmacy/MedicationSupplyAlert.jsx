import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Pill, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";

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

export default function MedicationSupplyAlert() {
  const { currentMemberId } = useFamilyMember();
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const filter = currentMemberId
        ? { family_member_id: currentMemberId, active: true }
        : { active: true };
      const [meds, medLogs] = await Promise.all([
        base44.entities.Medication.filter(filter),
        base44.entities.MedicationLog.filter({ status: "taken" }),
      ]);
      setMedications(meds);
      setLogs(medLogs);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const lowSupplyMeds = useMemo(() => {
    return medications
      .filter((m) => m.supply_quantity != null && m.supply_quantity > 0)
      .map((med) => {
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
        const remaining = Math.max(0, med.supply_quantity - takenCount);
        const daysRemaining = dosesPerDay > 0 ? Math.floor(remaining / dosesPerDay) : null;
        return { ...med, remaining, dosesPerDay, daysRemaining, takenCount };
      })
      .filter((m) => m.daysRemaining !== null && m.daysRemaining <= 7)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [medications, logs]);

  if (loading || lowSupplyMeds.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4 border-red-200 bg-red-50">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-semibold text-red-700">Low Medication Supply</h3>
          <span className="text-xs text-red-500 ml-auto">{lowSupplyMeds.length} need refill</span>
        </div>
        <div className="space-y-2">
          {lowSupplyMeds.map((med) => (
            <div key={med.id} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-red-100">
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <Pill className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{med.name} <span className="text-xs text-muted-foreground">{med.dosage}</span></p>
                <p className="text-xs text-muted-foreground">
                  {med.remaining} pills left · {med.dosesPerDay}×/day
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${med.daysRemaining <= 2 ? "text-red-600" : "text-amber-600"}`}>
                  {med.daysRemaining} {med.daysRemaining === 1 ? "day" : "days"}
                </p>
                <p className="text-[10px] text-muted-foreground">until empty</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}