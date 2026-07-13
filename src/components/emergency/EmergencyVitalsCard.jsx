import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Heart, Activity, Pill, Droplet, User } from "lucide-react";
import { motion } from "framer-motion";

export default function EmergencyVitalsCard() {
  const [profile, setProfile] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profiles, vit, meds] = await Promise.all([
          base44.entities.HealthProfile.filter({}),
          base44.entities.VitalRecord.list("-recorded_at", 50),
          base44.entities.Medication.filter({ active: true }),
        ]);
        setProfile(profiles[0] || null);
        setVitals(vit);
        setMedications(meds);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const getLatestVital = (type) => {
    const filtered = vitals.filter((v) => v.type === type);
    return filtered.length > 0 ? filtered[0] : null;
  };

  const bp = getLatestVital("blood_pressure");
  const hr = getLatestVital("heart_rate");
  const glucose = getLatestVital("blood_glucose");
  const temp = getLatestVital("temperature");
  const spo2 = getLatestVital("oxygen_saturation");

  const handlePrint = () => {
    const printContent = document.getElementById("emergency-vitals-print").innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Emergency Vitals Card</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; background: #fff; }
        .card { max-width: 500px; margin: 0 auto; border: 3px solid #dc2626; border-radius: 12px; padding: 24px; }
        .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 12px; margin-bottom: 16px; }
        .header h1 { color: #dc2626; font-size: 22px; }
        .header p { font-size: 12px; color: #666; }
        .patient { background: #fef2f2; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
        .patient-name { font-size: 18px; font-weight: bold; }
        .patient-info { font-size: 13px; color: #444; }
        .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #dc2626; margin-bottom: 8px; margin-top: 14px; }
        .vitals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .vital-box { border: 1px solid #ddd; border-radius: 8px; padding: 10px; text-align: center; }
        .vital-label { font-size: 10px; color: #666; text-transform: uppercase; }
        .vital-value { font-size: 22px; font-weight: bold; color: #1a1a1a; }
        .vital-unit { font-size: 11px; color: #888; }
        .meds-list { font-size: 12px; }
        .med-item { padding: 4px 0; border-bottom: 1px solid #eee; }
        .med-name { font-weight: bold; }
        .allergies { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px; margin-top: 10px; }
        .footer { margin-top: 16px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
      </style></head><body>${printContent}</body></html>
    `);
    win.document.close();
    win.print();
  };

  if (loading) {
    return (
      <Card className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
      </Card>
    );
  }

  const bloodType = profile?.blood_type && profile.blood_type !== "unknown" ? profile.blood_type : null;
  const allergies = profile?.allergies || [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 border-red-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-sm">Emergency Vitals Card</h3>
              <p className="text-xs text-muted-foreground">Latest vitals & medications for first responders</p>
            </div>
          </div>
          <Button onClick={handlePrint} size="sm" className="bg-red-600 hover:bg-red-700">
            <Printer className="w-4 h-4 mr-1.5" /> Print Card
          </Button>
        </div>

        {/* Printable Content */}
        <div id="emergency-vitals-print">
          <div className="card">
            <div className="header">
              <h1>EMERGENCY VITALS CARD</h1>
              <p>Health Me Medical Center · Generated {new Date().toLocaleDateString()}</p>
            </div>

            {/* Patient Info */}
            <div className="patient">
              <div className="patient-name">{profile?.full_name || "Patient"}</div>
              <div className="patient-info">
                {profile?.date_of_birth && `DOB: ${new Date(profile.date_of_birth).toLocaleDateString()} · `}
                {profile?.gender && `Gender: ${profile.gender} · `}
                {bloodType && `Blood Type: ${bloodType}`}
              </div>
            </div>

            {/* Allergies */}
            {allergies.length > 0 && (
              <div className="allergies">
                <div className="section-title" style={{ color: "#ea580c", marginTop: 0 }}>
                  ⚠️ ALLERGIES
                </div>
                <div style={{ fontSize: "13px", fontWeight: "bold", color: "#c2410c" }}>
                  {allergies.join(", ")}
                </div>
              </div>
            )}

            {/* Latest Vitals */}
            <div className="section-title">
              <Activity style={{ display: "inline", width: "14px", height: "14px", marginRight: "4px", verticalAlign: "middle" }} />
              Latest Vital Signs
            </div>
            <div className="vitals-grid">
              <div className="vital-box">
                <div className="vital-label">Blood Pressure</div>
                <div className="vital-value">{bp ? `${bp.value}${bp.secondary_value ? `/${bp.secondary_value}` : ""}` : "—"}</div>
                <div className="vital-unit">mmHg {bp?.recorded_at && `· ${new Date(bp.recorded_at).toLocaleDateString()}`}</div>
              </div>
              <div className="vital-box">
                <div className="vital-label">Heart Rate</div>
                <div className="vital-value">{hr ? hr.value : "—"}</div>
                <div className="vital-unit">bpm {hr?.recorded_at && `· ${new Date(hr.recorded_at).toLocaleDateString()}`}</div>
              </div>
              <div className="vital-box">
                <div className="vital-label">Blood Glucose</div>
                <div className="vital-value">{glucose ? glucose.value : "—"}</div>
                <div className="vital-unit">mg/dL</div>
              </div>
              <div className="vital-box">
                <div className="vital-label">Temperature</div>
                <div className="vital-value">{temp ? temp.value : "—"}</div>
                <div className="vital-unit">°F</div>
              </div>
              <div className="vital-box">
                <div className="vital-label">Oxygen Sat.</div>
                <div className="vital-value">{spo2 ? spo2.value : "—"}</div>
                <div className="vital-unit">%</div>
              </div>
              <div className="vital-box">
                <div className="vital-label">Blood Type</div>
                <div className="vital-value">{bloodType || "—"}</div>
                <div className="vital-unit">{profile?.rh_factor || ""}</div>
              </div>
            </div>

            {/* Current Medications */}
            <div className="section-title">
              <Pill style={{ display: "inline", width: "14px", height: "14px", marginRight: "4px", verticalAlign: "middle" }} />
              Current Medications ({medications.length})
            </div>
            <div className="meds-list">
              {medications.length > 0 ? medications.map((med) => (
                <div key={med.id} className="med-item">
                  <span className="med-name">{med.name}</span> {med.dosage} — {med.frequency}
                </div>
              )) : <div style={{ fontSize: "12px", color: "#888" }}>No active medications</div>}
            </div>

            {/* Emergency Contact */}
            {profile?.emergency_contact_name && (
              <>
                <div className="section-title">Emergency Contact</div>
                <div style={{ fontSize: "13px" }}>
                  <strong>{profile.emergency_contact_name}</strong>
                  {profile.emergency_contact_relationship && ` (${profile.emergency_contact_relationship})`}
                  {profile.emergency_contact_phone && ` · ${profile.emergency_contact_phone}`}
                </div>
              </>
            )}

            <div className="footer">
              This card is for emergency reference only. In a life-threatening emergency, call 911 immediately.
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}