import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, AlertCircle, Calendar, ClipboardList, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { format, isSameDay, isAfter } from "date-fns";

export default function IntakeFormDashboard({ onNewTemplate }) {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [intakeForms, setIntakeForms] = useState([]);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [appts, forms, tpls] = await Promise.all([
          base44.entities.Appointment.list("-date", 100),
          base44.entities.IntakeForm.list("-created_date", 100),
          base44.entities.IntakeTemplate.list("-created_date", 100),
        ]);
        const now = new Date();
        const upcoming = appts
          .filter((a) => a.date && isAfter(new Date(a.date), now) && a.status !== "cancelled")
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setAppointments(upcoming);
        setIntakeForms(forms);
        setTemplates(tpls);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>;
  }

  const matchedForms = new Set();
  const appointmentStatus = appointments.map((appt) => {
    const apptDate = new Date(appt.date);
    const matchingForm = intakeForms.find((f) => {
      if (!f.appointment_date) return false;
      const formDate = new Date(f.appointment_date);
      if (isSameDay(formDate, apptDate)) {
        matchedForms.add(f.id);
        return true;
      }
      return false;
    });
    return {
      ...appt,
      apptDate,
      formStatus: matchingForm ? (matchingForm.status === "draft" ? "draft" : "completed") : "pending",
      matchingForm,
    };
  });

  const completed = appointmentStatus.filter((a) => a.formStatus === "completed").length;
  const drafts = appointmentStatus.filter((a) => a.formStatus === "draft").length;
  const pending = appointmentStatus.filter((a) => a.formStatus === "pending").length;
  const completedForms = intakeForms.filter((f) => f.status === "completed").length;

  const stats = [
    { label: "Upcoming", value: appointments.length, icon: Calendar, color: "text-sky-600", bg: "bg-sky-100" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "In Draft", value: drafts, icon: FileText, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Pending", value: pending, icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Appointment Checklist */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-4 h-4 text-violet-600" />
          <h3 className="font-semibold text-sm">Appointment Intake Checklist</h3>
        </div>

        {appointmentStatus.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming appointments</p>
            <p className="text-xs text-muted-foreground mt-1">Schedule an appointment and create an intake form to track your preparation.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointmentStatus.map((appt, i) => (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  appt.formStatus === "completed" ? "bg-emerald-100" :
                  appt.formStatus === "draft" ? "bg-amber-100" : "bg-red-50"
                }`}>
                  {appt.formStatus === "completed" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> :
                   appt.formStatus === "draft" ? <FileText className="w-5 h-5 text-amber-600" /> :
                   <AlertCircle className="w-5 h-5 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{appt.title}</p>
                    <Badge variant="outline" className={`text-[10px] border-0 ${
                      appt.formStatus === "completed" ? "bg-emerald-100 text-emerald-700" :
                      appt.formStatus === "draft" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {appt.formStatus === "completed" ? "Form Ready" :
                       appt.formStatus === "draft" ? "Draft Saved" :
                       "No Form Yet"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(appt.apptDate, "MMM d, yyyy 'at' h:mm a")}
                    </span>
                    {appt.provider && <span>· {appt.provider}</span>}
                    {appt.type && <span className="capitalize">· {appt.type.replace(/_/g, " ")}</span>}
                  </div>
                </div>
                {appt.formStatus === "pending" && (
                  <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={onNewTemplate}>
                    <ClipboardList className="w-3 h-3 mr-1" /> Prepare
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>{completedForms} completed form{completedForms !== 1 ? "s" : ""} · {templates.length} template{templates.length !== 1 ? "s" : ""} available</span>
      </div>
    </div>
  );
}