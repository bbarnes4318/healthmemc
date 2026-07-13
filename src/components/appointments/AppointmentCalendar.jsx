import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, isSameMonth, isSameDay, parseISO, format, isToday,
} from "date-fns";

const typeColors = {
  ai_consultation: "bg-indigo-100 text-indigo-700",
  follow_up: "bg-emerald-100 text-emerald-700",
  screening: "bg-amber-100 text-amber-700",
  vaccination: "bg-purple-100 text-purple-700",
  checkup: "bg-sky-100 text-sky-700",
  specialist: "bg-rose-100 text-rose-700",
};

export default function AppointmentCalendar({ appointments, onSelectAppointment, onSlotSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const rows = [];
  let day = calendarStart;
  let week = [];
  while (day <= calendarEnd) {
    week.push(day);
    if (week.length === 7) {
      rows.push(week);
      week = [];
    }
    day = addDays(day, 1);
  }

  const getApptsForDay = (date) => {
    return appointments.filter((a) => {
      try { return isSameDay(parseISO(a.date), date); } catch { return false; }
    });
  };

  const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToday = () => setCurrentMonth(new Date());

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-display font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={goToday}>
            Today
          </Button>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {rows.flat().map((date, i) => {
          const dayAppts = getApptsForDay(date);
          const inMonth = isSameMonth(date, currentMonth);
          const today = isToday(date);
          return (
            <div
              key={i}
              onClick={() => onSlotSelect && onSlotSelect(date)}
              className={`min-h-[72px] sm:min-h-[88px] rounded-lg border p-1 cursor-pointer transition hover:border-sky-300 hover:bg-sky-50/50 ${
                inMonth ? "bg-white border-border" : "bg-muted/30 border-transparent"
              } ${today ? "ring-1 ring-sky-400" : ""}`}
            >
              <div className={`text-[10px] font-semibold mb-0.5 ${inMonth ? "text-foreground" : "text-muted-foreground/50"} ${today ? "text-sky-600" : ""}`}>
                {format(date, "d")}
              </div>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 2).map((appt) => (
                  <div
                    key={appt.id}
                    onClick={(e) => { e.stopPropagation(); onSelectAppointment(appt); }}
                    className={`text-[9px] px-1 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-80 ${typeColors[appt.type] || "bg-gray-100 text-gray-700"}`}
                  >
                    <Clock className="w-2 h-2 inline mr-0.5" />
                    {format(parseISO(appt.date), "h:mm")} {appt.title}
                  </div>
                ))}
                {dayAppts.length > 2 && (
                  <div className="text-[9px] text-muted-foreground font-medium px-1">
                    +{dayAppts.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
        {Object.entries(typeColors).map(([type, color]) => (
          <Badge key={type} variant="outline" className={`text-[9px] ${color}`}>
            {type.replace(/_/g, " ")}
          </Badge>
        ))}
      </div>
    </Card>
  );
}