import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Phone, Users, Heart, Shield, FileText, AlertTriangle,
  Activity, Download, Siren, Mail, CheckCircle, Droplet, Pill
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { generateHealthSummaryPdf } from "@/lib/generateHealthSummaryPdf";

export default function ERDashboard() {
  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const [profiles, trustedContacts, allConsults] = await Promise.all([
          base44.entities.HealthProfile.filter({ created_by_id: u.id }),
          base44.entities.TrustedContact.filter({ status: "active" }),
          base44.entities.Consultation.list("-created_date", 50),
        ]);
        if (profiles.length > 0) setProfile(profiles[0]);
        setContacts(trustedContacts);
        setConsultations(allConsults.filter((c) => c.severity === "high" || c.severity === "emergency").slice(0, 5));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const handleDownloadSummary = async () => {
    setGeneratingPdf(true);
    try {
      const [records, medications, vitals, appointments, insuranceCards] = await Promise.all([
        base44.entities.MedicalRecord.list("-date", 100),
        base44.entities.Medication.filter({ active: true }),
        base44.entities.VitalRecord.list("-recorded_at", 100),
        base44.entities.Appointment.list("-date", 20),
        base44.entities.InsuranceCard.list("-created_date", 10),
      ]);
      generateHealthSummaryPdf({ user, profile, records, medications, vitals, consultations, appointments, insuranceCards });
      toast({ title: "Health summary downloaded", description: "Your emergency PDF report is ready." });
    } catch (err) {
      toast({ title: "Failed to generate summary", variant: "destructive" });
    }
    setGeneratingPdf(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  const emergencyContacts = contacts.filter((c) => c.alert_emergencies);
  const hasMedInfo = profile && (
    (profile.blood_type && profile.blood_type !== "unknown") ||
    profile.allergies?.length > 0 ||
    profile.chronic_conditions?.length > 0 ||
    profile.current_medications?.length > 0
  );

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Emergency Alert Banner */}
      <Card className="p-6 bg-red-600 text-white border-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Siren className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Emergency Ready</h2>
              <p className="text-red-100 text-sm">
                {emergencyContacts.length > 0
                  ? `${emergencyContacts.length} ${emergencyContacts.length === 1 ? "contact" : "contacts"} will be notified with your location & medical summary`
                  : "No emergency contacts configured — add trusted contacts in Settings"}
              </p>
            </div>
          </div>
          <Link to="/emergency">
            <Button className="bg-white text-red-700 hover:bg-red-50 font-bold">
              <Phone className="w-4 h-4 mr-2" /> Emergency
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Notified Contacts Status */}
        <Card className="p-5">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-sky-600" /> Emergency Contacts
          </h3>
          {emergencyContacts.length === 0 ? (
            <div className="py-4 text-center">
              <Mail className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">No emergency contacts configured</p>
              <Link to="/settings" className="text-xs text-sky-600 hover:underline mt-1 inline-block">Add trusted contacts</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {emergencyContacts.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium shrink-0">Active</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Medical Summary */}
        <Card className="p-5">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-red-600" /> Medical Summary
          </h3>
          {hasMedInfo ? (
            <div className="space-y-2">
              {profile.blood_type && profile.blood_type !== "unknown" && (
                <div className="flex items-center gap-2 text-sm">
                  <Droplet className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-muted-foreground">Blood Type:</span>
                  <span className="font-medium">{profile.blood_type}</span>
                </div>
              )}
              {profile.allergies?.length > 0 && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-muted-foreground">Allergies:</span>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-5">
                    {profile.allergies.map((a, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.chronic_conditions?.length > 0 && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Activity className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-muted-foreground">Chronic Conditions:</span>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-5">
                    {profile.chronic_conditions.map((c, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.current_medications?.length > 0 && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Pill className="w-3.5 h-3.5 text-sky-500" />
                    <span className="text-muted-foreground">Medications:</span>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-5">
                    {profile.current_medications.map((m, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No critical medical info on file.{" "}
              <Link to="/profile" className="text-sky-600 hover:underline">Update your profile</Link>
            </p>
          )}
        </Card>
      </div>

      {/* Quick Access */}
      <div>
        <h3 className="text-sm font-display font-semibold mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Link to="/records">
            <Card className="p-4 hover:shadow-md transition cursor-pointer h-full">
              <FileText className="w-6 h-6 text-sky-600 mb-2" />
              <h4 className="text-sm font-semibold">Medical Records</h4>
              <p className="text-xs text-muted-foreground">View documents & labs</p>
            </Card>
          </Link>
          <Card className="p-4 hover:shadow-md transition cursor-pointer h-full" onClick={handleDownloadSummary}>
            {generatingPdf ? (
              <div className="w-6 h-6 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-2" />
            ) : (
              <Download className="w-6 h-6 text-emerald-600 mb-2" />
            )}
            <h4 className="text-sm font-semibold">Health Summary</h4>
            <p className="text-xs text-muted-foreground">Download PDF for ER</p>
          </Card>
          <Link to="/profile">
            <Card className="p-4 hover:shadow-md transition cursor-pointer h-full">
              <Shield className="w-6 h-6 text-violet-600 mb-2" />
              <h4 className="text-sm font-semibold">Medical Profile</h4>
              <p className="text-xs text-muted-foreground">Update emergency info</p>
            </Card>
          </Link>
        </div>
      </div>

      {/* Active Alerts — High Severity Consultations */}
      {consultations.length > 0 && (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" /> Active Alerts
          </h3>
          <p className="text-xs text-muted-foreground mb-3">Recent high-severity consultations requiring attention</p>
          <div className="space-y-2">
            {consultations.map((c) => (
              <div key={c.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${c.severity === "emergency" ? "bg-red-200 text-red-800" : "bg-orange-200 text-orange-800"}`}>
                      {c.severity}
                    </span>
                    <span className="text-sm font-medium">{c.type?.replace(/_/g, " ")}</span>
                    {c.specialty && <span className="text-xs text-muted-foreground">{c.specialty}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(c.created_date), "MMM d, yyyy")}</span>
                </div>
                {c.report?.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.report.summary}</p>
                )}
                {c.report?.emergency_warnings?.length > 0 && (
                  <div className="mt-1.5">
                    {c.report.emergency_warnings.slice(0, 2).map((w, i) => (
                      <p key={i} className="text-xs text-red-700 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {w}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-start gap-2 p-4 bg-red-50 rounded-xl border border-red-200">
        <Shield className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
        <p className="text-xs text-red-800">
          This dashboard provides quick access to your emergency medical information. In a life-threatening emergency, always call 911 immediately.
        </p>
      </div>
    </div>
  );
}