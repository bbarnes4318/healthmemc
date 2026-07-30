import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Phone, X, ChevronUp, Loader2, Siren, Stethoscope, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VoiceCallButton from "@/components/layout/VoiceCallButton";

export default function EmergencyCallBar() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [trusted, doctors] = await Promise.all([
        base44.entities.TrustedContact.filter({ status: "active" }, "-created_date", 20).catch(() => []),
        base44.entities.DoctorDirectory.list("-created_date", 20).catch(() => []),
      ]);

      const safeDoctors = Array.isArray(doctors) ? doctors : [];
      const safeTrusted = Array.isArray(trusted) ? trusted : [];

      const phoneContacts = [
        ...safeDoctors
          .filter((d) => d && d.phone)
          .map((d) => ({
            id: d.id,
            name: d.doctor_name,
            subtitle: d.specialty || "Doctor",
            phone: d.phone,
            type: "doctor",
          })),
        ...safeTrusted
          .filter((t) => t && t.phone && t.alert_emergencies)
          .map((t) => ({
            id: t.id,
            name: t.name,
            subtitle: t.relationship || t.role,
            phone: t.phone,
            type: "contact",
          })),
      ];
      setContacts(phoneContacts);
    } catch (e) {
      console.error("EmergencyCallBar load error:", e);
      setContacts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleCount = expanded ? contacts.length : 2;
  const visibleContacts = contacts.slice(0, visibleCount);

  return (
    <div className="bg-red-50 border-b border-red-200 px-3 py-1.5 flex items-center gap-2 overflow-x-auto">
      {/* 911 - always present */}
      <a
        href="tel:911"
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shrink-0"
      >
        <Siren className="w-3.5 h-3.5" />
        911
      </a>

      <div className="w-px h-5 bg-red-200 shrink-0" />

      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400 shrink-0" />
      ) : (
        <>
          {visibleContacts.map((c) => (
            <a
              key={c.id}
              href={`tel:${c.phone}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-red-200 text-xs font-medium hover:bg-red-100 transition shrink-0 group"
            >
              {c.type === "doctor" ? (
                <Stethoscope className="w-3 h-3 text-red-500" />
              ) : (
                <User className="w-3 h-3 text-red-500" />
              )}
              <span className="truncate max-w-[100px]">{c.name}</span>
              <Phone className="w-2.5 h-2.5 text-red-400 group-hover:text-red-600" />
            </a>
          ))}

          {contacts.length === 0 && !loading && (
            <span className="text-[10px] text-red-400 italic shrink-0">
              Add doctors or trusted contacts with phone numbers for quick dial
            </span>
          )}

          {contacts.length > 2 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-white border border-red-200 text-[10px] font-medium text-red-600 hover:bg-red-100 transition shrink-0"
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3" /> Less</>
              ) : (
                <><Phone className="w-3 h-3" /> +{contacts.length - 2} more</>
              )}
            </button>
          )}
        </>
      )}

      <div className="w-px h-5 bg-red-200 shrink-0" />
      <VoiceCallButton contacts={contacts} />
    </div>
  );
}