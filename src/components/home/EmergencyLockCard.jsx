import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Phone, AlertTriangle, Heart, Pill, Activity, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function EmergencyLockCard({ open, onClose }) {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [medications, setMedications] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const load = async () => {
      try {
        const [u, profiles, meds, trusted] = await Promise.all([
          base44.auth.me(),
          base44.entities.HealthProfile.filter({}),
          base44.entities.Medication.filter({ active: true }),
          base44.entities.TrustedContact.filter({ status: "active" }),
        ]);
        setUser(u);
        setProfile(profiles[0] || null);
        setMedications(meds);
        setContacts(trusted);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [open]);

  const bloodType = profile?.blood_type && profile.blood_type !== "unknown" ? profile.blood_type : "Unknown";
  const allergies = profile?.allergies || [];
  const conditions = profile?.chronic_conditions || [];
  const emergencyContact = contacts[0] || null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-red-950/95 backdrop-blur-sm overflow-y-auto"
        >
          <div className="min-h-full flex flex-col items-center p-4 sm:p-6">
            <button onClick={onClose} className="self-end text-white/80 hover:text-white p-2 -mr-2 shrink-0">
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-display font-bold text-white tracking-wide">EMERGENCY INFO</h1>
              <p className="text-sm text-red-200 mt-0.5">In Case of Emergency</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
              {/* Name banner */}
              <div className="bg-red-600 p-4 text-white">
                <p className="text-xl font-bold">{user?.full_name || "Unknown"}</p>
                <p className="text-sm text-red-100 mt-0.5">
                  {profile?.date_of_birth && `DOB: ${format(parseISO(profile.date_of_birth), "MMM d, yyyy")}`}
                  {profile?.gender && profile.gender !== "prefer_not_to_say" && ` · ${profile.gender}`}
                </p>
              </div>

              <div className="p-4 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Blood Type — prominent */}
                    <div className="text-center py-4 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Blood Type</p>
                      <p className="text-5xl font-display font-bold text-red-700 mt-1">{bloodType}</p>
                    </div>

                    {/* Allergies */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide">Allergies</h3>
                      </div>
                      {allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {allergies.map((a, i) => (
                            <span key={i} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium">{a}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No known allergies</p>
                      )}
                    </div>

                    {/* Conditions */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-sky-600 shrink-0" />
                        <h3 className="text-sm font-bold text-sky-700 uppercase tracking-wide">Conditions</h3>
                      </div>
                      {conditions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {conditions.map((c, i) => (
                            <span key={i} className="px-3 py-1.5 bg-sky-100 text-sky-700 rounded-lg text-sm font-medium">{c}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No chronic conditions</p>
                      )}
                    </div>

                    {/* Medications */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="w-4 h-4 text-emerald-600 shrink-0" />
                        <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide">Medications</h3>
                      </div>
                      {medications.length > 0 ? (
                        <div className="space-y-1.5">
                          {medications.map((m, i) => (
                            <div key={i} className="text-sm flex justify-between items-center p-2 bg-emerald-50 rounded-lg">
                              <span className="font-medium">{m.name}</span>
                              <span className="text-gray-500 text-xs">{m.dosage}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No active medications</p>
                      )}
                    </div>

                    {/* Emergency Contact */}
                    {emergencyContact && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-indigo-600 shrink-0" />
                          <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide">Emergency Contact</h3>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{emergencyContact.name}</p>
                            {emergencyContact.relationship && (
                              <p className="text-xs text-gray-500">{emergencyContact.relationship}</p>
                            )}
                          </div>
                          {emergencyContact.phone && (
                            <a
                              href={`tel:${emergencyContact.phone}`}
                              className="bg-indigo-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5 shrink-0 hover:bg-indigo-700"
                            >
                              <Phone className="w-4 h-4" /> Call
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 911 Button */}
            <a
              href="tel:911"
              className="mt-5 w-full max-w-md bg-red-600 hover:bg-red-700 text-white rounded-2xl py-4 flex items-center justify-center gap-2 text-lg font-bold shadow-lg shadow-red-900/50 transition-colors"
            >
              <Phone className="w-5 h-5" /> Call 911
            </a>

            <p className="text-xs text-red-200/60 mt-4 text-center max-w-md">
              This card is designed for first responders. Keep your health profile updated for accuracy.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}