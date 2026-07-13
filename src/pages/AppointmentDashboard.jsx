import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import {
  Calendar, Clock, Plus, Loader2, Contact, Phone, Mail,
  Stethoscope, CheckCircle, CalendarPlus, ChevronRight, User,
  LayoutGrid, List as ListIcon
} from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format, isAfter, isToday, parseISO } from "date-fns";
import { motion } from "framer-motion";
import AppointmentCalendar from "@/components/appointments/AppointmentCalendar";
import RescheduleDialog from "@/components/appointments/RescheduleDialog";
import AppointmentCareNotes from "@/components/appointments/AppointmentCareNotes";

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  scheduled: { label: "Scheduled", color: "bg-sky-100 text-sky-700" },
  confirmed: { label: "Confirmed", color: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

const typeIcons = {
  ai_consultation: Stethoscope, follow_up: CheckCircle, screening: Contact,
  vaccination: Contact, checkup: Stethoscope, specialist: Contact,
};

export default function AppointmentDashboard() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [newAppt, setNewAppt] = useState({ title: "", date: "", type: "specialist", notes: "", provider: "" });
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [showReschedule, setShowReschedule] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const [appts, docs] = await Promise.all([
        base44.entities.Appointment.filter(filter, "date", 100),
        base44.entities.DoctorDirectory.list("-created_date", 100),
      ]);
      setAppointments(appts);
      setDoctors(docs);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentMemberId]);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const upcoming = appointments.filter((a) => {
    try { return isAfter(parseISO(a.date), now) || isToday(parseISO(a.date)); } catch { return false; }
  }).filter((a) => a.status !== "cancelled" && a.status !== "completed");
  const past = appointments.filter((a) => {
    try { return !isAfter(parseISO(a.date), now) && !isToday(parseISO(a.date)); } catch { return false; }
  }).filter((a) => a.status !== "cancelled").slice(0, 5);

  const openNewWithDoctor = (doc) => {
    setSelectedDoctor(doc);
    setNewAppt({ title: `Appointment with ${doc.doctor_name}`, date: "", type: "specialist", notes: "", provider: doc.doctor_name });
    setShowNewDialog(true);
  };

  const handleCreate = async () => {
    if (!newAppt.title || !newAppt.date) {
      toast({ title: "Title and date are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Appointment.create({
        ...newAppt,
        date: newAppt.date,
        status: "scheduled",
        family_member_id: currentMemberId || null,
      });
      toast({ title: "Appointment scheduled" });
      setShowNewDialog(false);
      setNewAppt({ title: "", date: "", type: "specialist", notes: "", provider: "" });
      setSelectedDoctor(null);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to schedule", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await base44.entities.Appointment.update(id, { status });
      toast({ title: `Marked as ${status}` });
      load();
    } catch (e) { console.error(e); toast({ title: "Update failed", variant: "destructive" }); }
  };

  const handleReschedule = async (id, updates) => {
    try {
      await base44.entities.Appointment.update(id, updates);
      toast({ title: "Appointment rescheduled" });
      setShowReschedule(false);
      setRescheduleAppt(null);
      load();
    } catch (e) { console.error(e); toast({ title: "Reschedule failed", variant: "destructive" }); }
  };

  const openReschedule = (appt) => {
    setRescheduleAppt(appt);
    setShowReschedule(true);
  };

  const handleSlotSelect = (date) => {
    setSelectedDoctor(null);
    const dateTime = format(date, "yyyy-MM-dd'T'09:00");
    setNewAppt({ title: "", date: dateTime, type: "specialist", notes: "", provider: "" });
    setShowNewDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Appointment Dashboard</h1>
              <p className="text-sm text-muted-foreground">{upcoming.length} upcoming · {doctors.length} specialists</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition ${viewMode === "list" ? "bg-sky-600 text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}
              >
                <ListIcon className="w-3.5 h-3.5" /> List
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition ${viewMode === "calendar" ? "bg-sky-600 text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Calendar
              </button>
            </div>
            <Button onClick={() => { setSelectedDoctor(null); setNewAppt({ title: "", date: "", type: "specialist", notes: "", provider: "" }); setShowNewDialog(true); }} className="bg-sky-600 hover:bg-sky-700">
              <Plus className="w-4 h-4 mr-2" /> Schedule
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Calendar or List */}
          <div className="lg:col-span-2 space-y-4">
            {viewMode === "calendar" && (
              <AppointmentCalendar
                appointments={upcoming}
                onSelectAppointment={openReschedule}
                onSlotSelect={handleSlotSelect}
              />
            )}

            {viewMode === "list" && (
              <>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <h2 className="text-sm font-semibold">Upcoming Appointments</h2>
                </div>
                {upcoming.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                    <p className="text-xs text-muted-foreground mt-1">Schedule one from your specialist directory below</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((appt, i) => {
                      const TIcon = typeIcons[appt.type] || Stethoscope;
                      const statusCfg = statusConfig[appt.status] || statusConfig.pending;
                      const apptDate = parseISO(appt.date);
                      return (
                        <motion.div key={appt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                          <Card className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                                <TIcon className="w-5 h-5 text-sky-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-sm font-semibold">{appt.title}</h3>
                                  <Badge variant="outline" className={`text-[10px] ${statusCfg.color}`}>{statusCfg.label}</Badge>
                                </div>
                                {appt.provider && <p className="text-xs text-muted-foreground mt-0.5">{appt.provider}</p>}
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />{format(apptDate, "EEE, MMM d, yyyy")}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />{format(apptDate, "h:mm a")}
                                  </span>
                                </div>
                                {appt.notes && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{appt.notes}</p>}
                                <AppointmentCareNotes appointment={appt} onUpdate={load} />
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  {appt.status !== "confirmed" && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(appt.id, "confirmed")}>
                                      <CheckCircle className="w-3 h-3 mr-1" /> Confirm
                                    </Button>
                                  )}
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openReschedule(appt)}>
                                    <CalendarPlus className="w-3 h-3 mr-1" /> Reschedule
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => handleStatusChange(appt.id, "cancelled")}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Recent past */}
                {past.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mt-6 mb-2">
                      <CheckCircle className="w-4 h-4 text-muted-foreground" />
                      <h2 className="text-sm font-semibold text-muted-foreground">Recent Visits</h2>
                    </div>
                    <div className="space-y-2">
                      {past.map((appt) => {
                        const statusCfg = statusConfig[appt.status] || statusConfig.completed;
                        return (
                          <Card key={appt.id} className="p-3 opacity-70">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{appt.title}</p>
                                <p className="text-xs text-muted-foreground">{appt.provider} · {format(parseISO(appt.date), "MMM d, yyyy")}</p>
                              </div>
                              <Badge variant="outline" className={`text-[10px] ${statusCfg.color}`}>{statusCfg.label}</Badge>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Specialist Directory */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Contact className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-semibold">My Specialists</h2>
              <Link to="/doctor-directory" className="ml-auto text-xs text-sky-600 hover:underline flex items-center gap-0.5">
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {doctors.length === 0 ? (
              <Card className="p-6 text-center">
                <Contact className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No specialists in your directory yet</p>
                <Link to="/doctor-directory">
                  <Button variant="outline" size="sm" className="mt-2 text-xs">Add Specialist</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-2">
                {doctors.map((doc) => (
                  <Card key={doc.id} className="p-3 hover:shadow-md transition">
                    <div className="flex items-start gap-2">
                      <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{doc.doctor_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.specialty}</p>
                        {doc.practice_name && <p className="text-[10px] text-muted-foreground truncate">{doc.practice_name}</p>}
                        <div className="flex gap-1.5 mt-1.5">
                          {doc.phone && (
                            <a href={`tel:${doc.phone}`} className="text-muted-foreground hover:text-sky-600">
                              <Phone className="w-3 h-3" />
                            </a>
                          )}
                          {doc.email && (
                            <a href={`mailto:${doc.email}`} className="text-muted-foreground hover:text-sky-600">
                              <Mail className="w-3 h-3" />
                            </a>
                          )}
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-sky-600" onClick={() => openNewWithDoctor(doc)}>
                            <CalendarPlus className="w-3 h-3 mr-1" /> Book
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* New Appointment Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedDoctor && (
              <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600" />
                <span className="text-sm font-medium">{selectedDoctor.doctor_name}</span>
                <span className="text-xs text-muted-foreground">— {selectedDoctor.specialty}</span>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
              <Input value={newAppt.title} onChange={(e) => setNewAppt({ ...newAppt, title: e.target.value })} placeholder="e.g. Knee follow-up" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date & Time</label>
                <Input type="datetime-local" value={newAppt.date} onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                <select value={newAppt.type} onChange={(e) => setNewAppt({ ...newAppt, type: e.target.value })} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="specialist">Specialist</option>
                  <option value="checkup">Checkup</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="screening">Screening</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="ai_consultation">AI Consultation</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Provider</label>
              <Input value={newAppt.provider} onChange={(e) => setNewAppt({ ...newAppt, provider: e.target.value })} placeholder="Doctor or clinic name" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
              <Textarea value={newAppt.notes} onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })} rows={2} placeholder="Reason for visit, prep instructions..." />
            </div>
            <Button onClick={handleCreate} disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarPlus className="w-4 h-4 mr-2" />}
              Schedule Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <RescheduleDialog
        open={showReschedule}
        onOpenChange={setShowReschedule}
        appointment={rescheduleAppt}
        onRescheduled={handleReschedule}
      />
    </div>
  );
}