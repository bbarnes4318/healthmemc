import React from "react";
import AIServicePage from "@/components/services/AIServicePage";
import { LifeBuoy, Home, ClipboardList, Heart, Shield, Pill, MessageCircle } from "lucide-react";

const config = {
  title: "AI Assisted Living",
  subtitle: "Support for daily living, care planning, caregiver resources, and home safety",
  icon: LifeBuoy,
  color: "from-emerald-500 to-green-600",
  btnClass: "bg-emerald-600 hover:bg-emerald-700",
  textColor: "text-emerald-600",
  systemPrompt: "You are an AI Assisted Living advisor. You provide guidance on daily living support, care planning, caregiver support, home safety modifications, medication management, and social engagement for individuals needing assisted living support. Be compassionate and practical. Recommend consulting healthcare professionals and care coordinators for personalized care plans.",
  disclaimer: "This AI assisted living guidance is for informational purposes only. Always consult healthcare professionals and care coordinators for personalized care plans.",
  topics: [
    { label: "Daily Living Support", desc: "Activities of daily living", icon: Home, prompt: "I need support with daily living activities." },
    { label: "Care Planning", desc: "Personalized care plans", icon: ClipboardList, prompt: "I'd like help creating a care plan for myself or a loved one." },
    { label: "Caregiver Support", desc: "Resources and respite", icon: Heart, prompt: "I'm a caregiver and need support and resources." },
    { label: "Home Safety", desc: "Modifications and fall prevention", icon: Shield, prompt: "I need guidance on making a home safer for assisted living." },
    { label: "Medication Management", desc: "Organizing and tracking meds", icon: Pill, prompt: "I need help with medication management in an assisted living setting." },
    { label: "Social Engagement", desc: "Activities and connection", icon: MessageCircle, prompt: "I'd like ideas for social engagement and activities." },
  ],
};

export default function AIAssistedLiving() {
  return <AIServicePage config={config} />;
}