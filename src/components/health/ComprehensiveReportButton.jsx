import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { generateComprehensiveHealthPdf } from "@/lib/generateComprehensiveHealthPdf";

export default function ComprehensiveReportButton({ className }) {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const [vitals, painLogs, medications] = await Promise.all([
        base44.entities.VitalRecord.filter(filter, "-recorded_at", 200),
        base44.entities.SymptomMap.filter(filter, "-logged_at", 50),
        base44.entities.Medication.filter(currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true }),
      ]);

      generateComprehensiveHealthPdf({
        vitals,
        painLogs,
        medications,
        memberName: currentMemberName,
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <Button variant="outline" onClick={handleGenerate} disabled={loading} className={className}>
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
      Full Report
    </Button>
  );
}