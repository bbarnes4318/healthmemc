import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { generateFitnessPainMedicationPdf } from "@/lib/generateFitnessPainMedicationPdf";
import { FileDown, Loader2 } from "lucide-react";

export default function FitnessPainMedicationReportButton({ className }) {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const memberFilter = currentMemberId ? { family_member_id: currentMemberId } : {};

      const [user, exercises, surgicalLogs, medications, medicationLogs] = await Promise.all([
        base44.auth.me(),
        base44.entities.ExerciseLog.filter(memberFilter, "-date", 100),
        base44.entities.SurgicalRecovery.filter(memberFilter, "-log_date", 50),
        base44.entities.Medication.filter({ ...memberFilter, active: true }),
        base44.entities.MedicationLog.filter(memberFilter, "-scheduled_date", 50),
      ]);

      generateFitnessPainMedicationPdf({ user, exercises, surgicalLogs, medications, medicationLogs });
      toast({ title: "Report downloaded", description: "Share this PDF with your primary care physician." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate report", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Button onClick={handleGenerate} disabled={loading} className={className}>
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
      Fitness, Pain & Medication Report
    </Button>
  );
}