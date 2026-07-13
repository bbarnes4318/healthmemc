import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "Is Health Me Medical Center a replacement for my regular doctor?",
    a: "No — Health Me Medical Center is a complementary health intelligence platform. Our AI professionals provide 24/7 guidance, symptom triage, wellness coaching, and health monitoring. For diagnoses, prescriptions, and procedures, we bridge you to licensed physical providers in our specialist directory. Many users use AI for 80%+ of their day-to-day health questions and see their doctor for hands-on care.",
  },
  {
    q: "How accurate are the AI consultations?",
    a: "Our AI medical professionals are trained on clinical guidelines, peer-reviewed research, and real-world case data. They provide evidence-based guidance and triage recommendations. However, AI consultations are informational — not a definitive diagnosis. Every consultation includes a 'Get a 2nd Opinion' button and recommendations to confirm with a licensed provider when needed. All AI consultations are saved and can be shared with your doctor via the Doctor Records Portal.",
  },
  {
    q: "Can I share my AI consultation reports with my real doctor?",
    a: "Absolutely. Every AI consultation generates a structured clinical summary (diagnoses considered, recommended tests, treatments, and follow-up plans) that can be exported as a professional PDF. You can also grant your doctor secure access to your health dashboard through the Clinician Access feature, so they see your vitals, medications, lab trends, and AI consultation history in real time.",
  },
  {
    q: "How does the lab results parser work?",
    a: "Upload any lab report PDF or image to Medical Records. Our OCR-powered parser automatically extracts key health markers (glucose, cholesterol, A1c, thyroid, vitamins, and 20+ more) and plots them on an interactive trend chart. You can see at a glance whether your numbers are improving over time, with reference ranges shown so you know what's normal. The more lab reports you upload, the richer your trend data becomes.",
  },
  {
    q: "Is my health data secure and private?",
    a: "Yes. Health Me Medical Center uses bank-grade encryption for all data at rest and in transit. You control who sees your records through the Privacy Dashboard — grant and revoke clinician access at any time, view a full access log of who viewed your data and when, and share specific records with trusted contacts via time-limited secure links. We never sell your data to third parties.",
  },
  {
    q: "Can I manage my whole family's health on one account?",
    a: "Yes. The Family plan supports up to 5 family member profiles, each with its own health profile, medications, vitals, appointments, and AI consultations. A built-in profile switcher lets you move between members instantly. The Caregiver Dashboard provides alerts, shared activity feeds, and visit logs for those caring for elderly parents, children, or dependents.",
  },
  {
    q: "What happens in a medical emergency?",
    a: "The Emergency page provides one-tap access to your emergency medical ID (allergies, medications, blood type, conditions), an emergency preparedness checklist, and a printable vitals card for first responders. The AI ER module helps you triage symptoms to determine if you need to call 911, visit urgent care, or monitor at home — guiding you to the right level of care.",
  },
  {
    q: "Does my insurance cover the cost of the platform?",
    a: "Health Me Medical Center is a subscription service, not billed through insurance. However, many users find that using the AI platform reduces their overall healthcare spending by 90%+ (fewer unnecessary doctor visits, earlier intervention, better medication management). Some employers and HSA/FSA programs may reimburse wellness platform subscriptions — check with your benefits administrator.",
  },
  {
    q: "Can I get prescriptions through the platform?",
    a: "The AI Pharmacy module provides medication information, interaction checking, dosage calculators, and refill tracking. AI consultations can recommend medications, but actual prescriptions must be issued by a licensed provider. Our platform connects you to in-network providers who can issue prescriptions when clinically appropriate, and tracks all your medications in one place.",
  },
  {
    q: "What devices and platforms are supported?",
    a: "Health Me Medical Center works on any web browser (desktop, tablet, mobile) and publishes as a native app for iOS and Android from the same codebase. Voice input and text-to-speech are built in for accessibility. The platform integrates with browser-based biometric authentication on supported devices.",
  },
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <HelpCircle className="w-6 h-6 text-sky-600" />
          <h2 className="text-2xl font-display font-bold">Frequently Asked Questions</h2>
        </div>
        <p className="text-sm text-muted-foreground">Everything you need to know about Health Me Medical Center</p>
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