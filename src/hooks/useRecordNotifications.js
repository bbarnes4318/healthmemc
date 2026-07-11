import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

export function useRecordNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const knownIdsRef = useRef(new Set());

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "unsupported";
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  // Seed known IDs on mount so we don't notify for pre-existing records
  useEffect(() => {
    const seed = async () => {
      try {
        const records = await base44.entities.MedicalRecord.list("-created_date", 100);
        records.forEach((r) => knownIdsRef.current.add(r.id));
      } catch (err) { console.error(err); }
    };
    seed();
  }, []);

  // Subscribe to real-time MedicalRecord changes
  useEffect(() => {
    const unsubscribe = base44.entities.MedicalRecord.subscribe((event) => {
      if (event.type !== "create") return;
      if (knownIdsRef.current.has(event.data.id)) return;
      knownIdsRef.current.add(event.data.id);

      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

      const record = event.data;
      const isLabResult = record.category === "lab_results";
      const title = isLabResult ? "🔬 New Lab Result Uploaded" : "📄 New Medical Record Added";
      const body = record.title
        ? `${record.title}${record.provider ? ` — ${record.provider}` : ""}`
        : "A new record has been added to your profile.";

      try {
        new Notification(title, { body, tag: record.id });
      } catch (e) { console.error(e); }
    });
    return unsubscribe;
  }, []);

  return { permission, requestPermission };
}