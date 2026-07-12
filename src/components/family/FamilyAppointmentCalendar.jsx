import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, User, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, addDays, parseISO } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { useToast } from "@/components/ui/use-toast";

const typeColors = {
  ai_consultation: "bg-sky-100 text-sky-700 border-sky-200",
  follow_up: "bg-violet-100 text-violet-700 border-violet-200",
  screening: "bg-amber-100 text-amber-700 border-amber-200",
  vaccination: "bg-emerald-100 text-emerald-700 border-emerald-200",
  checkup: "bg-blue-100 text-blue-700 border-blue-200",
  specialist: "bg-rose-100 text-rose-700 border-rose-200",
};

const typeLabels = {
  ai_consultation: "AI Consult",
  follow_up: "Follow-up",
  screening: "Screening",
  vaccination: "Vaccination",
  checkup: "Checkup",
  specialist: "Specialist",
};

export default function FamilyAppointmentCalendar() {
  const { members } = useFamilyMember();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadAppointments = useCallback(async () => {
    try {
      const data = await base44.entities.Appointment.list("-date", 200);
      const upcoming = data.filter((a) => new Date(a.date) >= subMonths(new Date(), 1) && a.status !== "cancelled");
      setAppointments(upcoming);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const memberMap = useMemo(() => {
    const map = {};
    members.forEach((m) => { map[m.id] = m.name; });
    return map;
  }, [members]);

  const apptsByDate = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      if (!a.date) return;
      const key = format(new Date(a.date), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [appointments]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const sourceDate = result.source.droppableId;
    const destDate = result.destination.droppableId;
    if (sourceDate === destDate) return;

    const apptId = result.draggableId;
    const appt = appointments.find((a) => a.id === apptId);
    if (!appt) return;

    const oldDate = new Date(appt.date);
    const newDate = parseISO(destDate);
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);

    setAppointments((prev) => prev.map((a) => a.id === apptId ? { ...a, date: newDate.toISOString() } : a));

    try {
      await base44.entities.Appointment.update(apptId, { date: newDate.toISOString() });
      toast({ title: "Appointment rescheduled", description: `${appt.title} moved to ${format(newDate, "MMM d, yyyy")}` });
    } catch (e) {
      console.error(e);
      setAppointments((prev) => prev.map((a) => a.id === apptId ? { ...a, date: oldDate.toISOString() } : a));
      toast({ title: "Failed to reschedule", variant: "destructive" });
    }
  };

  const upcomingByMember = useMemo(() => {
    const now = new Date();
    const upcoming = appointments
      .filter((a) => new Date(a.date) >= now && a.status !== "cancelled")
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const byMember = {};
    members.forEach((m) => { byMember[m.id] = []; });
    byMember["self"] = [];

    upcoming.forEach((a) => {
      if (a.family_member_id && byMember[a.family_member_id]) {
        byMember[a.family_member_id].push(a);
      } else if (!a.family_member_id) {
        byMember["self"].push(a);
      }
    });
    return byMember;
  }, [appointments, members]);

  if (loading) {
    return <Card className="p-6"><div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <CalIcon className="w-4 h-4 text-sky-600" />
            Family Appointment Calendar
          </h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold min-w-[90px] text-center">{format(currentMonth, "MMMM yyyy")}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-[10px] text-center text-muted-foreground font-medium py-1">{d}</div>
          ))}
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayAppts = apptsByDate[dateStr] || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <Droppable key={dateStr} droppableId={dateStr}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        min-h-[80px] rounded-lg p-1 border transition
                        ${snapshot.isDraggingOver ? "border-sky-400 bg-sky-50" : "border-border"}
                        ${!isCurrentMonth ? "opacity-40" : ""}
                        ${isToday ? "ring-1 ring-sky-300" : ""}
                      `}
                    >
                      <div className={`text-[10px] text-center mb-0.5 ${isToday ? "font-bold text-sky-600" : "text-muted-foreground"}`}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-0.5">
                        {dayAppts.slice(0, 3).map((appt, idx) => {
                          const tc = typeColors[appt.type] || typeColors.checkup;
                          return (
                            <Draggable key={appt.id} draggableId={appt.id} index={idx}>
                              {(p, s) => (
                                <div
                                  ref={p.innerRef}
                                  {...p.draggableProps}
                                  {...p.dragHandleProps}
                                  className={`text-[9px] px-1 py-0.5 rounded border cursor-grab ${tc} ${s.isDragging ? "shadow-md ring-1 ring-sky-300" : ""} flex items-center gap-0.5`}
                                >
                                  <GripVertical className="w-2 h-2 shrink-0 opacity-50" />
                                  <span className="truncate">{format(new Date(appt.date), "h:mm")} {appt.title}</span>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {dayAppts.length > 3 && (
                          <div className="text-[9px] text-muted-foreground text-center">+{dayAppts.length - 3} more</div>
                        )}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-medium">Legend:</span>
          {Object.entries(typeLabels).map(([key, label]) => (
            <span key={key} className={`text-[9px] px-1.5 py-0.5 rounded border ${typeColors[key]}`}>{label}</span>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Drag any appointment to a different day to reschedule it.</p>
      </Card>

      {/* Upcoming by Dependent */}
      <Card className="p-5">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-sky-600" />
          Upcoming Appointments by Dependent
        </h3>

        {Object.entries(upcomingByMember).filter(([, appts]) => appts.length > 0).length === 0 ? (
          <div className="py-6 text-center">
            <CalIcon className="w-8 h-8 text-muted-foreground/20 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No upcoming appointments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(upcomingByMember).filter(([, appts]) => appts.length > 0).map(([memberId, appts]) => (
              <div key={memberId}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-semibold">{memberId === "self" ? "You" : memberMap[memberId] || "Unknown"}</span>
                  <span className="text-[10px] text-muted-foreground">({appts.length})</span>
                </div>
                <div className="space-y-1 ml-4">
                  {appts.map((appt) => {
                    const tc = typeColors[appt.type] || typeColors.checkup;
                    return (
                      <motion.div
                        key={appt.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                          <CalIcon className="w-3.5 h-3.5 text-sky-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{appt.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(appt.date), "EEE, MMM d 'at' h:mm a")}
                            {appt.provider && ` · ${appt.provider}`}
                          </p>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${tc}`}>{typeLabels[appt.type] || appt.type}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}