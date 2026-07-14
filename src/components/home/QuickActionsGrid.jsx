import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Stethoscope, HeartPulse, Users, Pill, FileText, Sparkles,
  TrendingUp, Shield, Dumbbell, History, Home as HomeIcon, Scan,
  Syringe, Activity as ActivityIcon, Ear, UserRound,
  Video, Globe, Smile, Eye, Baby, Bell, Watch,
} from "lucide-react";

const actionGroups = [
  {
    title: "Start a Consultation",
    actions: [
      { label: "AI Doctor", icon: Stethoscope, path: "/ai-doctor", color: "from-sky-500 to-blue-600", desc: "Instant symptom analysis" },
      { label: "Personal Physician", icon: UserRound, path: "/personal-physician", color: "from-indigo-500 to-purple-600", desc: "Your ongoing care companion" },
      { label: "AI Nurse", icon: HeartPulse, path: "/ai-nurse", color: "from-emerald-500 to-teal-600", desc: "Daily check-ins & wellness" },
      { label: "AI Specialists", icon: Users, path: "/specialists", color: "from-violet-500 to-purple-600", desc: "Cardiology, neuro & more" },
      { label: "Virtual Visits", icon: Video, path: "/virtual-consultations", color: "from-sky-500 to-indigo-600", desc: "Speak with AI health pros" },
    ],
  },
  {
    title: "Vitals & Health Tracking",
    actions: [
      { label: "Vital Sign Alerts", icon: Bell, path: "/vital-thresholds", color: "from-rose-500 to-orange-600", desc: "Set thresholds & get notified" },
      { label: "Wearable Sync", icon: Watch, path: "/wearable-sync", color: "from-cyan-500 to-blue-600", desc: "Auto-sync fitness device data" },
      { label: "Master Wellness", icon: TrendingUp, path: "/master-wellness", color: "from-violet-500 to-purple-600", desc: "All health trends in one place" },
    ],
  },
  {
    title: "Specialty Care",
    actions: [
      { label: "AI Dentist", icon: Smile, path: "/dental-care", color: "from-teal-500 to-emerald-600", desc: "Oral health & dental care" },
      { label: "Eye Care", icon: Eye, path: "/eye-doctor", color: "from-blue-500 to-cyan-600", desc: "Vision health & eye exams" },
      { label: "AI Dermatology", icon: Scan, path: "/dermatology", color: "from-teal-500 to-cyan-600", desc: "Track moles & skin changes" },
      { label: "Ear Care", icon: Ear, path: "/ear-care", color: "from-purple-500 to-fuchsia-600", desc: "Hearing tests & ear health" },
      { label: "Sports Medicine", icon: Dumbbell, path: "/sports-medicine", color: "from-orange-500 to-red-600", desc: "Injury & performance" },
      { label: "Home Doctor Visit", icon: HomeIcon, path: "/home-doctor-visit", color: "from-sky-600 to-blue-700", desc: "A physician comes to you" },
    ],
  },
  {
    title: "Records & Pharmacy",
    actions: [
      { label: "AI Pharmacy", icon: Pill, path: "/pharmacy", color: "from-amber-500 to-orange-600", desc: "Medications & interactions" },
      { label: "Medical Records", icon: FileText, path: "/records", color: "from-rose-500 to-pink-600", desc: "View & manage records" },
      { label: "Visit History", icon: History, path: "/appointment-history", color: "from-indigo-500 to-blue-600", desc: "Past consultations" },
      { label: "Immunization", icon: Syringe, path: "/immunization", color: "from-emerald-500 to-teal-600", desc: "Vaccines & boosters" },
      { label: "Surgical Recovery", icon: ActivityIcon, path: "/surgical-recovery", color: "from-rose-500 to-pink-600", desc: "Post-op healing tracker" },
    ],
  },
  {
    title: "Family & Wellness",
    actions: [
      { label: "Baby Medical Care", icon: Baby, path: "/newborn-care", color: "from-pink-500 to-rose-600", desc: "Newborn growth & milestones" },
      { label: "Wellness Center", icon: Sparkles, path: "/wellness", color: "from-cyan-500 to-sky-600", desc: "Nutrition & exercise" },
      { label: "Language Directory", icon: Globe, path: "/language-directory", color: "from-emerald-500 to-teal-600", desc: "Medical phrases in 24+ languages" },
    ],
  },
  {
    title: "Insurance & Privacy",
    actions: [
      { label: "Insurance Tracker", icon: Shield, path: "/insurance-tracker", color: "from-indigo-500 to-blue-600", desc: "Policies, deductibles & claims" },
      { label: "Privacy Dashboard", icon: Shield, path: "/privacy-dashboard", color: "from-blue-500 to-indigo-600", desc: "Access logs & security" },
    ],
  },
];

export default function QuickActionsGrid() {
  let globalIndex = 0;
  return (
    <div className="space-y-6">
      {actionGroups.map((group) => (
        <div key={group.title}>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-display font-semibold">{group.title}</h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {group.actions.map((action) => {
              const i = globalIndex++;
              return (
                <motion.div
                  key={action.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link to={action.path}>
                    <Card className="p-4 sm:p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group h-full">
                      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                        <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm">{action.label}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}