import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, Activity, Pill, HeartPulse, FileText, Stethoscope, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const vitalLabels = {
  heart_rate: "Heart Rate",
  blood_pressure: "Blood Pressure",
  oxygen_saturation: "Oxygen Sat.",
  blood_glucose: "Blood Glucose",
  weight: "Weight",
  sleep_hours: "Sleep",
  activity_minutes: "Activity",
  temperature: "Temperature",
  steps: "Steps",
};

function memberName(familyMemberId, members, fallback = "You") {
  if (!familyMemberId) return fallback;
  const m = members.find((m) => m.id === familyMemberId);
  return m ? m.name : "Family Member";
}

function entryIcon(type) {
  switch (type) {
    case "vital":
      return <HeartPulse className="w-3.5 h-3.5 text-rose-500" />;
    case "medication_log":
      return <Pill className="w-3.5 h-3.5 text-amber-500" />;
    case "medical_record":
      return <FileText className="w-3.5 h-3.5 text-sky-500" />;
    case "consultation":
      return <Stethoscope className="w-3.5 h-3.5 text-violet-500" />;
    default:
      return <Activity className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

export default function ActivityFeed() {
  const { members } = useFamilyMember();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const memberIds = members.map((m) => m.id).join(",");

  useEffect(() => {
    const load = async () => {
      try {
        const [vitals, medLogs, records, consultations] = await Promise.all([
          base44.entities.VitalRecord.list("-recorded_at", 30),
          base44.entities.MedicationLog.list("-created_date", 30),
          base44.entities.MedicalRecord.list("-created_date", 30),
          base44.entities.Consultation.list("-created_date", 20),
        ]);

        const merged = [
          ...vitals.map((v) => {
            const isBP = v.type === "blood_pressure" && v.secondary_value;
            return {
              id: v.id,
              type: "vital",
              date: v.recorded_at || v.created_date,
              family_member_id: v.family_member_id,
              title: vitalLabels[v.type] || v.type,
              detail: isBP ? `${v.value}/${v.secondary_value}${v.unit ? " " + v.unit : ""}` : `${v.value}${v.unit ? " " + v.unit : ""}`,
              icon: "vital",
            };
          }),
          ...medLogs.map((l) => ({
            id: l.id,
            type: "medication_log",
            date: l.taken_at || l.created_date,
            family_member_id: l.family_member_id,
            title: l.medication_name,
            detail: l.status === "taken" ? "Medication taken" : l.status === "missed" ? "Missed dose" : "Skipped dose",
            status: l.status,
            icon: "medication_log",
          })),
          ...records.map((r) => ({
            id: r.id,
            type: "medical_record",
            date: r.date || r.created_date,
            family_member_id: r.family_member_id,
            title: r.title,
            detail: r.category ? r.category.replace(/_/g, " ") : "",
            icon: "medical_record",
          })),
          ...consultations.map((c) => ({
            id: c.id,
            type: "consultation",
            date: c.created_date,
            family_member_id: null,
            title: c.symptoms ? c.symptoms.slice(0, 60) + (c.symptoms.length > 60 ? "..." : "") : "Consultation",
            detail: c.type ? c.type.replace(/_/g, " ") : "",
            severity: c.severity,
            icon: "consultation",
          })),
        ];

        merged.sort((a, b) => new Date(b.date) - new Date(a.date));
        setEntries(merged.slice(0, 40));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [memberIds]);

  if (loading) {
    return (
      <Card className="p-4 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
        <span className="text-sm text-muted-foreground">Loading activity feed...</span>
      </Card>
    );
  }

  const severityColors = {
    emergency: "border-l-red-500",
    high: "border-l-orange-500",
    moderate: "border-l-amber-500",
    low: "border-l-green-500",
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-violet-600" />
        <h3 className="font-display font-semibold text-sm">Family Activity Feed</h3>
        <span className="text-xs text-muted-foreground">Recent health events across all members</span>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No recent activity yet</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Vitals, medications, and records will appear here</p>
        </div>
      ) : (
        <div className="relative pl-5 max-h-[500px] overflow-y-auto">
          <div className="absolute left-1.5 top-1 bottom-1 w-0.5 bg-violet-100" />

          <div className="space-y-2">
            {entries.map((entry) => {
              const name = memberName(entry.family_member_id, members);
              const date = entry.date ? new Date(entry.date) : null;

              return (
                <div
                  key={`${entry.type}-${entry.id}`}
                  className={`relative bg-muted/30 rounded-lg p-2.5 border-l-2 ${
                    entry.severity ? severityColors[entry.severity] : "border-l-transparent"
                  }`}
                >
                  <div className="absolute -left-[14px] top-3 w-2.5 h-2.5 rounded-full bg-white ring-2 ring-violet-200" />

                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">{entryIcon(entry.icon)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium truncate">{entry.title}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {date ? format(date, "MMM d, h:mm a") : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground capitalize">{entry.detail}</span>
                        {entry.status === "taken" && <CheckCircle className="w-3 h-3 text-green-500" />}
                        {entry.status === "missed" && <XCircle className="w-3 h-3 text-red-500" />}
                      </div>
                      <p className="text-[10px] text-violet-600 font-medium mt-0.5">{name}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}