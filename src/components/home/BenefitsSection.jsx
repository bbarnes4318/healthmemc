import React from "react";
import { Card } from "@/components/ui/card";
import {
  Stethoscope,
  Pill,
  FileText,
  HeartPulse,
  Users,
  Shield,
  Activity,
  Microscope,
  Watch,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const patientBenefits = [
  {
    icon: Stethoscope,
    eyebrow: "AI-GUIDED CARE",
    title: "Start with what you are feeling",
    desc: "Describe a symptom, concern, or health question and start an AI-guided visit without searching through disconnected tools. Health Me keeps the conversation connected to the health information you choose to track.",
  },
  {
    icon: Microscope,
    eyebrow: "RECORDS & LABS",
    title: "Turn scattered health information into a clearer picture",
    desc: "Keep medical records in one place, upload lab reports, extract supported lab values, and follow results over time instead of rebuilding your history from memory at every visit.",
  },
  {
    icon: Pill,
    eyebrow: "MEDICATIONS",
    title: "Know what you take, when you take it, and what needs attention",
    desc: "Track active medications, dosage schedules, adherence, refill needs, and supported interaction information from a centralized pharmacy workspace.",
  },
  {
    icon: HeartPulse,
    eyebrow: "VITALS & TRENDS",
    title: "See changes, not just isolated numbers",
    desc: "Follow vitals and health trends over time, set threshold alerts, and bring supported wearable data into the same health view so patterns are easier to recognize.",
  },
  {
    icon: Users,
    eyebrow: "FAMILY & CAREGIVING",
    title: "Coordinate care for the people who depend on you",
    desc: "Switch between family profiles, manage medications and appointments, review shared activity, and use caregiver tools for children, parents, dependents, and other supported household profiles.",
  },
  {
    icon: Activity,
    eyebrow: "RECOVERY",
    title: "Keep the care plan moving after the visit",
    desc: "Use physical-therapy and surgical-recovery workflows to track exercises, pain, mobility, milestones, check-ins, and recovery progress between appointments.",
  },
  {
    icon: Shield,
    eyebrow: "EMERGENCY READINESS",
    title: "Keep critical information easier to reach",
    desc: "Maintain emergency profile information, medical ID tools, vital information, preparedness checklists, and AI-assisted triage guidance for moments when you need clarity quickly.",
  },
  {
    icon: FileText,
    eyebrow: "SHARING & CONTINUITY",
    title: "Bring better context into the next conversation",
    desc: "Organize consultation history, records, medications, vitals, and supported reports so you can review or share relevant information with clinicians and trusted caregivers when needed.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Tell Health Me what is going on",
    desc: "Start an AI-guided visit, choose a specialty, or log the health information that matters right now.",
  },
  {
    step: "02",
    title: "Build your connected health picture",
    desc: "Add medications, records, labs, vitals, appointments, family profiles, and supported wearable data over time.",
  },
  {
    step: "03",
    title: "Know what to do next",
    desc: "Use reminders, trends, care tools, recovery tracking, specialist workflows, and shareable records to stay organized between visits.",
  },
];

const platformCallouts = [
  { value: "24/7", label: "AI-guided health access" },
  { value: "One place", label: "Care, records, meds & trends" },
  { value: "Family-ready", label: "Multi-profile health management" },
  { value: "Connected", label: "From question to follow-through" },
];

export default function BenefitsSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-14 sm:py-16">
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          One connected health workspace
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
          Your health is connected. Your tools should be too.
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto mt-3 leading-relaxed">
          Health Me brings AI-guided care, medications, medical records, labs, vitals, family health, recovery, and emergency tools into one place—so you can spend less time piecing information together and more time understanding what comes next.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
        {patientBenefits.map((benefit, i) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ delay: 0.03 * i }}
          >
            <Card className="p-5 sm:p-6 h-full border-border/70">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                  <benefit.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-sky-600 mb-1.5">{benefit.eyebrow}</p>
                  <h3 className="font-display font-semibold text-base sm:text-lg leading-snug">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2">{benefit.desc}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border bg-muted/25 p-5 sm:p-8 mb-10">
        <div className="max-w-2xl mb-7">
          <p className="text-xs font-bold tracking-[0.16em] text-sky-600 mb-2">HOW HEALTH ME FITS INTO YOUR DAY</p>
          <h2 className="text-xl sm:text-2xl font-display font-bold">From “What is going on?” to “Here is what I do next.”</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Health Me is designed as a continuous workflow—not a one-off chatbot. Start with a question, build context, and keep the next step connected to the information already in your health workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workflow.map((item, index) => (
            <div key={item.step} className="relative rounded-xl bg-background border p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-sky-600">STEP {item.step}</span>
                {index < workflow.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground hidden md:block" />}
              </div>
              <h3 className="font-semibold text-sm sm:text-base">{item.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <Card className="p-6 sm:p-8 bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-0 overflow-hidden">
        <div className="text-center mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-100">Built around the full health journey</p>
          <h2 className="text-xl sm:text-2xl font-display font-bold mt-1">More than an AI visit. A place to keep care moving.</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 text-center">
          {platformCallouts.map((item) => (
            <div key={item.value}>
              <p className="text-xl sm:text-2xl font-display font-bold">{item.value}</p>
              <p className="text-xs text-sky-100 mt-1 leading-snug">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-5 border-t border-white/20 flex items-center justify-center gap-2 text-xs text-sky-100 text-center">
          <Watch className="w-4 h-4 shrink-0" />
          Supported health and wearable data can become part of the same longitudinal view.
        </div>
      </Card>
    </section>
  );
}
