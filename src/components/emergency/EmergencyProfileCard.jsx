import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Droplet, Pill, AlertTriangle, Users, Phone, Mail, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function EmergencyProfileCard() {
  const [profile, setProfile] = useState(null);
  const [medications, setMedications] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profiles, meds, trusted] = await Promise.all([
          base44.entities.HealthProfile.filter({}),
          base44.entities.Medication.filter({ active: true }),
          base44.entities.TrustedContact.filter({ status: "active" }),
        ]);
        setProfile(profiles[0] || null);
        setMedications(meds);
        setContacts(trusted);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-red-600" /></div>
      </Card>
    );
  }

  const allergies = profile?.allergies || [];
  const bloodType = profile?.blood_type && profile.blood_type !== "unknown" ? profile.blood_type : null;

  return (
    <Card className="p-5 border-red-200">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-4 h-4 text-red-600" />
        <h3 className="font-semibold text-sm">Emergency Profile Summary</h3>
        <Badge variant="outline" className="text-[9px] bg-red-50 text-red-700 border-red-200 ml-auto">Shareable</Badge>
      </div>

      <div className="space-y-3">
        {/* Blood Type */}
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <Droplet className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground">Blood Type</p>
            <p className="text-sm font-bold text-red-700">{bloodType || "Not specified"}</p>
          </div>
        </div>

        {/* Allergies */}
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <p className="text-xs font-semibold text-orange-700">Allergies</p>
          </div>
          {allergies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((a, i) => (
                <Badge key={i} variant="outline" className="text-[10px] bg-white text-orange-700 border-orange-300">{a}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No known allergies</p>
          )}
        </div>

        {/* Current Medications */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Pill className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-semibold text-blue-700">Current Medications ({medications.length})</p>
          </div>
          {medications.length > 0 ? (
            <div className="space-y-1">
              {medications.map((med) => (
                <div key={med.id} className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-blue-800">{med.name}</span>
                  <span className="text-blue-600">{med.dosage}</span>
                  <span className="text-[10px] text-muted-foreground">· {med.frequency}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No active medications</p>
          )}
        </div>

        {/* Trusted Contacts */}
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-semibold text-emerald-700">Trusted Contacts ({contacts.length})</p>
          </div>
          {contacts.length > 0 ? (
            <div className="space-y-1.5">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-emerald-800">{c.name}</span>
                  {c.relationship && <span className="text-[10px] text-muted-foreground">({c.relationship})</span>}
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="flex items-center gap-0.5 text-emerald-600 hover:underline ml-auto">
                      <Phone className="w-3 h-3" />{c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="flex items-center gap-0.5 text-emerald-600 hover:underline">
                      <Mail className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No trusted contacts added</p>
          )}
        </div>

        {/* Emergency Contact from Profile */}
        {profile?.emergency_contact_name && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-semibold text-amber-700">Primary Emergency Contact</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-amber-800">{profile.emergency_contact_name}</span>
              {profile.emergency_contact_relationship && <span className="text-[10px] text-muted-foreground">({profile.emergency_contact_relationship})</span>}
              {profile.emergency_contact_phone && (
                <a href={`tel:${profile.emergency_contact_phone}`} className="text-amber-600 hover:underline ml-auto">{profile.emergency_contact_phone}</a>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}