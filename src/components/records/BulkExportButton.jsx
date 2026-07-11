import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { generateHealthSummaryPdf } from "@/lib/generateHealthSummaryPdf";
import { FileDown, Loader2 } from "lucide-react";

export default function BulkExportButton() {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      const [
        user, profiles, records, medications, medicationLogs,
        vitals, consultations, appointments, insuranceCards
      ] = await Promise.all([
        base44.auth.me(),
        base44.entities.HealthProfile.list("-created_date", 5),
        base44.entities.MedicalRecord.list("-date", 200),
        base44.entities.Medication.list("-created_date", 100),
        base44.entities.MedicationLog.list("-scheduled_date", 200),
        base44.entities.VitalRecord.list("-recorded_at", 200),
        base44.entities.Consultation.list("-created_date", 100),
        base44.entities.Appointment.list("-date", 50),
        base44.entities.InsuranceCard.list("-created_date", 10),
      ]);

      generateHealthSummaryPdf({
        user,
        profile: profiles[0],
        records,
        medications: medications.filter((m) => m.active),
        medicationLogs,
        vitals,
        consultations,
        appointments,
        insuranceCards,
      });

      toast({ title: "Health summary exported", description: "Your comprehensive PDF is ready to share with your doctor." });
    } catch (e) {
      console.error(e);
      toast({ title: "Export failed", description: "Could not generate the PDF. Please try again.", variant: "destructive" });
    }
    setExporting(false);
  };

  return (
    <Button
      variant="outline"
      className="border-sky-300 text-sky-700 hover:bg-sky-50"
      onClick={handleExport}
      disabled={exporting}
    >
      {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
      {exporting ? "Compiling..." : "Bulk Export PDF"}
    </Button>
  );
}