import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Pill, Users, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format, isToday, isTomorrow, isThisWeek, addDays } from "date-fns";

export default function FamilyCareDashboard() {
  const { members, switchMember, currentMemberId } = useFamilyMember();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (members.length === 0) { setLoading(false); return; }
      try {
        const data = [];
        for (const m of members) {
          const [meds, appts, medLogs] = await Promise.all([
            base44.entities.Medication.filter({ family_member_id: m.id, active: true }),
            base44.entities.Appointment.filter({ family_member_id: m.id }, "-date", 20),
            base44.entities.MedicationLog.filter({ family_member_id: m.id }),
          ]);
          const now = new Date();
          const upcoming = appts
            .filter((a) => new Date(a.date) >= now && a.status !== "cancelled")
            .slice(0, 5);

          const todayStr = format(now, "yyyy-MM-dd");
          const todayLogs = medLogs.filter((l) => l.scheduled_date === todayStr);
          const pendingMeds = meds.filter((med) => {
            const medLogForToday = todayLogs.find((l) => l.medication_name === med.name);
            return !medLogForToday || medLogForToday.status !== "taken";
          });

          data.push({
            member: m,
            medications: meds,
            pendingMeds,
            upcomingAppointments: upcoming,
            todayMedLogs: todayLogs,
          });
        }
        setDashboardData(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [members]);

  const allAppointments = dashboardData
    .flatMap((d) => d.upcomingAppointments.map((a) => ({ ...a, memberName: d.member.name, memberPhoto: d.member.photo_url, memberId: d.member.id })))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const allPendingMeds = dashboardData
    .flatMap((d) => d.pendingMeds.map((m) => ({ ...m, memberName: d.member.name, memberPhoto: d.member.photo_url, memberId: d.member.id })));

  const totalMeds = dashboardData.reduce((s, d) => s + d.medications.length, 0);
  const totalAppts = allAppointments.length;
  const totalPending = allPendingMeds.length;

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    if (isThisWeek(d, { weekStartsOn: 1 })) return format(d, "EEEE");
    return format(d, "MMM d");
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
          <span className="text-sm text-muted-foreground">Loading family care overview...</span>
        </div>
      </Card>
    );
  }

  if (members.length === 0) return null;

  return (
    <div className="space-y-5">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-sky-600" />
            <p className="text-xs text-muted-foreground font-medium">Dependents</p>
          </div>
          <p className="text-xl font-bold text-sky-600">{members.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Pill className="w-4 h-4 text-emerald-600" />
            <p className="text-xs text-muted-foreground font-medium">Active Meds</p>
          </div>
          <p className="text-xl font-bold text-emerald-600">{totalMeds}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-violet-600" />
            <p className="text-xs text-muted-foreground font-medium">Upcoming</p>
          </div>
          <p className="text-xl font-bold text-violet-600">{totalAppts}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Appointments */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-semibold">Upcoming Appointments</h3>
            {totalAppts > 0 && <Badge variant="outline" className="text-[10px] ml-auto">{totalAppts}</Badge>}
          </div>
          {allAppointments.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-7 h-7 text-muted-foreground/30 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {allAppointments.slice(0, 10).map((appt, i) => (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30 transition cursor-pointer"
                  onClick={() => switchMember(appt.memberId)}
                >
                  <div className="w-10 h-10 rounded-lg bg-violet-50 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-violet-600 uppercase">{format(new Date(appt.date), "MMM")}</span>
                    <span className="text-sm font-bold text-violet-700 leading-none">{format(new Date(appt.date), "d")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{appt.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {appt.memberPhoto ? (
                        <img src={appt.memberPhoto} alt="" className="w-3.5 h-3.5 rounded-full" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-sky-200" />
                      )}
                      <span className="text-[10px] text-muted-foreground">{appt.memberName}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />{formatDateLabel(appt.date)} {format(new Date(appt.date), "h:mm a")}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Medications */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Pill className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold">Pending Medications Today</h3>
            {totalPending > 0 && (
              <Badge className="text-[10px] ml-auto bg-amber-100 text-amber-700 hover:bg-amber-100">
                <AlertCircle className="w-2.5 h-2.5 mr-0.5" />{totalPending} pending
              </Badge>
            )}
          </div>
          {allPendingMeds.length === 0 ? (
            <div className="text-center py-6">
              <Pill className="w-7 h-7 text-muted-foreground/30 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">All medications taken today</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Great job! ✓</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {allPendingMeds.map((med, i) => (
                <motion.div
                  key={med.id + med.memberId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30 transition cursor-pointer"
                  onClick={() => switchMember(med.memberId)}
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{med.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {med.memberPhoto ? (
                        <img src={med.memberPhoto} alt="" className="w-3.5 h-3.5 rounded-full" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-sky-200" />
                      )}
                      <span className="text-[10px] text-muted-foreground">{med.memberName}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{med.dosage} · {med.frequency}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Per-Member Quick Summary */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-semibold">Per-Member Summary</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dashboardData.map((d) => {
            const isViewing = currentMemberId === d.member.id;
            return (
              <div
                key={d.member.id}
                className={`p-3 rounded-lg border cursor-pointer transition ${isViewing ? "border-emerald-300 bg-emerald-50/50" : "border-border hover:bg-muted/30"}`}
                onClick={() => switchMember(isViewing ? null : d.member.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  {d.member.photo_url ? (
                    <img src={d.member.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sm">👤</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{d.member.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{d.member.relationship}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <Pill className="w-2.5 h-2.5" />{d.medications.length} meds
                  </span>
                  <span className="flex items-center gap-0.5 text-violet-600">
                    <Calendar className="w-2.5 h-2.5" />{d.upcomingAppointments.length} appts
                  </span>
                  {d.pendingMeds.length > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <AlertCircle className="w-2.5 h-2.5" />{d.pendingMeds.length} pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}