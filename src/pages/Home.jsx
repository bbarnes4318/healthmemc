import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Stethoscope, HeartPulse, Users, Pill, FileText, Sparkles,
  Calendar, Phone, TrendingUp, Clock, ChevronRight, Shield, Dumbbell, History, Home as HomeIcon, Scan, Info, Syringe, Activity as ActivityIcon, Ear, UserRound,
  Video, Globe, Smile, Eye, Baby, Bell, Watch
} from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import CheckInButton from "@/components/CheckInButton";
import WellnessStreakCards from "@/components/wellness/WellnessStreakCards";
import FamilyOverviewCard from "@/components/family/FamilyOverviewCard";
import FamilyHealthScoreCard from "@/components/family/FamilyHealthScoreCard";
import PricingPlans from "@/components/about/PricingPlans";
import InsuranceCoverageChart from "@/components/insurance/InsuranceCoverageChart";
import FAQSection from "@/components/home/FAQSection";
import BenefitsSection from "@/components/home/BenefitsSection";
import FitnessPainMedicationReportButton from "@/components/health/FitnessPainMedicationReportButton";
import ExercisePainTrendReport from "@/components/health/ExercisePainTrendReport";
import PharmacyInventoryTracker from "@/components/pharmacy/PharmacyInventoryTracker";
import NutritionProgressBars from "@/components/wellness/NutritionProgressBars";
import VoiceGreeting from "@/components/voice/VoiceGreeting";
import CriticalRecordsBanner from "@/components/records/CriticalRecordsBanner";
import QuickActionOverlay from "@/components/home/QuickActionOverlay";
import VirtualVisitSection from "@/components/home/VirtualVisitSection";
import HeroCommercial from "@/components/home/HeroCommercial";

const LOGO_URL = "https://media.base44.com/images/public/6a4dfc16013374d3269a9096/3f23b1c41_generated_image.png";

const quickActions = [
  { label: "Start AI Doctor Visit", icon: Stethoscope, path: "/ai-doctor", color: "from-sky-500 to-blue-600", desc: "Describe symptoms & get insights" },
  { label: "AI Personal Physician", icon: UserRound, path: "/personal-physician", color: "from-indigo-500 to-purple-600", desc: "Your personalized health companion" },
  { label: "Chat with AI Nurse", icon: HeartPulse, path: "/ai-nurse", color: "from-emerald-500 to-teal-600", desc: "Daily check-ins & wellness" },
  { label: "AI Dentist", icon: Smile, path: "/dental-care", color: "from-teal-500 to-emerald-600", desc: "Oral health & dental care" },
  { label: "AI Specialists", icon: Users, path: "/specialists", color: "from-violet-500 to-purple-600", desc: "Cardiology, neuro & more" },
  { label: "AI Pharmacy", icon: Pill, path: "/pharmacy", color: "from-amber-500 to-orange-600", desc: "Medications & interactions" },
  { label: "Medical Records", icon: FileText, path: "/records", color: "from-rose-500 to-pink-600", desc: "View & manage records" },
  { label: "Visit History", icon: History, path: "/appointment-history", color: "from-indigo-500 to-blue-600", desc: "Past consultations & reports" },
  { label: "Wellness Center", icon: Sparkles, path: "/wellness", color: "from-cyan-500 to-sky-600", desc: "Nutrition, exercise & more" },
  { label: "AI Pro Sports Medicine", icon: Dumbbell, path: "/sports-medicine", color: "from-orange-500 to-red-600", desc: "Injury, recovery & performance" },
  { label: "Home Doctor Visit", icon: HomeIcon, path: "/home-doctor-visit", color: "from-sky-600 to-blue-700", desc: "A physician comes to you" },
  { label: "Eye Care", icon: Eye, path: "/eye-doctor", color: "from-blue-500 to-cyan-600", desc: "Vision health & eye exams" },
  { label: "AI Dermatology", icon: Scan, path: "/dermatology", color: "from-teal-500 to-cyan-600", desc: "Track moles, rashes & skin changes" },
  { label: "Ear Care", icon: Ear, path: "/ear-care", color: "from-purple-500 to-fuchsia-600", desc: "Hearing tests & ear health" },
  { label: "Baby Medical Care", icon: Baby, path: "/newborn-care", color: "from-pink-500 to-rose-600", desc: "Newborn health, growth & milestones" },
  { label: "Vital Sign Alerts", icon: Bell, path: "/vital-thresholds", color: "from-rose-500 to-orange-600", desc: "Set thresholds & get notified" },
  { label: "Immunization History", icon: Syringe, path: "/immunization", color: "from-emerald-500 to-teal-600", desc: "Vaccines & booster reminders" },
  { label: "Surgical Recovery", icon: ActivityIcon, path: "/surgical-recovery", color: "from-rose-500 to-pink-600", desc: "Post-op healing & wound tracking" },
  { label: "Privacy Dashboard", icon: Shield, path: "/privacy-dashboard", color: "from-blue-500 to-indigo-600", desc: "Access logs & security status" },
  { label: "Insurance Tracker", icon: Shield, path: "/insurance-tracker", color: "from-indigo-500 to-blue-600", desc: "Policies, deductibles & claims" },
  { label: "Master Wellness", icon: TrendingUp, path: "/master-wellness", color: "from-violet-500 to-purple-600", desc: "All health trends in one place" },
  { label: "Virtual Consultations", icon: Video, path: "/virtual-consultations", color: "from-sky-500 to-indigo-600", desc: "Speak with AI health pros" },
  { label: "Language Directory", icon: Globe, path: "/language-directory", color: "from-emerald-500 to-teal-600", desc: "Medical phrases in 24+ languages" },
  { label: "Wearable Sync", icon: Watch, path: "/wearable-sync", color: "from-cyan-500 to-blue-600", desc: "Auto-sync fitness device data" },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentMemberId, currentMemberName } = useFamilyMember();

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const apptFilter = currentMemberId ? { family_member_id: currentMemberId, status: "scheduled" } : { status: "scheduled" };
        const medFilter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
        const [profiles, appts, meds, vitalData] = await Promise.all([
          base44.entities.HealthProfile.filter({ created_by_id: u.id }),
          base44.entities.Appointment.filter(apptFilter, "-date", 3),
          base44.entities.Medication.filter(medFilter),
          currentMemberId
            ? base44.entities.VitalRecord.filter({ family_member_id: currentMemberId }, "-recorded_at", 50)
            : base44.entities.VitalRecord.list("-recorded_at", 50),
        ]);
        if (profiles.length > 0) setProfile(profiles[0]);
        setAppointments(appts);
        setMedications(meds);
        setVitals(vitalData);
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
      <VoiceGreeting userName={user?.full_name} />
      <HeroCommercial />
      <CriticalRecordsBanner />
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
              <div className="flex items-center gap-2 mb-3">
                <img src={LOGO_URL} alt="Health Me Medical Center" className="w-24 h-24 rounded-lg object-cover ring-1 ring-white/30" />
                <span className="text-[10px] text-sky-100 font-semibold uppercase tracking-wide">Health Me Medical Center</span>
              </div>
              <p className="text-sky-100 text-sm font-medium">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},</p>
              <h1 className="text-2xl lg:text-3xl font-display font-bold mt-1">{firstName} 👋</h1>
              <p className="text-sky-100 text-sm mt-2">Smarter Healthcare. Anytime. Anywhere.</p>
              <div className="flex gap-3 mt-5 flex-wrap">
                <CheckInButton />
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
                <Link to="/about">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    <Info className="w-4 h-4 mr-2" />
                    About Us
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

      {/* Virtual Visits & Services */}
      <VirtualVisitSection />

      {/* Quick Log Actions */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-3">Quick Log</h2>
        <QuickActionOverlay />
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
            <Link to="/appointment-history" className="text-xs text-sky-600 hover:underline">View history</Link>
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

      {/* Pharmacy Inventory Tracker */}
      <PharmacyInventoryTracker />

      {/* Nutrition Goal Progress */}
      <NutritionProgressBars />

      {/* Family Health Score Comparison */}
      <FamilyHealthScoreCard />

      {/* Family Overview */}
      <FamilyOverviewCard />

      {/* Wellness Streak Cards */}
      <WellnessStreakCards />

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
          {(() => {
            const getLatest = (type) => {
              const record = vitals.find((v) => v.type === type);
              if (!record) return null;
              if (type === "blood_pressure" && record.secondary_value) return `${record.value}/${record.secondary_value}`;
              return record.value;
            };
            const getUnit = (type) => {
              const units = { heart_rate: "bpm", blood_pressure: "mmHg", sleep_hours: "hrs", activity_minutes: "min" };
              return units[type] || "";
            };
            const stats = [
              { label: "Heart Rate", value: getLatest("heart_rate"), unit: getUnit("heart_rate"), color: "text-rose-600", bg: "bg-rose-50" },
              { label: "Blood Pressure", value: getLatest("blood_pressure"), unit: getUnit("blood_pressure"), color: "text-sky-600", bg: "bg-sky-50" },
              { label: "Sleep", value: getLatest("sleep_hours"), unit: getUnit("sleep_hours"), color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Activity", value: getLatest("activity_minutes"), unit: getUnit("activity_minutes"), color: "text-emerald-600", bg: "bg-emerald-50" },
            ];
            return stats.map((stat) => (
              <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                <p className={`text-xl font-display font-bold ${stat.color} mt-1`}>{stat.value ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{stat.unit}</p>
              </div>
            ));
          })()}
        </div>
      </Card>

      {/* Exercise vs Pain Trend Report */}
      <ExercisePainTrendReport />

      {/* Physician Report Export */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-sm">Share Progress with Your Doctor</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Generate a single PDF with all your fitness activity, pain levels, and medication adherence.</p>
          </div>
          <FitnessPainMedicationReportButton className="bg-emerald-600 hover:bg-emerald-700 shrink-0" />
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          Health Me Medical Center provides health information and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.
        </p>
      </div>

      {/* Benefits Section */}
      <BenefitsSection />

      {/* Insurance Coverage Comparison */}
      <InsuranceCoverageChart />

      {/* Membership Plans */}
      <PricingPlans currentTier={profile?.membership_tier || "free"} />

      {/* FAQ */}
      <FAQSection />
    </div>
  );
}