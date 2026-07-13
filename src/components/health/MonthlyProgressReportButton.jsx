import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { generateMonthlyProgressPdf } from "@/lib/generateMonthlyProgressPdf";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { toast } from "@/components/ui/use-toast";

export default function MonthlyProgressReportButton({ variant = "default", className = "" }) {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const user = await base44.auth.me();
      // Fetch last 30 days of data directly from entities
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const [exercises, surgicalLogs, medications, medicationLogs] = await Promise.all([
        base44.entities.ExerciseLog.list("-date", 500),
        base44.entities.SurgicalRecovery.list("-log_date", 200),
        base44.entities.Medication.filter({ active: true }),
        base44.entities.MedicationLog.list("-scheduled_date", 500),
      ]);

      // Filter by family member if set
      const filteredExercises = currentMemberId ? exercises.filter((e) => e.family_member_id === currentMemberId) : exercises;
      const filteredSurgical = currentMemberId ? surgicalLogs.filter((s) => s.family_member_id === currentMemberId) : surgicalLogs;
      const filteredMedLogs = currentMemberId ? medicationLogs.filter((l) => l.family_member_id === currentMemberId) : medicationLogs;

      // Filter to last 30 days
      const recentExercises = filteredExercises.filter((e) => e.date && e.date >= thirtyDaysAgo);
      const recentSurgical = filteredSurgical.filter((s) => s.log_date && s.log_date >= thirtyDaysAgo);
      const recentMedLogs = filteredMedLogs.filter((l) => l.scheduled_date && l.scheduled_date >= thirtyDaysAgo);

      generateMonthlyProgressPdf({
        user,
        exercises: recentExercises,
        surgicalLogs: recentSurgical,
        medications,
        medicationLogs: recentMedLogs,
        memberName: currentMemberName || user?.full_name,
      });

      toast({ title: "Report Generated", description: "Your monthly progress PDF has been downloaded." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate report. Please try again.", variant: "destructive" });
    }
    setGenerating(false);
  };

  return (
    <Button onClick={handleGenerate} disabled={generating} variant={variant} className={className}>
      {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
      {generating ? "Generating..." : "Monthly Progress Report"}
    </Button>
  );
}