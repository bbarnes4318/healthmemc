import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import MilestoneTimeline from "@/components/shared/MilestoneTimeline";
import { Smile, Stethoscope, Award } from "lucide-react";
import { differenceInDays } from "date-fns";

const procedureLabels = {
  cleaning: "Cleaning", filling: "Filling", root_canal: "Root Canal", extraction: "Extraction",
  crown: "Crown", bridge: "Bridge", implant: "Implant", whitening: "Whitening",
  x_ray: "X-Ray", examination: "Examination", other: "Procedure",
};

export default function DentalMilestoneTimeline() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.DentalVisitLog.list("-visit_date", 500);
        setLogs(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const milestones = useMemo(() => {
    const events = [];
    const now = new Date();

    logs.forEach((log) => {
      events.push({
        date: log.visit_date,
        title: `${procedureLabels[log.procedure_type] || "Dental Visit"} — ${log.dentist_name}`,
        description: log.tooth_treated ? `Tooth: ${log.tooth_treated}` : undefined,
        status: "completed", icon: Smile, color: "text-cyan-600",
        tag: log.procedure_notes,
        daysFromNow: differenceInDays(now, new Date(log.visit_date)),
      });

      if (log.follow_up_recommended && log.follow_up_date) {
        const days = differenceInDays(new Date(log.follow_up_date), now);
        events.push({
          date: log.follow_up_date,
          title: `Follow-up: ${procedureLabels[log.procedure_type] || "Dental"}`,
          description: log.follow_up_notes,
          status: days < 0 ? "overdue" : "upcoming",
          icon: Stethoscope,
          color: days < 0 ? "text-red-600" : "text-sky-600",
          daysFromNow: days,
        });
      }
    });

    return events;
  }, [logs]);

  return (
    <MilestoneTimeline
      milestones={milestones} loading={loading}
      title="Dental Milestone Timeline" icon={Award}
      emptyMessage="No dental milestones yet. Log dental visits and procedures to track your oral health journey."
    />
  );
}