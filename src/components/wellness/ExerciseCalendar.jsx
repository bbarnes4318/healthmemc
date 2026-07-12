import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Dumbbell, Calendar as CalIcon, Clock, Repeat, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const intensityColors = { low: "bg-green-500", moderate: "bg-amber-500", high: "bg-red-500" };
const intensityBg = { low: "bg-green-50 text-green-700 border-green-200", moderate: "bg-amber-50 text-amber-700 border-amber-200", high: "bg-red-50 text-red-700 border-red-200" };
const difficultyColors = { easy: "bg-green-100 text-green-700", medium: "bg-amber-100 text-amber-700", hard: "bg-red-100 text-red-700" };

const bodyParts = {
  knee: "Knee", shoulder: "Shoulder", hip: "Hip", spine: "Spine", ankle: "Ankle",
  wrist: "Wrist", neck: "Neck", full_body: "Full Body", other: "Other"
};

export default function ExerciseCalendar() {
  const { currentMemberId } = useFamilyMember();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  React.useEffect(() => {
    base44.entities.ExerciseLog.list("-date", 200).then((data) => {
      const filtered = currentMemberId ? data.filter((l) => l.family_member_id === currentMemberId) : data;
      setLogs(filtered);
    }).catch(() => {});
    setLoading(false);
  }, [currentMemberId]);

  const logsByDate = useMemo(() => {
    const map = {};
    logs.forEach((l) => {
      if (!l.date) return;
      if (!map[l.date]) map[l.date] = [];
      map[l.date].push(l);
    });
    return map;
  }, [logs]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedExercises = logsByDate[selectedDateStr] || [];

  const getDayExercises = (date) => logsByDate[format(date, "yyyy-MM-dd")] || [];
  const hasHighIntensity = (date) => getDayExercises(date).some((l) => l.intensity === "high");

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalIcon className="w-4 h-4 text-orange-600" />
          <h4 className="text-xs font-semibold">Exercise Calendar</h4>
        </div>
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

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-[10px] text-center text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dayExercises = getDayExercises(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`
                relative aspect-square rounded-lg flex flex-col items-center justify-center transition text-xs
                ${isSelected ? "bg-orange-600 text-white font-bold shadow" : isToday ? "bg-orange-50 text-orange-700 border border-orange-200" : "hover:bg-muted"}
                ${!isCurrentMonth ? "opacity-30" : ""}
              `}
            >
              <span>{format(day, "d")}</span>
              {dayExercises.length > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {dayExercises.length <= 3 ? (
                    dayExercises.slice(0, 3).map((ex, i) => (
                      <span key={i} className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/80" : intensityColors[ex.intensity] || "bg-orange-500"}`} />
                    ))
                  ) : (
                    <span className={`text-[9px] ${isSelected ? "text-white/80" : "text-orange-600"} font-bold`}>{dayExercises.length}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 mb-4 flex-wrap">
        <span className="text-[10px] text-muted-foreground font-medium">Intensity:</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-green-500" />Low</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-amber-500" />Moderate</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-red-500" />High</span>
      </div>

      {/* Selected day details */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-xs font-semibold flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-orange-600" />
            {format(selectedDate, "EEEE, MMM d, yyyy")}
          </h5>
          <span className="text-[10px] text-muted-foreground">{selectedExercises.length} session{selectedExercises.length !== 1 ? "s" : ""}</span>
        </div>

        <AnimatePresence mode="wait">
          {selectedExercises.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="py-6 text-center">
                <Dumbbell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No exercises logged on this day</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key={selectedDateStr} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
              {selectedExercises.map((ex, i) => (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-3 rounded-lg border bg-card hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{ex.exercise_name}</p>
                        <p className="text-[10px] text-muted-foreground">{bodyParts[ex.body_part] || ex.body_part}</p>
                      </div>
                    </div>
                    {ex.intensity && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium border ${intensityBg[ex.intensity]}`}>
                        {ex.intensity}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {ex.sets != null && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Repeat className="w-3 h-3" />
                        <span><b className="text-foreground">{ex.sets}</b> sets</span>
                      </div>
                    )}
                    {ex.reps != null && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Repeat className="w-3 h-3" />
                        <span><b className="text-foreground">{ex.reps}</b> reps</span>
                      </div>
                    )}
                    {ex.duration_minutes != null && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span><b className="text-foreground">{ex.duration_minutes}</b> min</span>
                      </div>
                    )}
                    {ex.rom_degrees != null && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Flame className="w-3 h-3" />
                        <span><b className="text-foreground">{ex.rom_degrees}°</b> ROM</span>
                      </div>
                    )}
                    {ex.pain_level != null && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span><b className="text-foreground">{ex.pain_level}/10</b> pain</span>
                      </div>
                    )}
                    {ex.difficulty && (
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${difficultyColors[ex.difficulty] || difficultyColors.medium}`}>
                          {ex.difficulty}
                        </span>
                      </div>
                    )}
                  </div>

                  {ex.notes && (
                    <p className="text-[10px] text-muted-foreground mt-2 italic border-l-2 border-muted pl-2">{ex.notes}</p>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}