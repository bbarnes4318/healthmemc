import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Stethoscope, HeartPulse, Users, Pill, FileText, Sparkles,
  Activity, Calendar, Bell, Phone, TrendingUp, Clock, ChevronRight, Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const quickActions = [
  { label: "Start AI Doctor Visit", icon: Stethoscope, path: "/ai-doctor", color: "from-sky-500 to-blue-600", desc: "Describe symptoms & get insights" },
  { label: "Chat with AI Nurse", icon: HeartPulse, path: "/ai-nurse", color: "from-emerald-500 to-teal-600", desc: "Daily check-ins & wellness" },
  { label: "AI Specialists", icon: Users, path: "/specialists", color: "from-violet-500 to-purple-600", desc: "Cardiology, neuro & more" },
  { label: "AI Pharmacy", icon: Pill, path: "/pharmacy", color: "from-amber-500 to-orange-600", desc: "Medications & interactions" },
  { label: "Medical Records", icon: FileText, path: "/records", color: "from-rose-500 to-pink-600", desc: "View & manage records" },
  { label: "Wellness Center", icon: Sparkles, path: "/wellness", color: "from-cyan-500 to-sky-600", desc: "Nutrition, exercise & more" },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentMemberId, currentMemberName } = useFamilyMember();

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const apptFilter = currentMemberId ? { family_member_id: currentMemberId, status: "scheduled" } : { status: "scheduled" };
        const medFilter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
        const [profiles, appts, meds] = await Promise.all([
          base44.entities.HealthProfile.filter({ created_by_id: u.id }),
          base44.entities.Appointment.filter(apptFilter, "-date", 3),
          base44.entities.Medication.filter(medFilter),
        ]);
        if (profiles.length > 0) setProfile(profiles[0]);
        setAppointments(appts);
        setMedications(meds);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
      </div>
    );
  }

  const healthScore = profile?.health_score || 78;
  const firstName = currentMemberName !== "You" ? currentMemberName : (user?.full_name?.split(" ")[0] || "there");

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Welcome & Health Score */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1"
        >
          <Card className="p-6 bg-gradient-to-br from-sky-500 to-blue-600 text-white border-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <p className="text-sky-100 text-sm font-medium">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},</p>
              <h1 className="text-2xl lg:text-3xl font-display font-bold mt-1">{firstName} 👋</h1>
              <p className="text-sky-100 text-sm mt-2">Smarter Healthcare. Anytime. Anywhere.</p>
              <div className="flex gap-3 mt-5">
                <Link to="/ai-doctor">
                  <Button className="bg-white text-sky-700 hover:bg-sky-50 font-semibold shadow-lg shadow-sky-700/20">
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Start Visit
                  </Button>
                </Link>
                <Link to="/emergency">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    <Phone className="w-4 h-4 mr-2" />
                    Emergency
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:w-56"
        >
          <Card className="p-6 h-full flex flex-col items-center justify-center text-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={healthScore >= 70 ? "#22c55e" : healthScore >= 50 ? "#eab308" : "#ef4444"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(healthScore / 100) * 264} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-display font-bold">{healthScore}</span>
              </div>
            </div>
            <p className="text-sm font-semibold mt-2">Health Score</p>
            <p className="text-xs text-muted-foreground">
              {healthScore >= 70 ? "Looking great!" : "Room to improve"}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Link to={action.path}>
                <Card className="p-4 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group h-full">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm">{action.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Today's Info Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Appointments */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              Upcoming Appointments
            </h3>
            <Link to="/profile" className="text-xs text-sky-600 hover:underline">View all</Link>
          </div>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming appointments</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => (
                <div key={appt.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{appt.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(appt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Medication Reminders */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              Active Medications
            </h3>
            <Link to="/pharmacy" className="text-xs text-sky-600 hover:underline">View all</Link>
          </div>
          {medications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No active medications</p>
          ) : (
            <div className="space-y-3">
              {medications.map((med) => (
                <div key={med.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Pill className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Health Trends */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            Health Trends
          </h3>
          <Link to="/dashboard" className="text-xs text-sky-600 hover:underline flex items-center gap-1">
            View Dashboard <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Heart Rate", value: "72", unit: "bpm", color: "text-rose-600", bg: "bg-rose-50" },
            { label: "Blood Pressure", value: "120/80", unit: "mmHg", color: "text-sky-600", bg: "bg-sky-50" },
            { label: "Sleep", value: "7.5", unit: "hrs", color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Activity", value: "8,200", unit: "steps", color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className={`text-xl font-display font-bold ${stat.color} mt-1`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.unit}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          Health Me Medical Center provides health information and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.
        </p>
      </div>
    </div>
  );
}