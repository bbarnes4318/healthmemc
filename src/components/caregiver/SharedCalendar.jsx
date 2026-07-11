import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Pill, Loader2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, startOfWeek, endOfWeek, isToday } from "date-fns";

export default function SharedCalendar() {
  const [members, setMembers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [medLogs, setMedLogs] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        const [memberData, apptData, logData, medData] = await Promise.all([
          base44.entities.FamilyMember.list("-created_date", 50),
          base44.entities.Appointment.filter({ status: "scheduled" }, "-date", 200),
          base44.entities.MedicationLog.filter({ status: "taken" }, "-scheduled_date", 200),
          base44.entities.Medication.filter({ active: true }),
        ]);
        setMembers(memberData);
        setAppointments(apptData);
        setMedLogs(logData);
        setMedications(medData);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const memberNameById = useMemo(() => {
    const map = { self: "You" };
    members.forEach((m) => { map[m.id] = m.name; });
    return map;
  }, [members]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const getDayEvents = (day) => {
    const dayAppts = appointments.filter((a) => a.date && isSameDay(new Date(a.date), day));
    const dayMeds = medLogs.filter((l) => l.scheduled_date && isSameDay(new Date(l.scheduled_date), day));
    return { appointments: dayAppts, medications: dayMeds };
  };

  const upcomingAll = useMemo(() => {
    const now = new Date();
    const future = [...appointments].filter((a) => new Date(a.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
    return future.slice(0, 10);
  }, [appointments]);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
          <span className="text-sm text-muted-foreground">Loading shared calendar...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-600" /> Shared Family Calendar
          </h3>
          <p className="text-xs text-muted-foreground">All visits and medication tasks in one view</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, -1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-32 text-center">{format(currentDate, "MMMM yyyy")}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCurrentDate(new Date())}>Today</Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Calendar Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const { appointments: dayAppts, medications: dayMeds } = getDayEvents(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const today = isToday(day);
              const hasEvents = dayAppts.length > 0 || dayMeds.length > 0;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.005 }}
                  className={`min-h-16 p-1 rounded-lg border text-xs ${isCurrentMonth ? "bg-card" : "bg-muted/30"} ${today ? "border-violet-400 ring-1 ring-violet-200" : "border-border"}`}
                >
                  <div className={`text-right ${today ? "text-violet-600 font-bold" : isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {format(day, "d")}
                  </div>
                  {hasEvents && (
                    <div className="space-y-0.5 mt-0.5">
                      {dayAppts.slice(0, 2).map((apt, idx) => (
                        <div key={idx} className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-sky-100 text-sky-700 text-[9px] truncate">
                          <Calendar className="w-2 h-2 shrink-0" />
                          <span className="truncate">{apt.title}</span>
                        </div>
                      ))}
                      {dayMeds.length > 0 && (
                        <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px]">
                          <Pill className="w-2 h-2 shrink-0" />
                          <span>{dayMeds.length} med task{dayMeds.length === 1 ? "" : "s"}</span>
                        </div>
                      )}
                      {dayAppts.length > 2 && (
                        <p className="text-[8px] text-muted-foreground px-1">+{dayAppts.length - 2} more</p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-sky-100" />
              <span className="text-[10px] text-muted-foreground">Appointments</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-100" />
              <span className="text-[10px] text-muted-foreground">Medication tasks</span>
            </div>
          </div>
        </div>

        {/* Upcoming List */}
        <div className="lg:w-64 shrink-0">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-violet-600" /> Upcoming
          </h4>
          {upcomingAll.length === 0 ? (
            <p className="text-xs text-muted-foreground">No upcoming appointments</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {upcomingAll.map((apt) => {
                const memberName = apt.family_member_id ? (memberNameById[apt.family_member_id] || "Family") : "You";
                return (
                  <div key={apt.id} className="p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                      <span className="text-xs font-medium truncate flex-1">{apt.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 pl-3.5">
                      <span className="text-[10px] text-muted-foreground">{format(new Date(apt.date), "EEE, MMM d · h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 pl-3.5">
                      <span className="text-[10px] text-violet-600 font-medium">{memberName}</span>
                      {apt.provider && <span className="text-[10px] text-muted-foreground">· {apt.provider}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}