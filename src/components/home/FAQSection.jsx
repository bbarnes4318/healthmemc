import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "What can I use Health Me for?",
    a: "Health Me combines AI-guided health visits with tools for medications, medical records, lab trends, vitals, appointments, family health, caregiver coordination, recovery tracking, wellness, and emergency preparedness. The goal is to keep the information and follow-through around your health in one connected workspace.",
  },
  {
    q: "Does Health Me replace my doctor?",
    a: "No. Health Me provides AI-assisted health guidance, organization, tracking, and triage support. It is not a substitute for hands-on examination, emergency services, or care from a qualified healthcare professional when those are needed.",
  },
  {
    q: "What happens during an AI-guided visit?",
    a: "You can describe what is happening, provide relevant health context, and use the appropriate AI care workflow for your concern. Health Me includes general AI doctor and nurse experiences as well as specialty-focused channels. Consultation information can remain connected to the rest of your health workspace for future reference.",
  },
  {
    q: "Can Health Me organize my medical records and lab results?",
    a: "Yes. The application includes medical-record storage, OCR-assisted document workflows, supported lab-value extraction, and trend views. That means you can keep source records together while also following supported values over time instead of treating every report as an isolated document.",
  },
  {
    q: "Can I manage medications in Health Me?",
    a: "Yes. Health Me includes a pharmacy and medication workspace for active medications, dosage schedules, reminders, adherence logs, refill tracking, inventory, and supported medication-safety information such as interaction checks.",
  },
  {
    q: "Can I manage health information for my family?",
    a: "Yes. Health Me supports family profiles and caregiver workflows so household members can have their own health information, medications, vitals, appointments, and activity. The application also includes caregiver tools such as shared activity, alerts, visit logs, and care coordination features.",
  },
  {
    q: "Does Health Me track vitals and health trends?",
    a: "Yes. You can record supported vitals, view trends over time, configure threshold-based alerts, and use supported wearable connections to bring additional health data into your longitudinal view.",
  },
  {
    q: "What recovery tools are included?",
    a: "Health Me includes physical-therapy and surgical-recovery workflows with tools for exercises, pain and mobility tracking, milestones, check-ins, and progress monitoring. These features are designed to help you stay organized between clinical visits.",
  },
  {
    q: "What should I do in a medical emergency?",
    a: "If you believe you are experiencing a medical emergency, call 911 or your local emergency number immediately. Health Me includes emergency profile, medical ID, preparedness, vitals, and AI-assisted triage tools, but those tools do not replace emergency medical services.",
  },
  {
    q: "Can I share information with a clinician or caregiver?",
    a: "Health Me includes record-sharing and clinician-access workflows along with consultation history and health reports. You can use those tools to bring relevant records, medications, vitals, and tracked health context into conversations with the people involved in your care.",
  },
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <HelpCircle className="w-6 h-6 text-sky-600" />
          <h2 className="text-2xl font-display font-bold">Questions, answered clearly</h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          What Health Me does, how it fits alongside professional care, and how your health information stays connected across the platform.
        </p>
      </div>

      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <Card key={i} className="overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition"
            >
              <span className="font-medium text-sm pr-3">{faq.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${openIdx === i ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {openIdx === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </section>
  );
}
