import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import MilestoneTimeline from "@/components/shared/MilestoneTimeline";
import { Dumbbell, TrendingUp, Activity, Award, Target } from "lucide-react";
import { differenceInDays } from "date-fns";

const bodyPartLabels = {
  knee: "Knee", shoulder: "Shoulder", hip: "Hip", spine: "Spine",
  ankle: "Ankle", wrist: "Wrist", neck: "Neck", full_body: "Full Body", other: "Other",
};

export default function PTMilestoneTimeline() {
  const { currentMemberId } = useFamilyMember();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.ExerciseLog.list("-date", 500);
        setLogs(currentMemberId ? data.filter((l) => l.family_member_id === currentMemberId) : data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  const milestones = useMemo(() => {
    const now = new Date();
    const events = [];
    const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sorted.length > 0) {
      const first = sorted[0];
      events.push({
        date: first.date, title: `PT Started: ${first.exercise_name}`,
        description: `${bodyPartLabels[first.body_part] || first.body_part} · ${first.sets || 0}×${first.reps || 0}`,
        status: "completed", icon: Dumbbell, color: "text-orange-600",
        daysFromNow: differenceInDays(now, new Date(first.date)),
      });
    }

    const bodyPartMaxRom = {};
    sorted.forEach((log) => {
      if (log.rom_degrees == null) return;
      const part = log.body_part;
      if (!bodyPartMaxRom[part]) {
        bodyPartMaxRom[part] = { value: log.rom_degrees, date: log.date };
        events.push({
          date: log.date, title: `First ROM: ${bodyPartLabels[part] || part}`,
          description: `${log.rom_degrees}° range of motion recorded`,
          status: "completed", icon: Activity, color: "text-indigo-600",
          daysFromNow: differenceInDays(now, new Date(log.date)),
        });
      } else if (log.rom_degrees > bodyPartMaxRom[part].value + 5) {
        events.push({
          date: log.date, title: `ROM Improvement: ${bodyPartLabels[part] || part}`,
          description: `New max: ${log.rom_degrees}° (was ${bodyPartMaxRom[part].value}°)`,
          status: "completed", icon: TrendingUp, color: "text-emerald-600",
          daysFromNow: differenceInDays(now, new Date(log.date)),
        });
        bodyPartMaxRom[part] = { value: log.rom_degrees, date: log.date };
      }
    });

    let minPain = null;
    sorted.forEach((log) => {
      if (log.pain_level == null) return;
      if (minPain === null) {
        minPain = { value: log.pain_level, date: log.date };
      } else if (log.pain_level < minPain.value) {
        events.push({
          date: log.date, title: `Pain Reduced to ${log.pain_level}/10`,
          description: `New lowest pain level (was ${minPain.value}/10)`,
          status: "completed", icon: Target, color: "text-emerald-600",
          daysFromNow: differenceInDays(now, new Date(log.date)),
        });
        minPain = { value: log.pain_level, date: log.date };
      }
    });

    if (logs.length >= 10) {
      const tenth = sorted[9];
      events.push({
        date: tenth.date, title: "10 Exercises Completed",
        description: "Consistency milestone reached",
        status: "completed", icon: Award, color: "text-violet-600",
        daysFromNow: differenceInDays(now, new Date(tenth.date)),
      });
    }

    return events;
  }, [logs]);

  return (
    <MilestoneTimeline
      milestones={milestones} loading={loading}
      title="Physical Therapy Milestone Timeline" icon={Award}
      emptyMessage="No PT milestones yet. Log exercises with ROM and pain data to track your recovery milestones."
    />
  );
}