import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Pill, CheckCircle2, Clock, AlertCircle, Loader2, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const TIMELINE_START = 6;
const TIMELINE_END = 23;
const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START;

function parseTimeToHour(timeStr) {
  if (!timeStr) return null;
  const m24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return parseInt(m24[1]) + parseInt(m24[2]) / 60;
  const m12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (m12) {
    let h = parseInt(m12[1]);
    if (m12[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (m12[3].toUpperCase() === "AM" && h === 12) h = 0;
    return h + parseInt(m12[2]) / 60;
  }
  const lower = timeStr.toLowerCase();
  if (lower.includes("morning")) return 8;
  if (lower.includes("noon")) return 12;
  if (lower.includes("afternoon")) return 14;
  if (lower.includes("evening")) return 18;
  if (lower.includes("night") || lower.includes("bed")) return 21;
  return null;
}

function formatHour(h) {
  const hour = Math.floor(h);
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display} ${period}`;
}

function getPosition(hour) {
  const clamped = Math.max(TIMELINE_START, Math.min(TIMELINE_END, hour));
  return ((clamped - TIMELINE_START) / TIMELINE_SPAN) * 100;
}

const STATUS_CONFIG = {
  taken: { color: "bg-emerald-500", ring: "ring-emerald-200", label: "Taken" },
  due: { color: "bg-amber-500", ring: "ring-amber-200", label: "Due now" },
  missed: { color: "bg-rose-500", ring: "ring-rose-200", label: "Missed" },
  upcoming: { color: "bg-sky-300", ring: "ring-sky-100", label: "Upcoming" },
};

export default function MedicationTimelineChart() {
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { currentMemberId } = useFamilyMember();

  const today = format(new Date(), "yyyy-MM-dd");
  const currentHour = new Date().getHours() + new Date().getMinutes() / 60;

  const loadData = async () => {
    try {
      const medFilter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
      const [meds, allLogs] = await Promise.all([
        base44.entities.Medication.filter(medFilter),
        base44.entities.MedicationLog.filter({ scheduled_date: today }),
      ]);
      setMedications(meds);
      setLogs(allLogs);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [currentMemberId]);

  const scheduleData = useMemo(() => {
    return medications.map((med) => {
      const rawTimes = med.time_of_day && med.time_of_day.length > 0 ? med.time_of_day : [];
      const parsed = rawTimes.map(parseTimeToHour).filter((t) => t !== null);
      const times = parsed.length > 0 ? parsed : [8];

      const medLogs = logs.filter((l) => l.medication_name === med.name);
      const takenCount = medLogs.filter((l) => l.status === "taken").length;

      const doses = times.map((time, idx) => {
        let status;
        if (idx < takenCount) {
          status = "taken";
        } else if (currentHour > time + 2) {
          status = "missed";
        } else if (currentHour >= time - 0.5) {
          status = "due";
        } else {
          status = "upcoming";
        }
        return { time, status, timeLabel: rawTimes[idx] || formatHour(time) };
      });

      return { med, doses };
    });
  }, [medications, logs, currentHour]);

  const totalDoses = scheduleData.reduce((s, m) => s + m.doses.length, 0);
  const takenDoses = scheduleData.reduce((s, m) => s + m.doses.filter((d) => d.status === "taken").length, 0);
  const dueDoses = scheduleData.reduce((s, m) => s + m.doses.filter((d) => d.status === "due").length, 0);
  const missedDoses = scheduleData.reduce((s, m) => s + m.doses.filter((d) => d.status === "missed").length, 0);

  const markTaken = async (med) => {
    setActionLoading(med.id);
    const existing = logs.find((l) => l.medication_name === med.name);
    try {
      if (existing) {
        await base44.entities.MedicationLog.update(existing.id, {
          status: "taken",
          taken_at: new Date().toISOString(),
        });
      } else {
        await base44.entities.MedicationLog.create({
          medication_name: med.name,
          scheduled_date: today,
          status: "taken",
          taken_at: new Date().toISOString(),
          family_member_id: currentMemberId || undefined,
        });
      }
      await loadData();
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="w-4 h-4 text-sky-600" />
          <h3 className="font-display font-semibold text-sm">Today's Medication Schedule</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
        </div>
      </Card>
    );
  }

  if (medications.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="w-4 h-4 text-sky-600" />
          <h3 className="font-display font-semibold text-sm">Today's Medication Schedule</h3>
        </div>
        <div className="flex flex-col items-center py-6 text-center">
          <Pill className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No active medications to schedule</p>
        </div>
      </Card>
    );
  }

  const nowPos = getPosition(currentHour);

  return (
    <Card className="p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-sky-600" />
          <h3 className="font-display font-semibold text-sm">Today's Medication Schedule</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">{takenDoses}/{totalDoses} taken</span>
          {dueDoses > 0 && <span className="text-amber-600 font-medium">{dueDoses} due</span>}
          {missedDoses > 0 && <span className="text-rose-600 font-medium">{missedDoses} missed</span>}
        </div>
      </div>

      {/* Time axis */}
      <div className="flex items-center gap-2 sm:gap-3 mb-2">
        <div className="w-24 sm:w-32 shrink-0" />
        <div className="flex-1 relative h-4">
          {[6, 9, 12, 15, 18, 21].map((h) => (
            <div
              key={h}
              className="absolute text-[9px] sm:text-[10px] text-muted-foreground -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${getPosition(h)}%` }}
            >
              {h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`}
            </div>
          ))}
        </div>
      </div>

      {/* Medication rows */}
      <div className="space-y-3">
        {scheduleData.map(({ med, doses }) => (
          <div key={med.id} className="flex items-center gap-2 sm:gap-3">
            {/* Label */}
            <div className="w-24 sm:w-32 shrink-0 text-right">
              <p className="text-xs sm:text-sm font-medium truncate">{med.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{med.dosage}</p>
            </div>

            {/* Timeline track */}
            <div className="flex-1 relative h-8">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

              {/* Now indicator */}
              {nowPos >= 0 && nowPos <= 100 && (
                <div className="absolute top-0 bottom-0 w-px bg-sky-400/50 z-10" style={{ left: `${nowPos}%` }}>
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sky-500" />
                </div>
              )}

              {/* Dose markers */}
              {doses.map((dose, idx) => {
                const pos = getPosition(dose.time);
                const config = STATUS_CONFIG[dose.status];
                const canMark = dose.status !== "taken";
                return (
                  <button
                    key={idx}
                    onClick={() => canMark && markTaken(med)}
                    disabled={actionLoading === med.id || dose.status === "taken"}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full ${config.color} ring-2 ${config.ring} flex items-center justify-center transition-transform ${canMark ? "hover:scale-110 cursor-pointer" : "cursor-default"} ${actionLoading === med.id ? "opacity-50" : ""}`}
                    style={{ left: `${pos}%` }}
                    title={`${med.name} — ${dose.timeLabel} — ${config.label}`}
                  >
                    {dose.status === "taken" ? (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    ) : dose.status === "missed" ? (
                      <AlertCircle className="w-3 h-3 text-white" />
                    ) : (
                      <Clock className="w-2.5 h-2.5 text-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
            <span className="text-[10px] text-muted-foreground">{config.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-px h-3 bg-sky-500" />
          <span className="text-[10px] text-muted-foreground">Now</span>
        </div>
      </div>

      {/* Due now prompt */}
      {dueDoses > 0 && (
        <div className="mt-3 p-3 bg-amber-50 rounded-lg flex items-center gap-3">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 flex-1">
            {dueDoses} medication{dueDoses > 1 ? "s" : ""} due now — tap the amber dot to log as taken.
          </p>
        </div>
      )}
    </Card>
  );
}