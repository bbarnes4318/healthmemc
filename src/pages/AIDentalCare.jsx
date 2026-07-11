import React from "react";
import AIServicePage from "@/components/services/AIServicePage";
import { Smile, AlertCircle, Droplet, Sparkles, AlertTriangle, Star } from "lucide-react";

const config = {
  title: "AI Dental Care",
  subtitle: "AI-powered dental consultations for oral health, hygiene, and dental concerns",
  icon: Smile,
  color: "from-cyan-500 to-teal-600",
  btnClass: "bg-cyan-600 hover:bg-cyan-700",
  textColor: "text-cyan-600",
  systemPrompt: "You are an AI Dental Care assistant. You provide guidance on oral health, dental hygiene, tooth pain, gum issues, orthodontics, cosmetic dentistry, and dental emergencies. Be thorough but accessible. Do not provide definitive diagnoses — recommend seeing a licensed dentist for clinical examination and treatment.",
  disclaimer: "This AI dental guidance is for informational purposes only. Always consult a licensed dentist for diagnosis and treatment.",
  topics: [
    { label: "Tooth Pain", desc: "Identify possible causes", icon: AlertCircle, prompt: "I'm experiencing tooth pain and need help understanding possible causes." },
    { label: "Gum Issues", desc: "Bleeding, swelling, recession", icon: Droplet, prompt: "I'm having gum issues and need guidance." },
    { label: "Oral Hygiene", desc: "Brushing, flossing tips", icon: Sparkles, prompt: "I'd like advice on improving my oral hygiene routine." },
    { label: "Orthodontics", desc: "Braces, aligners, alignment", icon: Smile, prompt: "I have questions about orthodontic treatment options." },
    { label: "Dental Emergency", desc: "Urgent dental issues", icon: AlertTriangle, prompt: "I have a dental emergency and need immediate guidance." },
    { label: "Cosmetic Dentistry", desc: "Whitening, veneers, implants", icon: Star, prompt: "I'm interested in learning about cosmetic dentistry options." },
  ],
};

export default function AIDentalCare() {
  return <AIServicePage config={config} />;
}