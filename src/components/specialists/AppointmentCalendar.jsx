import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Clock, Loader2, CalendarDays, Video, Stethoscope, Syringe, CheckCircle2 } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { motion } from "framer-motion";

const typeIcons = {
  ai_consultation: Stethoscope,
  follow_up: Clock,
  screening: CheckCircle2,
  vaccination: Syringe,
  checkup: CheckCircle2,
  specialist: Video,
};

const statusColors = {
  scheduled: "bg-sky-100 text-sky-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AppointmentCalendar() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.Appointment.filter({});
        setAppointments(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, []);

  const appointmentDates = useMemo(
    () => appointments.map((a) => new Date(a.date)).filter((d) => !isNaN(d)),
    [appointments]
  );

  const dayHasAppointment = (date) =>
    appointmentDates.some((d) => isSameDay(d, date));

  const selectedDayAppointments = useMemo(
    () => appointments
      .filter((a) => {
        const d = new Date(a.date);
        return !isNaN(d) && isSameDay(d, selectedDate);
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [appointments, selectedDate]
  );

  const upcoming = useMemo(
    () => appointments
      .filter((a) => new Date(a.date) >= new Date() && a.status === "scheduled")
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5),
    [appointments]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-violet-600" />
          <h3 className="font-semibold text-sm">My Consultations & Appointments</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              modifiers={{ hasAppointment: appointmentDates }}
              modifiersClassNames={{
                hasAppointment: "relative font-bold text-violet-700 after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-violet-500"
              }}
              className="rounded-lg border"
            />
          </div>

          {/* Selected day appointments */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {format(selectedDate, "EEEE, MMMM d")}
            </p>
            {selectedDayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No appointments on this day</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayAppointments.map((apt) => {
                  const Icon = typeIcons[apt.type] || Clock;
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{apt.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(apt.date), "h:mm a")}
                          {apt.provider ? ` · ${apt.provider}` : ""}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[apt.status] || "bg-gray-100 text-gray-700"}`}>
                        {apt.status}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming appointments list */}
        {upcoming.length > 0 && (
          <div className="mt-5 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Upcoming</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {upcoming.map((apt) => {
                const Icon = typeIcons[apt.type] || Clock;
                return (
                  <div key={apt.id} className="shrink-0 w-44 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5 text-violet-600" />
                      <span className="text-xs font-medium">{format(new Date(apt.date), "MMM d")}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(apt.date), "h:mm a")}</span>
                    </div>
                    <p className="text-xs truncate">{apt.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}