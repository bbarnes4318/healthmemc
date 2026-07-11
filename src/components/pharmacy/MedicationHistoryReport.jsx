import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Loader2, Share2, Mail, UserPlus, Stethoscope, Pill } from "lucide-react";
import { generateMedicationHistoryPdf } from "@/lib/generateMedicationHistoryPdf";

const generateToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
};

export default function MedicationHistoryReport() {
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [accessDuration, setAccessDuration] = useState("7");
  const { toast } = useToast();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const [user, profiles, medications, logs] = await Promise.all([
        base44.auth.me(),
        base44.entities.HealthProfile.list("-created_date", 1),
        base44.entities.Medication.list("-created_date", 200),
        base44.entities.MedicationLog.list("-created_date", 500),
      ]);
      generateMedicationHistoryPdf({
        user,
        profile: profiles[0] || null,
        medications,
        adherenceLogs: logs,
      });
      toast({ title: "PDF generated", description: "Your medication history report has been downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate report", variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleShare = async () => {
    if (!doctorName.trim() || !doctorEmail.trim()) return;
    setSharing(true);
    try {
      // Generate PDF as blob
      const [user, profiles, medications, logs] = await Promise.all([
        base44.auth.me(),
        base44.entities.HealthProfile.list("-created_date", 1),
        base44.entities.Medication.list("-created_date", 200),
        base44.entities.MedicationLog.list("-created_date", 500),
      ]);

      // Grant portal access
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(accessDuration));
      await base44.entities.ClinicianAccess.create({
        doctor_name: doctorName,
        doctor_email: doctorEmail,
        specialty: "Pharmacy Review",
        access_token: token,
        expires_at: expiresAt.toISOString(),
        status: "active",
        share_medications: true,
        share_records: true,
        share_consultations: false,
        share_vitals: false,
      });

      const origin = window.location.origin;
      const portalLink = `${origin}/clinician-view?token=${token}`;

      await base44.integrations.Core.SendEmail({
        to: doctorEmail,
        subject: `Medication History Report — ${user.full_name}`,
        body: `Hello ${doctorName},\n\n${user.full_name} has shared their comprehensive medication history with you through Health Me Medical Center.\n\nYou can access their medication records and adherence data via the secure clinician portal:\n${portalLink}\n\nThis access expires in ${accessDuration} day(s).\n\nPlease contact the patient if you have any questions about their medication regimen.\n\n— Health Me Medical Center`,
      });

      toast({ title: "Shared with doctor", description: `${doctorName} has been emailed secure portal access.` });
      setDoctorName(""); setDoctorEmail("");
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to share", variant: "destructive" });
    }
    setSharing(false);
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Medication History Report</h3>
            <p className="text-xs text-muted-foreground">Generate a comprehensive PDF of your full medication history, including dosage notes and adherence logs.</p>
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={generating} className="w-full bg-emerald-600 hover:bg-emerald-700">
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          Generate & Download PDF
        </Button>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Share with Your Doctor</h3>
            <p className="text-xs text-muted-foreground">Grant secure portal access to your medication history. The doctor receives an email with a secure link.</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Doctor Name *</Label>
              <div className="relative">
                <Stethoscope className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input placeholder="Dr. Jane Smith" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className="pl-8" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Doctor Email *</Label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input type="email" placeholder="dr.smith@clinic.com" value={doctorEmail} onChange={(e) => setDoctorEmail(e.target.value)} className="pl-8" />
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs">Access Duration</Label>
            <Select value={accessDuration} onValueChange={setAccessDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">24 hours</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleShare} disabled={!doctorName.trim() || !doctorEmail.trim() || sharing} className="w-full bg-sky-600 hover:bg-sky-700">
            {sharing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Share via Doctor Portal
          </Button>
        </div>
      </Card>
    </div>
  );
}