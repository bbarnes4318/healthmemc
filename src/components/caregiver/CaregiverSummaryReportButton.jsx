import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FileDown, Loader2 } from "lucide-react";
import { generateCaregiverReportPdf } from "@/lib/generateCaregiverReportPdf";

export default function CaregiverSummaryReportButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const [visits, medLogs, profiles] = await Promise.all([
        base44.entities.CaregiverVisitLog.list("-visit_date", 200),
        base44.entities.MedicationLog.list("-scheduled_date", 200),
        base44.entities.HealthProfile.filter({}),
      ]);

      if (visits.length === 0 && medLogs.length === 0) {
        toast({ title: "No data available", description: "There are no care visits or medication logs to report." });
        setLoading(false);
        return;
      }

      const patientName = profiles[0]?.full_name || "Patient";
      generateCaregiverReportPdf(visits, medLogs, patientName);
      toast({ title: "Report generated", description: "Caregiver summary PDF has been downloaded." });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to generate report", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Button onClick={handleGenerate} disabled={loading} className="bg-violet-600 hover:bg-violet-700">
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
      Generate Summary Report
    </Button>
  );
}