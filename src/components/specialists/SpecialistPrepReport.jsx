import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, FlaskConical, Pill } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { generateSpecialistPrepPdf } from "@/lib/generateSpecialistPrepPdf";

export default function SpecialistPrepReport() {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const [user, profiles, medications, labRecords] = await Promise.all([
        base44.auth.me(),
        base44.entities.HealthProfile.filter({}),
        base44.entities.Medication.filter({ active: true }),
        base44.entities.MedicalRecord.filter({ category: "lab_results" }),
      ]);
      const sortedLabs = labRecords.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      generateSpecialistPrepPdf({
        user,
        profile: profiles[0],
        medications,
        labRecords: sortedLabs,
      });
      toast({
        title: "Specialist Prep Report generated",
        description: `${medications.length} medications and ${sortedLabs.length} lab records included.`,
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to generate report", variant: "destructive" });
    }
    setGenerating(false);
  };

  return (
    <Card className="p-5 border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Specialist Prep Report</h3>
          <p className="text-xs text-muted-foreground">One-click PDF with your latest lab markers and current medications</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-sky-700 flex items-center gap-0.5">
              <FlaskConical className="w-3 h-3" /> Lab markers
            </span>
            <span className="text-[10px] text-emerald-700 flex items-center gap-0.5">
              <Pill className="w-3 h-3" /> Medications
            </span>
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-sky-600 hover:bg-sky-700"
          size="sm"
        >
          {generating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FileText className="w-4 h-4 mr-1.5" />}
          Generate PDF
        </Button>
      </div>
    </Card>
  );
}