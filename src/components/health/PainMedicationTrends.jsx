import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, Activity, Pill } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import PainRegionTrendChart from "@/components/health/PainRegionTrendChart";

export default function PainMedicationTrends() {
  const { currentMemberId } = useFamilyMember();
  const [entries, setEntries] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
        const [symptomData, medData] = await Promise.all([
          base44.entities.SymptomMap.filter(filter, "-logged_at", 300),
          base44.entities.Medication.filter(
            currentMemberId ? { family_member_id: currentMemberId } : {},
            "-start_date", 50
          ),
        ]);
        setEntries(symptomData);
        setMedications(medData);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  const activeMedCount = medications.filter((m) => m.active !== false).length;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Pain × Medication Trends</h3>
            <p className="text-xs text-muted-foreground">
              Track if treatments are reducing pain in specific body areas
            </p>
          </div>
        </div>
        {activeMedCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
            <Pill className="w-3 h-3 text-purple-600" />
            <span className="text-[10px] font-medium text-purple-700">
              {activeMedCount} active med{activeMedCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
        </div>
      ) : (
        <PainRegionTrendChart entries={entries} />
      )}
    </Card>
  );
}