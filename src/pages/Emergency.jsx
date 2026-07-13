import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Phone, AlertTriangle, Heart, Users, Shield, ArrowLeft,
  Bell, Loader2, CheckCircle, Mail, Send, MapPin, FileDown
} from "lucide-react";
import { generateEmergencySummaryPdf } from "@/lib/generateEmergencySummaryPdf";
import EmergencyProfileCard from "@/components/emergency/EmergencyProfileCard";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Emergency() {
  const [profile, setProfile] = useState(null);
  const [autoAlert, setAutoAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [hasTrustedContacts, setHasTrustedContacts] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleGenerateEmergencyPdf = async () => {
    setGeneratingPdf(true);
    try {
      const [user, meds, vitals, insurance, trusted] = await Promise.all([
        base44.auth.me(),
        base44.entities.Medication.filter({ active: true }),
        base44.entities.VitalRecord.list("-recorded_at", 50),
        base44.entities.InsuranceCard.filter({}),
        base44.entities.TrustedContact.filter({ status: "active" }),
      ]);
      generateEmergencySummaryPdf({ user, profile, medications: meds, vitals, insuranceCards: insurance, trustedContacts: trusted });
    } catch (err) { console.error(err); }
    setGeneratingPdf(false);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [data, contacts] = await Promise.all([
          base44.entities.HealthProfile.filter({}),
          base44.entities.TrustedContact.filter({ status: "active", alert_emergencies: true }),
        ]);
        if (data.length > 0) {
          setProfile(data[0]);
          setAutoAlert(data[0].auto_alert_contacts || false);
        }
        setHasTrustedContacts(contacts.length > 0);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, []);

  const toggleAutoAlert = async (checked) => {
    setAutoAlert(checked);
    if (profile) {
      try {
        await base44.entities.HealthProfile.update(profile.id, { auto_alert_contacts: checked });
      } catch (err) { console.error(err); }
    }
  };

  const getLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
          const url = `https://www.google.com/maps?q=${coords}`;
          setLocation({ coords, url });
          setLocating(false);
          resolve({ coords, url });
        },
        () => { setLocating(false); resolve(null); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const buildMedicalSummary = () => {
    if (!profile) return "No health profile on file.";
    const parts = [];
    if (profile.blood_type && profile.blood_type !== "unknown") parts.push(`Blood Type: ${profile.blood_type}`);
    if (profile.date_of_birth) parts.push(`DOB: ${new Date(profile.date_of_birth).toLocaleDateString()}`);
    if (profile.gender) parts.push(`Gender: ${profile.gender}`);
    if (profile.height_cm) parts.push(`Height: ${profile.height_cm} cm`);
    if (profile.weight_kg) parts.push(`Weight: ${profile.weight_kg} kg`);
    if (profile.allergies?.length) parts.push(`Allergies: ${profile.allergies.join(", ")}`);
    if (profile.chronic_conditions?.length) parts.push(`Chronic Conditions: ${profile.chronic_conditions.join(", ")}`);
    if (profile.current_medications?.length) parts.push(`Current Medications: ${profile.current_medications.join(", ")}`);
    return parts.length > 0 ? parts.join("\n") : "No additional medical details on file.";
  };

  const handleEmergency = async () => {
    setSending(true);
    try {
      const loc = await getLocation();

      const recipients = [];
      if (profile?.emergency_contact_email) recipients.push(profile.emergency_contact_email);

      const contacts = await base44.entities.TrustedContact.filter({ status: "active", alert_emergencies: true });
      contacts.forEach((c) => { if (c.email) recipients.push(c.email); });

      if (recipients.length === 0) {
        setSending(false);
        return;
      }

      const medicalSummary = buildMedicalSummary();
      const locationStr = loc
        ? `Current Location: ${loc.coords}\nGoogle Maps: ${loc.url}`
        : "Location unavailable (device location not accessible)";

      const body = `EMERGENCY ALERT — Health Me Medical Center

The user has triggered the emergency button at ${new Date().toLocaleString()}.

${locationStr}

MEDICAL SUMMARY:
${medicalSummary}

EMERGENCY CONTACT:
Name: ${profile?.emergency_contact_name || "N/A"}
Phone: ${profile?.emergency_contact_phone || "N/A"}
Relationship: ${profile?.emergency_contact_relationship || "N/A"}

Please reach out immediately to check on them. If this is a life-threatening situation, call 911.

— Health Me Medical Center`;

      await Promise.all(recipients.map((to) =>
        base44.integrations.Core.SendEmail({ to, subject: "EMERGENCY ALERT — Health Me Medical Center", body })
      ));
      setAlertSent(true);
      setTimeout(() => setAlertSent(false), 10000);
    } catch (err) { console.error(err); }
    setSending(false);
  };

  const hasContactEmail = !!profile?.emergency_contact_email || hasTrustedContacts;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <Link to="/">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Emergency Call */}
        <Card className="p-6 bg-red-600 text-white border-0">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold">Emergency</h1>
            <p className="text-red-100 mt-1 text-sm">If this is a medical emergency, call immediately</p>
            <div className="flex flex-col items-center gap-3 mt-4">
              <a href="tel:911" onClick={() => autoAlert && handleEmergency()}>
                <Button className="bg-white text-red-700 hover:bg-red-50 font-bold text-lg px-8 py-6">
                  <Phone className="w-5 h-5 mr-2" />
                  Call 911
                </Button>
              </a>
              <Button
                onClick={handleEmergency}
                disabled={sending || locating}
                className="bg-white/20 text-white hover:bg-white/30 border border-white/30 font-semibold px-6 py-3"
              >
                {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Alert My Contacts
              </Button>
              {(sending || locating) && (
                <p className="text-sm text-red-100 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {locating ? "Capturing location..." : "Sending alert with location & medical summary..."}
                </p>
              )}
              {alertSent && (
                <p className="text-sm text-white flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-4 h-4" /> Emergency alert sent to your contacts with location & medical summary
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Emergency Profile Summary */}
        <EmergencyProfileCard />

        {/* Printable Emergency Summary */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <FileDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm">Printable Emergency Summary</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generate a one-page PDF with your vitals, medications, allergies, and insurance info — ready for paramedics.
                </p>
              </div>
            </div>
            <Button
              onClick={handleGenerateEmergencyPdf}
              disabled={generatingPdf || loading}
              className="bg-red-600 hover:bg-red-700 shrink-0"
            >
              {generatingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
              Generate PDF
            </Button>
          </div>
        </Card>

        {/* Auto-Alert Setting */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm">Auto-Alert Emergency Contacts</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatically notify your emergency contact when you press the emergency button.
                </p>
                {loading ? (
                  <p className="text-xs text-muted-foreground mt-1">Loading settings...</p>
                ) : !hasContactEmail ? (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Add an emergency contact email in your Profile to enable this.
                  </p>
                ) : (
                  <p className="text-xs text-green-600 mt-1">
                    {profile?.emergency_contact_email
                      ? `Alerts will be sent to ${profile.emergency_contact_email}${hasTrustedContacts ? " and your trusted contacts" : ""}`
                      : "Alerts will be sent to your trusted contacts"}
                  </p>
                )}
              </div>
            </div>
            <Switch
              checked={autoAlert}
              onCheckedChange={toggleAutoAlert}
              disabled={loading || !hasContactEmail}
            />
          </div>
        </Card>

        {/* Emergency Instructions */}
        <Card className="p-5">
          <h2 className="font-display font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            When to Call 911
          </h2>
          <ul className="space-y-2">
            {[
              "Difficulty breathing or shortness of breath",
              "Chest pain or pressure lasting more than 2 minutes",
              "Loss of consciousness or fainting",
              "Severe allergic reaction (anaphylaxis)",
              "Signs of stroke (face drooping, arm weakness, speech difficulty)",
              "Severe bleeding that won't stop",
              "Seizures",
              "Sudden severe headache with no known cause",
              "Poisoning or drug overdose",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        {/* First Aid Quick Tips */}
        <Card className="p-5">
          <h2 className="font-display font-semibold flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-rose-600" />
            First Aid Quick Tips
          </h2>
          <div className="space-y-3">
            {[
              { title: "CPR", desc: "Push hard and fast in the center of the chest. 100-120 compressions per minute. Allow full chest recoil between compressions." },
              { title: "Choking", desc: "Perform abdominal thrusts (Heimlich maneuver). Stand behind the person and give 5 quick upward thrusts." },
              { title: "Bleeding", desc: "Apply firm, direct pressure with a clean cloth. Elevate the injured area above the heart if possible." },
              { title: "Burns", desc: "Cool the burn with cool (not cold) running water for at least 10 minutes. Do not apply ice, butter, or toothpaste." },
            ].map((tip) => (
              <div key={tip.title} className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm">{tip.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Emergency Contacts */}
        <Card className="p-5">
          <h2 className="font-display font-semibold flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-sky-600" />
            Important Numbers
          </h2>
          <div className="space-y-2">
            {[
              { name: "Emergency Services", number: "911" },
              { name: "Poison Control", number: "1-800-222-1222" },
              { name: "Suicide & Crisis Lifeline", number: "988" },
              { name: "SAMHSA Helpline", number: "1-800-662-4357" },
            ].map((contact) => (
              <a key={contact.number} href={`tel:${contact.number}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition">
                <span className="text-sm font-medium">{contact.name}</span>
                <span className="text-sm text-sky-600 font-semibold">{contact.number}</span>
              </a>
            ))}
          </div>
        </Card>

        <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            This page provides general emergency guidance. In any life-threatening situation, always call your local emergency number immediately.
          </p>
        </div>
      </motion.div>
    </div>
  );
}