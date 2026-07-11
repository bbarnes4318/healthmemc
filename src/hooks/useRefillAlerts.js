import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";

export function parseDosesPerDay(frequency, timeOfDay) {
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

const ALERT_THRESHOLD_DAYS = 7;
const CRITICAL_THRESHOLD_DAYS = 3;

export function useRefillAlerts(enabled = true) {
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const notifiedRef = useRef(new Set());

  const load = useCallback(async () => {
    try {
      const [meds, medLogs] = await Promise.all([
        base44.entities.Medication.filter({ active: true }),
        base44.entities.MedicationLog.filter({ status: "taken" }),
      ]);
      setMedications(meds);
      setLogs(medLogs);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  const refillAlerts = useMemo(() => {
    return medications
      .filter((m) => m.supply_quantity != null && m.supply_quantity > 0)
      .map((med) => {
        const dosesPerDay = parseDosesPerDay(med.frequency, med.time_of_day);
        const refDate = med.refill_date
          ? new Date(med.refill_date)
          : med.start_date
          ? new Date(med.start_date)
          : null;
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
        const isCritical = daysRemaining !== null && daysRemaining <= CRITICAL_THRESHOLD_DAYS;
        const needsRefill = daysRemaining !== null && daysRemaining <= ALERT_THRESHOLD_DAYS;
        return { ...med, remaining, dosesPerDay, daysRemaining, takenCount, isCritical, needsRefill };
      })
      .filter((m) => m.needsRefill)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [medications, logs]);

  // Fire browser notifications for critical refills (once per medication per session)
  useEffect(() => {
    if (!enabled) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    refillAlerts.forEach((med) => {
      if (med.isCritical && !notifiedRef.current.has(med.id)) {
        notifiedRef.current.add(med.id);
        try {
          new Notification(`💊 Refill needed: ${med.name}`, {
            body: `Only ${med.daysRemaining} ${med.daysRemaining === 1 ? "day" : "days"} of supply left (${med.remaining} pills). Request a refill now.`,
            tag: `refill-${med.id}`,
          });
        } catch (e) { console.error(e); }
      }
    });
  }, [enabled, refillAlerts]);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "unsupported";
    const result = await Notification.requestPermission();
    return result;
  }, []);

  return {
    refillAlerts,
    loading,
    refresh: load,
    requestNotificationPermission,
    criticalCount: refillAlerts.filter((m) => m.isCritical).length,
  };
}