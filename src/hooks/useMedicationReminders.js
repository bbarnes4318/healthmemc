import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

function parseTime(timeStr) {
  if (!timeStr) return null;
  const match24 = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1]);
    const m = parseInt(match24[2]);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) return { hours: h, minutes: m };
  }
  const match12 = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let h = parseInt(match12[1]);
    const m = parseInt(match12[2]);
    const period = match12[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return { hours: h, minutes: m };
  }
  return null;
}

export function useMedicationReminders(enabled) {
  const [medications, setMedications] = useState([]);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [todayReminders, setTodayReminders] = useState([]);
  const sentRef = useRef(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const meds = await base44.entities.Medication.filter({ active: true });
        setMedications(meds);
      } catch (err) { console.error(err); }
    };
    if (enabled) load(); else setMedications([]);
  }, [enabled]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "unsupported";
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  useEffect(() => {
    if (!enabled || medications.length === 0) {
      setTodayReminders([]);
      return;
    }
    const today = new Date().toDateString();
    const reminders = [];
    medications.forEach((med) => {
      const times = med.time_of_day || [];
      times.forEach((time) => {
        const parsed = parseTime(time);
        if (!parsed) return;
        const scheduledDate = new Date();
        scheduledDate.setHours(parsed.hours, parsed.minutes, 0, 0);
        reminders.push({
          key: `${med.id}-${time}-${today}`,
          medId: med.id,
          medName: med.name,
          dosage: med.dosage,
          time,
          scheduledDate,
          passed: scheduledDate < new Date(),
        });
      });
    });
    reminders.sort((a, b) => a.scheduledDate - b.scheduledDate);
    setTodayReminders(reminders);
  }, [medications, enabled]);

  useEffect(() => {
    if (!enabled || permission !== "granted") return;
    const check = () => {
      const now = new Date();
      const todayKey = now.toDateString();
      // Reset sent set at midnight
      if (sentRef.current.size > 0) {
        const oldestKey = sentRef.current.values().next().value;
        if (oldestKey && !oldestKey.includes(todayKey)) {
          sentRef.current.clear();
        }
      }
      todayReminders.forEach((r) => {
        if (r.passed) return;
        const diff = now - r.scheduledDate;
        if (diff >= 0 && diff < 60000 && !sentRef.current.has(r.key)) {
          sentRef.current.add(r.key);
          try {
            new Notification(`💊 ${r.medName} — ${r.dosage || "Time to take medication"}`, {
              body: `Scheduled for ${r.time}. Tap to log in the Pharmacy section.`,
              tag: r.key,
            });
          } catch (e) { console.error(e); }
        }
      });
    };
    const interval = setInterval(check, 30000);
    check();
    return () => clearInterval(interval);
  }, [enabled, permission, todayReminders]);

  return { medications, permission, todayReminders, requestPermission };
}