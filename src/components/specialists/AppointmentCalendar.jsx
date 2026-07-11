import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Loader2, CalendarDays, Video, Stethoscope, Syringe, CheckCircle2, FileText, Link2, ChevronDown } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const typeIcons = {
  ai_consultation: Stethoscope,
  follow_up: Clock,
  screening: CheckCircle2,
  vaccination: Syringe,
  checkup: CheckCircle2,
  specialist: Video,
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  scheduled: { label: "Scheduled", color: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-600" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

const statusOptions = ["pending", "scheduled", "confirmed", "completed", "cancelled"];

export default function AppointmentCalendar() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusMenuFor, setStatusMenuFor] = useState(null);
  const [reportDialogFor, setReportDialogFor] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const { toast } = useToast();

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

  const loadConsultations = async () => {
    setLoadingConsultations(true);
    try {
      const data = await base44.entities.Consultation.filter({}, "-created_date", 50);
      setConsultations(data);
    } catch (err) { console.error(err); }
    setLoadingConsultations(false);
  };

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
      .filter((a) => new Date(a.date) >= new Date() && a.status !== "cancelled" && a.status !== "completed")
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5),
    [appointments]
  );

  const handleStatusChange = async (aptId, newStatus) => {
    setStatusMenuFor(null);
    try {
      await base44.entities.Appointment.update(aptId, { status: newStatus });
      setAppointments((prev) => prev.map((a) => a.id === aptId ? { ...a, status: newStatus } : a));
      toast({ title: `Appointment marked as ${statusConfig[newStatus].label}` });
    } catch (err) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const openReportDialog = async (apt) => {
    setReportDialogFor(apt);
    await loadConsultations();
  };

  const handleAttachReport = async (consultationId) => {
    setAttaching(true);
    try {
      await base44.entities.Appointment.update(reportDialogFor.id, { consultation_id: consultationId });
      setAppointments((prev) => prev.map((a) => a.id === reportDialogFor.id ? { ...a, consultation_id: consultationId } : a));
      toast({ title: "Consultation report attached" });
      setReportDialogFor(null);
    } catch (err) {
      toast({ title: "Failed to attach report", variant: "destructive" });
    }
    setAttaching(false);
  };

  const handleDetachReport = async (aptId) => {
    try {
      await base44.entities.Appointment.update(aptId, { consultation_id: "" });
      setAppointments((prev) => prev.map((a) => a.id === aptId ? { ...a, consultation_id: "" } : a));
      toast({ title: "Report detached" });
    } catch (err) {
      toast({ title: "Failed to detach report", variant: "destructive" });
    }
  };

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
                  const sc = statusConfig[apt.status] || statusConfig.pending;
                  const hasReport = !!apt.consultation_id;
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{apt.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(apt.date), "h:mm a")}
                            {apt.provider ? ` · ${apt.provider}` : ""}
                          </p>
                          {hasReport && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-violet-600">
                              <FileText className="w-3 h-3" />
                              <span>Report attached</span>
                              <button
                                onClick={() => handleDetachReport(apt.id)}
                                className="text-red-400 hover:text-red-600 ml-1 underline"
                              >
                                remove
                              </button>
                            </div>
                          )}
                        </div>
                        {/* Status dropdown */}
                        <div className="relative shrink-0">
                          <button
                            onClick={() => setStatusMenuFor(statusMenuFor === apt.id ? null : apt.id)}
                            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <AnimatePresence>
                            {statusMenuFor === apt.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setStatusMenuFor(null)} />
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  className="absolute right-0 top-7 z-20 bg-white border rounded-lg shadow-lg py-1 min-w-[130px]"
                                >
                                  {statusOptions.map((s) => (
                                    <button
                                      key={s}
                                      onClick={() => handleStatusChange(apt.id, s)}
                                      className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted transition ${apt.status === s ? "font-bold" : ""}`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[s].dot}`} />
                                      {statusConfig[s].label}
                                    </button>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      {/* Attach report button */}
                      {!hasReport && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                          onClick={() => openReportDialog(apt)}
                        >
                          <Link2 className="w-3.5 h-3.5 mr-1" /> Attach Consultation Report
                        </Button>
                      )}
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
                const sc = statusConfig[apt.status] || statusConfig.pending;
                return (
                  <div key={apt.id} className="shrink-0 w-44 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5 text-violet-600" />
                      <span className="text-xs font-medium">{format(new Date(apt.date), "MMM d")}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(apt.date), "h:mm a")}</span>
                    </div>
                    <p className="text-xs truncate">{apt.title}</p>
                    <span className={`inline-flex items-center gap-1 mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sc.color}`}>
                      <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Attach Report Dialog */}
      <Dialog open={!!reportDialogFor} onOpenChange={(v) => !v && setReportDialogFor(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attach Consultation Report</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">
            Link a consultation report to "{reportDialogFor?.title}".
          </p>
          {loadingConsultations ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No consultation reports found. Complete an AI consultation first.</p>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {consultations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleAttachReport(c.id)}
                  disabled={attaching}
                  className="flex items-start gap-3 w-full p-3 border rounded-lg hover:bg-muted transition text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{c.type?.replace(/_/g, " ")}</p>
                    {c.specialty && <p className="text-xs text-muted-foreground">{c.specialty}</p>}
                    {c.severity && <p className="text-xs text-muted-foreground mt-0.5">Severity: {c.severity}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.status === "completed" ? "Completed" : c.status === "in_progress" ? "In progress" : c.status}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}