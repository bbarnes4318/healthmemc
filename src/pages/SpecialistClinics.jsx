import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope, Loader2, Phone, Mail, MapPin, Clock,
  Calendar, Building2, MessageSquare, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import SpecialistMessageDialog from "@/components/specialists/SpecialistMessageDialog";
import moment from "moment";

const specialtyColors = {
  Cardiology: "bg-rose-50 text-rose-700 border-rose-200",
  Dermatology: "bg-amber-50 text-amber-700 border-amber-200",
  Neurology: "bg-violet-50 text-violet-700 border-violet-200",
  Orthopedics: "bg-sky-50 text-sky-700 border-sky-200",
  Pediatrics: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Psychiatry: "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Internal Medicine": "bg-teal-50 text-teal-700 border-teal-200",
  Oncology: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  Default: "bg-sky-50 text-sky-700 border-sky-200",
};

function getSpecialtyColor(specialty) {
  if (!specialty) return specialtyColors.Default;
  const key = Object.keys(specialtyColors).find((k) =>
    k !== "Default" && specialty.toLowerCase().includes(k.toLowerCase())
  );
  return key ? specialtyColors[key] : specialtyColors.Default;
}

export default function SpecialistClinics() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageDoctor, setMessageDoctor] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docs, appts] = await Promise.all([
        base44.entities.DoctorDirectory.list("-created_date", 100),
        base44.entities.Appointment.filter({ status: "scheduled" }, "-date", 50),
      ]);
      setDoctors(docs);
      setAppointments(appts);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getNextAppointment = (doctorName) => {
    if (!doctorName) return null;
    return appointments.find((a) => {
      const provider = (a.provider || "").toLowerCase();
      const name = doctorName.toLowerCase();
      return provider.includes(name) || name.includes(provider);
    });
  };

  const grouped = useMemo(() => {
    const groups = {};
    doctors.forEach((d) => {
      const key = d.specialty || "General Practice";
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [doctors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Specialist Clinics</h1>
          <p className="text-sm text-muted-foreground">Organized by clinic type with availability & quick messaging</p>
        </div>
      </div>

      {doctors.length === 0 ? (
        <Card className="p-12 text-center">
          <Stethoscope className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No specialists saved yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your doctors to the directory to see them organized by clinic type.</p>
          <Link to="/doctor-directory">
            <Button variant="outline" size="sm" className="mt-3">Go to Doctor Directory</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([specialty, docs]) => (
            <div key={specialty}>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`text-xs font-semibold border ${getSpecialtyColor(specialty)}`}>
                  {specialty}
                </Badge>
                <span className="text-xs text-muted-foreground">{docs.length} {docs.length === 1 ? "doctor" : "doctors"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {docs.map((doc, i) => {
                  const nextAppt = getNextAppointment(doc.doctor_name);
                  return (
                    <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                      <Card className="p-4 hover:shadow-md transition flex flex-col h-full">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                            <Stethoscope className="w-5 h-5 text-sky-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{doc.doctor_name}</p>
                            {doc.practice_name && <p className="text-xs text-muted-foreground truncate">{doc.practice_name}</p>}
                          </div>
                        </div>

                        <div className="space-y-1.5 mt-3 flex-1">
                          {doc.phone && (
                            <a href={`tel:${doc.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-sky-600">
                              <Phone className="w-3 h-3 shrink-0" />{doc.phone}
                            </a>
                          )}
                          {doc.email && (
                            <a href={`mailto:${doc.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-sky-600">
                              <Mail className="w-3 h-3 shrink-0" /><span className="truncate">{doc.email}</span>
                            </a>
                          )}
                          {doc.address && (
                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 mt-0.5 shrink-0" /><span className="line-clamp-2">{doc.address}</span>
                            </div>
                          )}
                          {doc.office_hours && (
                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mt-0.5 shrink-0" /><span>{doc.office_hours}</span>
                            </div>
                          )}
                        </div>

                        {/* Availability */}
                        {nextAppt && (
                          <div className="mt-3 p-2 bg-sky-50 rounded-lg border border-sky-100 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold text-sky-800">Next Appointment</p>
                              <p className="text-xs text-sky-700 truncate">
                                {moment(nextAppt.date).format("MMM D, YYYY [at] h:mm A")}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="mt-3 pt-3 border-t flex gap-2">
                          <Button
                            size="sm"
                            className="h-8 flex-1 bg-sky-600 hover:bg-sky-700"
                            onClick={() => setMessageDoctor(doc)}
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                            Message
                          </Button>
                          {doc.access_link && (
                            <a href={doc.access_link} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="h-8">
                                Records <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <SpecialistMessageDialog
        doctor={messageDoctor}
        open={!!messageDoctor}
        onOpenChange={(v) => { if (!v) setMessageDoctor(null); }}
      />
    </div>
  );
}