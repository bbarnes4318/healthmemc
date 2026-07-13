import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Clock, BellRing, Plus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { format, addMonths, differenceInDays, isPast } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function NextCleaningScheduler() {
  const [visits, setVisits] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [v, a] = await Promise.all([
          base44.entities.DentalVisitLog.list("-visit_date", 200),
          base44.entities.Appointment.filter({ status: "pending" }, "date", 50),
        ]);
        setVisits(v);
        setAppointments(a);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const lastCleaning = visits.find((v) => v.procedure_type === "cleaning" || v.procedure_type === "examination");
  const lastCleaningDate = lastCleaning ? new Date(lastCleaning.visit_date) : null;
  const nextDueDate = lastCleaningDate ? addMonths(lastCleaningDate, 6) : null;
  const daysUntilDue = nextDueDate ? differenceInDays(nextDueDate, new Date()) : null;
  const isOverdue = nextDueDate ? isPast(nextDueDate) : false;

  const hasPlaceholder = appointments.some((a) => a.title === "6-Month Dental Cleaning Reminder" || (a.title?.toLowerCase().includes("cleaning") && a.status === "pending"));

  const handleBookPlaceholder = async () => {
    setBooking(true);
    try {
      const placeholderDate = new Date();
      placeholderDate.setDate(placeholderDate.getDate() + 7);
      await base44.entities.Appointment.create({
        title: "Schedule Dental Cleaning",
        date: placeholderDate.toISOString(),
        type: "checkup",
        status: "pending",
        notes: `Reminder to book your 6-month dental cleaning. Last cleaning: ${lastCleaning ? format(lastCleaningDate, "MMM d, yyyy") : "N/A"}. Due: ${nextDueDate ? format(nextDueDate, "MMM d, yyyy") : "N/A"}.`,
        reminder_sent: true,
      });
      setAppointments([...appointments, {
        title: "Schedule Dental Cleaning",
        date: placeholderDate.toISOString(),
        type: "checkup",
        status: "pending",
      }]);
      toast({ title: "Calendar placeholder created", description: "We've added a reminder to your appointment calendar." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to create reminder", variant: "destructive" });
    }
    setBooking(false);
  };

  if (loading) {
    return (
      <Card className="p-4 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
      </Card>
    );
  }

  if (!lastCleaning) {
    return (
      <Card className="p-5 border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-cyan-900">No Cleaning on Record</h3>
            <p className="text-xs text-cyan-700 mt-0.5">Log a cleaning visit to start tracking your 6-month checkup schedule. We'll automatically remind you when your next cleaning is due.</p>
            <Link to="/dental-care">
              <Button size="sm" className="mt-3 bg-cyan-600 hover:bg-cyan-700">
                <Plus className="w-3.5 h-3.5 mr-1" />Log a Cleaning
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-5 ${isOverdue ? "border-red-200 bg-gradient-to-br from-red-50 to-orange-50" : hasPlaceholder ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50" : "border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50"}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isOverdue ? "bg-red-100" : hasPlaceholder ? "bg-emerald-100" : "bg-cyan-100"}`}>
          {isOverdue ? <AlertCircle className="w-5 h-5 text-red-600" /> : hasPlaceholder ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <BellRing className="w-5 h-5 text-cyan-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${isOverdue ? "text-red-900" : hasPlaceholder ? "text-emerald-900" : "text-cyan-900"}`}>
            {isOverdue ? "Cleaning Overdue" : hasPlaceholder ? "Cleaning Scheduled" : "Next Cleaning Due Soon"}
          </h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Last Cleaning</p>
              <p className="text-xs font-semibold">{format(lastCleaningDate, "MMM d, yyyy")}</p>
              {lastCleaning.dentist_name && <p className="text-[10px] text-muted-foreground">{lastCleaning.dentist_name}</p>}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Next Due</p>
              <p className={`text-xs font-semibold ${isOverdue ? "text-red-700" : ""}`}>{nextDueDate ? format(nextDueDate, "MMM d, yyyy") : "N/A"}</p>
              {daysUntilDue !== null && (
                <p className="text-[10px] text-muted-foreground">
                  {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : daysUntilDue === 0 ? "Due today" : `In ${daysUntilDue} days`}
                </p>
              )}
            </div>
          </div>
          {isOverdue && !hasPlaceholder && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-xs text-red-700 mt-2 font-medium">It's time to schedule your next dental cleaning!</p>
              <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700" onClick={handleBookPlaceholder} disabled={booking}>
                {booking ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Calendar className="w-3.5 h-3.5 mr-1" />}
                Book & Add to Calendar
              </Button>
            </motion.div>
          )}
          {hasPlaceholder && (
            <div className="flex items-center gap-1.5 mt-2">
              <Clock className="w-3 h-3 text-emerald-600" />
              <p className="text-[10px] text-emerald-700">Calendar reminder set — check your appointments</p>
            </div>
          )}
          {!isOverdue && !hasPlaceholder && daysUntilDue !== null && daysUntilDue <= 30 && (
            <Button size="sm" variant="outline" className="mt-2 border-cyan-300 text-cyan-700 hover:bg-cyan-100" onClick={handleBookPlaceholder} disabled={booking}>
              {booking ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Calendar className="w-3.5 h-3.5 mr-1" />}
              Schedule Now
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}