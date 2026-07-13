import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { generatePetMedicalHistoryPdf } from "@/lib/generatePetMedicalHistoryPdf";

export default function PetMedicalHistoryExport({ pet }) {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!pet) return;
    setGenerating(true);
    try {
      const [symptoms, weightLogs, medications, medicationLogs, schedules] = await Promise.all([
        base44.entities.PetSymptomLog.list("-logged_at", 500),
        base44.entities.PetWeightLog.filter({ pet_profile_id: pet.id }, "date", 500),
        base44.entities.PetMedication.filter({ pet_name: pet.name }, "-created_date", 200),
        base44.entities.PetMedicationLog.filter({ pet_name: pet.name }, "-scheduled_date", 200),
        base44.entities.PetHealthSchedule.filter({ pet_name: pet.name }, "-next_due_date", 200),
      ]);

      // Filter symptoms by pet type/breed match (same logic as timeline)
      const petSymptoms = symptoms.filter(
        (s) => s.breed === pet.breed || s.pet_type === pet.pet_type
      );

      if (petSymptoms.length === 0 && weightLogs.length === 0 && medications.length === 0 && schedules.length === 0) {
        toast({ title: "No records found", description: `No medical history data found for ${pet.name}.`, variant: "destructive" });
        setGenerating(false);
        return;
      }

      generatePetMedicalHistoryPdf(pet, {
        symptoms: petSymptoms,
        weightLogs,
        medications,
        medicationLogs,
        schedules,
      });

      toast({ title: "PDF generated", description: `${pet.name}'s medical history is ready to share with your vet.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate PDF", variant: "destructive" });
    }
    setGenerating(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-purple-300 text-purple-700 hover:bg-purple-50"
      onClick={handleGenerate}
      disabled={!pet || generating}
    >
      {generating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
      {generating ? "Generating..." : "Vet Summary PDF"}
    </Button>
  );
}