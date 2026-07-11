import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  HeartPulse, Brain, Shield, Stethoscope, Activity,
  Users, Pill, FileText, Bell, Sparkles, Lock, Clock
} from "lucide-react";
import PricingPlans from "@/components/about/PricingPlans";

const VALUES = [
  { icon: HeartPulse, title: "Patient-First Care", desc: "Every feature is designed around real patient needs — not just technology for its own sake." },
  { icon: Shield, title: "Privacy & Security", desc: "Your health data is encrypted, access-controlled, and never shared without your explicit consent." },
  { icon: Brain, title: "AI-Driven Intelligence", desc: "Evidence-based AI consultations and insights that complement — never replace — your care team." },
  { icon: Activity, title: "Proactive Wellness", desc: "We help you stay ahead of health issues with continuous monitoring and personalized guidance." },
];

const MODULES = [
  { icon: Stethoscope, title: "AI Doctor & Nurse", desc: "24/7 AI-powered consultations with structured diagnostic reports and follow-up plans." },
  { icon: Users, title: "Family & Caregiver", desc: "Manage health for your whole family with caregiver dashboards, visit logs, and shared activity feeds." },
  { icon: Pill, title: "Pharmacy & Medications", desc: "Track medications, get interaction warnings, adherence analytics, and refill alerts." },
  { icon: FileText, title: "Medical Records", desc: "Securely store, organize, and share medical records, lab results, and clinical summaries." },
  { icon: Bell, title: "Smart Reminders", desc: "Automated medication, appointment, and screening reminders with caregiver notification workflows." },
  { icon: Lock, title: "Clinician Access Portal", desc: "Grant time-limited, granular record access to doctors and specialists with audit tracking." },
];

export default function AboutUs() {
  const [currentTier, setCurrentTier] = useState("free");

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        const profiles = await base44.entities.HealthProfile.filter({ created_by_id: u.id });
        if (profiles.length > 0 && profiles[0].membership_tier) {
          setCurrentTier(profiles[0].membership_tier);
        }
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-blue-600 to-violet-700 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-16 lg:py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative mx-auto mb-5">
              <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl" />
              <img
                src="https://media.base44.com/images/public/6a4dfc16013374d3269a9096/3f23b1c41_generated_image.png"
                alt="Health Me Medical Center logo"
                className="relative w-20 h-20 rounded-2xl object-cover shadow-2xl shadow-sky-900/30 ring-1 ring-white/30"
              />
            </div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold mb-3">Health Me Medical Center</h1>
            <p className="text-lg text-sky-100 max-w-2xl mx-auto">
              Your comprehensive health intelligence companion — combining AI-powered consultations,
              personalized wellness coaching, pharmacy insights, and secure medical record management
              in one unified platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 py-12 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-semibold text-sky-600 uppercase tracking-wide">Our Mission</span>
          </div>
          <h2 className="text-2xl font-display font-bold mb-4">Empowering everyone to take control of their health</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            We believe healthcare should be accessible, intelligent, and personal. Health Me Medical Center
            bridges the gap between everyday wellness and clinical-grade care by putting powerful AI tools,
            comprehensive records management, and proactive monitoring directly in your hands — while keeping
            your care team informed and connected.
          </p>
        </motion.div>
      </section>

      {/* Values */}
      <section className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VALUES.map((val, i) => (
            <motion.div
              key={val.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-3">
                <val.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{val.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{val.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What We Offer */}
      <section className="bg-muted/40 py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-display font-bold">What We Offer</h2>
            <p className="text-sm text-muted-foreground mt-1">A complete ecosystem for your health journey</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((mod, i) => (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i }}
                className="bg-card rounded-xl border p-5 shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center mb-3">
                  <mod.icon className="w-5 h-5 text-sky-600" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{mod.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{mod.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          {[
            { icon: Clock, value: "24/7", label: "AI Availability" },
            { icon: Brain, value: "9+", label: "AI Specialties" },
            { icon: Users, value: "5", label: "Family Members" },
            { icon: Shield, value: "100%", label: "Data Encrypted" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
            >
              <stat.icon className="w-6 h-6 text-sky-600 mx-auto mb-2" />
              <div className="text-2xl font-display font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="bg-muted/40 py-4">
        <PricingPlans currentTier={currentTier} />
      </section>
    </div>
  );
}