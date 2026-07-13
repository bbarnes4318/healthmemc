import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Download, Stethoscope, HeartPulse, Users, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { generatePrimaryDoctorReportPdf } from "@/lib/generatePrimaryDoctorReportPdf";
import { motion } from "framer-motion";

const typeIcons = {
  ai_doctor: Stethoscope, ai_nurse: HeartPulse, ai_specialist: Users,
  ai_dentist: Stethoscope, ai_veterinarian: Users, ai_physical_therapist: Stethoscope,
  ai_eye_doctor: Stethoscope, ai_ent: Stethoscope, ai_dermatologist: Stethoscope,
  ai_senior_care: HeartPulse, ai_assisted_living: HeartPulse, ai_sports_medicine: Stethoscope,
  ai_fitness: Users, ai_personal_physician: Stethoscope, ai_wellness_spa: HeartPulse, ai_er: AlertTriangle,
};

const typeLabels = {
  ai_doctor: "AI Doctor", ai_nurse: "AI Nurse", ai_specialist: "AI Specialist",
  ai_dentist: "AI Dentist", ai_veterinarian: "AI Veterinarian", ai_physical_therapist: "AI Physical Therapist",
  ai_eye_doctor: "AI Eye Doctor", ai_ent: "AI ENT", ai_dermatologist: "AI Dermatologist",
  ai_senior_care: "AI Senior Care", ai_assisted_living: "AI Assisted Living", ai_sports_medicine: "AI Sports Medicine",
  ai_fitness: "AI Fitness", ai_personal_physician: "AI Personal Physician", ai_wellness_spa: "AI Wellness Spa", ai_er: "AI ER",
};

export default function PrimaryDoctorReport() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [medications, setMedications] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [u, consults, meds, vit, profs] = await Promise.all([
          base44.auth.me(),
          base44.entities.Consultation.filter({ status: "completed" }, "-created_date", 20),
          base44.entities.Medication.filter({ active: true }, "-created_date", 50),
          base44.entities.VitalRecord.filter({}, "-recorded_at", 50),
          base44.entities.HealthProfile.list("-created_date", 1),
        ]);
        setUser(u);
        setConsultations(consults);
        setMedications(meds);
        setVitals(vit);
        setProfile(profs[0] || null);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const handleGenerate = () => {
    setGenerating(true);
    try {
      generatePrimaryDoctorReportPdf({ user, profile, consultations, medications, vitals });
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  const hasEmergencyWarnings = consultations.some((c) => c.report?.emergency_warnings?.length > 0);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Primary Doctor Report</h1>
              <p className="text-sm text-muted-foreground">{consultations.length} consultations ready to include</p>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={generating || consultations.length === 0} className="bg-sky-600 hover:bg-sky-700" size="lg">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Generate PDF
          </Button>
        </div>

        {/* Info banner */}
        <Card className="p-4 bg-sky-50 border-sky-200 mb-6">
          <div className="flex items-start gap-2">
            <Stethoscope className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
            <p className="text-xs text-sky-800">
              This report compiles your latest AI health consultation summaries, current medications, and vital signs into a clean, professional document you can bring to your real-world primary care physician for review.
            </p>
          </div>
        </Card>

        {hasEmergencyWarnings && (
          <Card className="p-4 bg-red-50 border-red-200 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-xs text-red-800">
                Some consultations contain emergency warnings. These will be highlighted in the report for your doctor's attention.
              </p>
            </div>
          </Card>
        )}

        {/* Summary of what will be included */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-semibold">Consultations</span>
            </div>
            <p className="text-2xl font-bold text-violet-600">{consultations.length}</p>
            <p className="text-[10px] text-muted-foreground">AI visit summaries</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold">Medications</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{medications.length}</p>
            <p className="text-[10px] text-muted-foreground">Active prescriptions</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <HeartPulse className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-semibold">Vitals</span>
            </div>
            <p className="text-2xl font-bold text-sky-600">{vitals.length}</p>
            <p className="text-[10px] text-muted-foreground">Recent readings</p>
          </Card>
        </div>

        {/* Consultation preview */}
        <h2 className="text-sm font-semibold mb-3">Consultations to be included:</h2>
        {consultations.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No completed consultations yet</p>
            <Link to="/ai-doctor">
              <Button variant="outline" size="sm" className="mt-3">Start a Consultation</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {consultations.slice(0, 10).map((c, i) => {
              const Icon = typeIcons[c.type] || Stethoscope;
              const label = typeLabels[c.type] || c.type?.replace(/_/g, " ");
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{label}</span>
                          {c.specialty && <Badge variant="outline" className="text-[10px]">{c.specialty}</Badge>}
                          {c.report?.emergency_warnings?.length > 0 && (
                            <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                              <AlertTriangle className="w-2.5 h-2.5 mr-1" />Emergency Warning
                            </Badge>
                          )}
                        </div>
                        {c.report?.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.report.summary}</p>}
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(c.created_date), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
            {consultations.length > 10 && (
              <p className="text-xs text-center text-muted-foreground py-2">
                + {consultations.length - 10} more consultations will be included in the report
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}