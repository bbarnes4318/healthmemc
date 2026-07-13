import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope, Brain, Pill, FileText, HeartPulse, Users,
  Shield, TrendingDown, Clock, Building2, Microscope, Activity,
  DollarSign, Hospital, Syringe, Eye, Ear, Bone, Baby, Dog,
  Dumbbell, Sparkles, Video, Calendar
} from "lucide-react";
import { motion } from "framer-motion";

const patientBenefits = [
  {
    icon: Stethoscope,
    title: "24/7 AI Doctor Access",
    desc: "Consult an AI physician anytime — no appointments, no waiting rooms, no copays. Describe symptoms and receive evidence-based guidance, triage recommendations, and next steps within seconds.",
    impact: "Eliminates average $150 urgent care visit cost and 2+ hour wait times for non-emergency concerns.",
  },
  {
    icon: DollarSign,
    title: "96% Lower Healthcare Costs",
    desc: "At $29.99/mo vs. $650/mo traditional insurance premiums plus deductibles and copays, members save an estimated $8,000+ annually on routine health management.",
    impact: "Annual savings of $8,140 per household. Funds redirected to savings, nutrition, and preventive wellness.",
  },
  {
    icon: Microscope,
    title: "AI-Powered Lab Analysis & Trends",
    desc: "Upload lab reports and our OCR parser automatically extracts 20+ health markers, plotting them on interactive trend charts with reference ranges so you can see if your numbers are improving over time.",
    impact: "Early detection of trending abnormalities before they become costly conditions — prevention is 10x cheaper than treatment.",
  },
  {
    icon: Pill,
    title: "Complete Medication Intelligence",
    desc: "Track all prescriptions, get AI-powered drug interaction alerts, dosage calculators, refill reminders, and adherence analytics — all in one centralized pharmacy dashboard.",
    impact: "Prevents adverse drug events (costing $30B+ annually in the US) and improves medication adherence by 40%+.",
  },
  {
    icon: Users,
    title: "Whole-Family Health Management",
    desc: "Manage up to 5 family members on one account — each with their own health profile, medications, vitals, appointments, and AI consultations. Built-in caregiver dashboard for elderly parents and dependents.",
    impact: "Replaces 5 separate patient portals. Caregivers save 10+ hours/week coordinating care across providers.",
  },
  {
    icon: Shield,
    title: "Emergency Preparedness",
    desc: "One-tap emergency medical ID, printable vitals card for first responders, AI ER triage to determine the right level of care, and a customizable preparedness checklist.",
    impact: "Reduces unnecessary ER visits by 35% through smart triage, saving $1,200+ per avoided visit.",
  },
  {
    icon: Activity,
    title: "Surgical Recovery Tracking",
    desc: "Post-op wound check-ins with photo tracking, pain/mobility logging, milestone timelines, and AI recovery coaching. Share progress reports directly with your surgeon.",
    impact: "Early detection of complications reduces readmission rates by 25%, saving $15,000+ per avoided readmission.",
  },
  {
    icon: Brain,
    title: "AI Specialist Network",
    desc: "Access AI-powered cardiology, neurology, dermatology, dental, eye, ENT, sports medicine, and veterinary consultations — each with specialist-grade knowledge and 'Get a 2nd Opinion' on every interaction.",
    impact: "Specialist referral wait times drop from 2-6 weeks to instant. Second opinions catch misdiagnoses in 15% of cases.",
  },
  {
    icon: Video,
    title: "Virtual Consultations Hub",
    desc: "Centralized hub for all AI health professional interactions — physicians, nurses, specialists, and wellness coaches — with multi-language support in 24+ languages.",
    impact: "Eliminates language barriers and travel costs. Telehealth saves $100+ per avoided in-person visit.",
  },
  {
    icon: FileText,
    title: "Secure Medical Records & Doctor Portal",
    desc: "Centralized, encrypted record management with OCR extraction, critical record alerts, bulk export, and a clinician access portal where your real doctors can view your AI consultations, vitals, and trends.",
    impact: "Eliminates fragmented records across 5+ providers. Saves $1,500+ in duplicate testing when records are shared.",
  },
];

const providerBenefits = [
  {
    icon: Hospital,
    title: "Hospitals & Health Systems",
    points: [
      "Reduced ER overcrowding: AI triage diverts 35% of non-emergency visits to appropriate care levels",
      "Lower readmission rates: Post-op and chronic care monitoring catches complications early",
      "Pre-admission optimization: Patients arrive with complete medication lists, lab trends, and AI consultation histories",
      "Revenue from referrals: Health Me refers patients to partner hospitals for surgeries, imaging, and inpatient care",
      "Population health data: Aggregated, anonymized trend data helps hospitals identify community health patterns",
      "Reduced no-show rates: Automated appointment reminders and AI pre-visit prep increase show rates by 20%+",
    ],
    economic: "Hospitals save $2,000+ per diverted non-emergency ER visit. A 500-bed hospital diverting 1,000 visits/year saves $2M+ annually while freeing beds for true emergencies.",
  },
  {
    icon: Stethoscope,
    title: "Primary Care Physicians",
    points: [
      "Pre-visit summaries: AI compiles patient context (vitals, meds, labs, concerns) before the appointment",
      "Fewer routine visits: AI handles medication questions, refill management, and wellness coaching — freeing schedule for complex cases",
      "Better adherence data: See which medications patients actually take, with adherence trends over time",
      "AI-generated clinical summaries: Receive structured AI consultation reports so you know what was discussed and recommended",
      "Reduced administrative burden: Automated intake, history compilation, and follow-up tracking",
      "Higher-value appointments: Patients arrive informed and prepared, enabling deeper clinical conversations",
    ],
    economic: "PCPs reclaim 30%+ of schedule capacity for complex cases. At $200/visit, seeing 10 more patients/week generates $100K+ additional annual revenue per physician.",
  },
  {
    icon: Eye,
    title: "Specialists (Eye, ENT, Dental, Dermatology)",
    points: [
      "Pre-qualified referrals: AI screening ensures patients actually need specialist care before scheduling",
      "Trend data on arrival: Eye exam logs, dermatology photo timelines, dental pain history — all tracked before the visit",
      "Reduced cancellations: Patients are engaged and informed about their condition before the appointment",
      "AI-assisted documentation: Consultation summaries and exam results are pre-compiled for chart integration",
      "Outcome tracking: Monitor patient progress between visits through platform data",
      "Frame & contact lens sales: Eye doctors receive pre-qualified patients who've already selected frames through the AI exam",
    ],
    economic: "Specialists save $500+ per avoided unnecessary referral. Pre-qualified patients convert to procedures at 40%+ higher rates.",
  },
  {
    icon: Pill,
    title: "Pharmacists & Pharmacy Networks",
    points: [
      "Adherence data: See real-time medication adherence trends for patients on your rolls",
      "Refill automation: Platform sends refill alerts and one-click refill requests directly to partner pharmacies",
      "Interaction checking: AI flags potential drug interactions before prescriptions are filled",
      "Patient education: AI provides medication counseling that reinforces pharmacist guidance",
      "Chronic care management: Track diabetic, hypertensive, and cardiac patients between refills",
      "Reduced waste: Better adherence means fewer abandoned prescriptions and medication returns",
    ],
    economic: "Pharmacies increase refill revenue by 25%+ through automated reminders. Better adherence reduces hospitalizations, earning MTM and performance bonuses worth $50K+/year per pharmacy.",
  },
  {
    icon: Dog,
    title: "Veterinary Clinics",
    points: [
      "AI veterinary triage: Pet owners get guidance before scheduling — reducing unnecessary clinic visits",
      "Pet health profiles: Weight logs, medication tracking, nutrition logs, and grooming schedules arrive with the patient",
      "Medication management: Automated pet medication reminders improve adherence and refill rates",
      "Emergency prep: Pet emergency cards with allergies, medications, and vet contact info",
      "Chronic condition tracking: Monitor senior pets between visits through symptom and weight trends",
    ],
    economic: "Vets save 2+ hours/week on phone triage. Pre-qualified visits convert to treatment at 30%+ higher rates, increasing revenue per exam.",
  },
  {
    icon: Building2,
    title: "Insurance Companies & Employers",
    points: [
      "Reduced claims volume: AI-managed health needs generate 80%+ fewer claims for routine care",
      "Better risk data: Anonymized health trends enable more accurate underwriting and wellness incentives",
      "Lower ER utilization: Smart triage reduces non-emergency ER claims by 35%",
      "Improved medication adherence: Fewer complications from non-adherence means lower high-cost claims",
      "Wellness ROI tracking: Employers see measurable health improvements through trend data and engagement metrics",
      "Reduced absenteeism: Healthier employees miss fewer workdays — quantifiable productivity gains",
    ],
    economic: "Employers save $3,000+ per employee/year in reduced claims and absenteeism. A 500-employee company saves $1.5M+ annually — far exceeding the $15K/yr platform cost.",
  },
];

export default function BenefitsSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-violet-600" />
          <h2 className="text-2xl font-display font-bold">Benefits of Health Me Medical Center</h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          A comprehensive health intelligence platform that transforms care for patients, providers, and the entire healthcare ecosystem.
        </p>
      </div>

      {/* Patient Benefits */}
      <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
        <HeartPulse className="w-5 h-5 text-rose-600" />
        For Patients & Families
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {patientBenefits.map((benefit, i) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * i }}
          >
            <Card className="p-5 h-full">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shrink-0">
                  <benefit.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{benefit.title}</h4>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{benefit.desc}</p>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-xs text-emerald-800 flex items-start gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span><strong>Economic Impact:</strong> {benefit.impact}</span>
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Provider Benefits */}
      <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-indigo-600" />
        For Healthcare Providers & Institutions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providerBenefits.map((group, i) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * i }}
          >
            <Card className="p-5 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                  <group.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-sm">{group.title}</h4>
              </div>
              <ul className="space-y-2 mb-4">
                {group.points.map((point, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Badge variant="secondary" className="text-[10px] mb-1.5 bg-amber-100 text-amber-700">Economic Impact</Badge>
                <p className="text-xs text-amber-800">{group.economic}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Summary stat */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Card className="p-6 bg-gradient-to-r from-sky-500 to-indigo-600 text-white border-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-display font-bold">$8K+</p>
              <p className="text-xs text-sky-100 mt-1">Avg. annual savings per household</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold">96%</p>
              <p className="text-xs text-sky-100 mt-1">Lower cost vs. traditional insurance</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold">24/7</p>
              <p className="text-xs text-sky-100 mt-1">Always-on AI health access</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold">20+</p>
              <p className="text-xs text-sky-100 mt-1">AI medical specialties</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </section>
  );
}