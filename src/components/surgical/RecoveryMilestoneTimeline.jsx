import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import MilestoneTimeline from "@/components/shared/MilestoneTimeline";
import { Activity, Stethoscope, Award, TrendingUp, Timer, Bone, Heart, CheckCircle2 } from "lucide-react";
import { differenceInDays } from "date-fns";

const woundLabels = {
  clean_healing: "Clean & Healing", redness: "Redness", swelling: "Swelling",
  discharge: "Discharge", dehiscence: "Wound Opening", infection: "Infection", fully_healed: "Fully Healed",
};
const mobilityLabels = {
  bedridden: "Bedridden", limited_assistance: "Limited Assistance", with_walker: "With Walker",
  independent_limited: "Independent", fully_mobile: "Fully Mobile",
};

export default function RecoveryMilestoneTimeline() {
  const { currentMemberId } = useFamilyMember();
  const [logs, setLogs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [logData, apptData] = await Promise.all([
          base44.entities.SurgicalRecovery.list("-log_date", 500),
          base44.entities.Appointment.list("-date", 200),
        ]);
        setLogs(currentMemberId ? logData.filter((l) => l.family_member_id === currentMemberId) : logData);
        setAppointments(currentMemberId ? apptData.filter((a) => a.family_member_id === currentMemberId) : apptData);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  const milestones = useMemo(() => {
    const events = [];
    const now = new Date();
    const surgeries = {};
    logs.forEach((l) => {
      if (!surgeries[l.surgery_name]) surgeries[l.surgery_name] = [];
      surgeries[l.surgery_name].push(l);
    });

    Object.entries(surgeries).forEach(([surgeryName, entries]) => {
      const sorted = [...entries].sort((a, b) => new Date(a.log_date) - new Date(b.log_date));

      if (sorted[0]?.surgery_date) {
        events.push({
          date: sorted[0].surgery_date,
          title: `Surgery: ${surgeryName}`,
          description: sorted[0].surgeon ? `Performed by ${sorted[0].surgeon}` : undefined,
          status: "completed", icon: Activity, color: "text-rose-600", tag: sorted[0].hospital,
          daysFromNow: differenceInDays(now, new Date(sorted[0].surgery_date)),
        });
      }

      sorted.forEach((entry) => {
        (entry.milestones_reached || []).forEach((ms) => {
          events.push({
            date: entry.log_date, title: ms, description: `Day ${entry.days_post_op} post-op`,
            status: "completed", icon: Award, color: "text-violet-600",
            daysFromNow: differenceInDays(now, new Date(entry.log_date)),
          });
        });
      });

      const seenWound = new Set();
      sorted.forEach((entry) => {
        if (entry.wound_status && !seenWound.has(entry.wound_status)) {
          seenWound.add(entry.wound_status);
          events.push({
            date: entry.log_date,
            title: `Wound: ${woundLabels[entry.wound_status] || entry.wound_status}`,
            description: `Day ${entry.days_post_op} post-op`,
            status: "completed",
            icon: entry.wound_status === "infection" || entry.wound_status === "dehiscence" ? Heart : CheckCircle2,
            color: entry.wound_status === "fully_healed" ? "text-emerald-600" : entry.wound_status === "infection" ? "text-red-600" : "text-amber-600",
            daysFromNow: differenceInDays(now, new Date(entry.log_date)),
          });
        }
      });

      const seenMobility = new Set();
      sorted.forEach((entry) => {
        if (entry.mobility_level && !seenMobility.has(entry.mobility_level)) {
          seenMobility.add(entry.mobility_level);
          events.push({
            date: entry.log_date,
            title: `Mobility: ${mobilityLabels[entry.mobility_level] || entry.mobility_level}`,
            description: `Day ${entry.days_post_op} post-op`,
            status: "completed", icon: TrendingUp, color: "text-sky-600",
            daysFromNow: differenceInDays(now, new Date(entry.log_date)),
          });
        }
      });

      const firstActivity = sorted.find((e) => e.activity_type && e.activity_duration_minutes);
      if (firstActivity) {
        events.push({
          date: firstActivity.log_date,
          title: `First Activity: ${firstActivity.activity_type}`,
          description: `${firstActivity.activity_duration_minutes} min · Day ${firstActivity.days_post_op} post-op`,
          status: "completed", icon: Timer, color: "text-orange-600",
          daysFromNow: differenceInDays(now, new Date(firstActivity.log_date)),
        });
      }

      const firstRom = sorted.find((e) => e.rom_flexion != null || e.rom_extension != null);
      if (firstRom) {
        events.push({
          date: firstRom.log_date, title: "ROM Tracking Started",
          description: `Flexion: ${firstRom.rom_flexion || "—"}° · Extension: ${firstRom.rom_extension || "—"}°`,
          status: "completed", icon: Bone, color: "text-indigo-600",
          daysFromNow: differenceInDays(now, new Date(firstRom.log_date)),
        });
      }
    });

    appointments
      .filter((a) => a.type === "follow_up" || a.type === "checkup" || a.type === "specialist")
      .forEach((a) => {
        const days = differenceInDays(new Date(a.date), now);
        events.push({
          date: a.date, title: a.title || "Follow-up Appointment",
          description: a.provider ? `With ${a.provider}` : undefined,
          status: a.status === "completed" ? "completed" : days < 0 ? "overdue" : "upcoming",
          icon: Stethoscope,
          color: a.status === "completed" ? "text-emerald-600" : days < 0 ? "text-red-600" : "text-sky-600",
          tag: a.notes, daysFromNow: days,
        });
      });

    return events;
  }, [logs, appointments]);

  return (
    <MilestoneTimeline
      milestones={milestones} loading={loading}
      title="Recovery Milestone Timeline" icon={Award}
      emptyMessage="No recovery milestones yet. Log entries with milestones like stitches removal, follow-up appointments, and activity goals to see your healing progress."
    />
  );
}