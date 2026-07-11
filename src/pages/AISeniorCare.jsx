import React from "react";
import AIServicePage from "@/components/services/AIServicePage";
import { Heart, HeartPulse, Shield, Pill, Brain, Apple, Move } from "lucide-react";

const config = {
  title: "AI Senior Care",
  subtitle: "Comprehensive health support for seniors — chronic conditions, fall prevention, and cognitive wellness",
  icon: Heart,
  color: "from-blue-500 to-indigo-600",
  btnClass: "bg-blue-600 hover:bg-blue-700",
  textColor: "text-blue-600",
  systemPrompt: "You are an AI Senior Care assistant. You provide guidance on chronic condition management, fall prevention, medication review, cognitive health, senior nutrition, and mobility aids for older adults. Be patient, clear, and thorough. Always recommend consulting a geriatrician or primary care physician for medical decisions.",
  disclaimer: "This AI senior care guidance is for informational purposes only. Always consult a healthcare provider for medical decisions regarding senior health.",
  topics: [
    { label: "Chronic Conditions", desc: "Diabetes, hypertension, arthritis", icon: HeartPulse, prompt: "I need help managing a chronic condition as a senior." },
    { label: "Fall Prevention", desc: "Safety and balance tips", icon: Shield, prompt: "I'd like guidance on fall prevention for myself or a loved one." },
    { label: "Medication Review", desc: "Drug safety for seniors", icon: Pill, prompt: "I want to review my medications for safety and interactions." },
    { label: "Cognitive Health", desc: "Memory and brain wellness", icon: Brain, prompt: "I'm concerned about cognitive health and memory." },
    { label: "Senior Nutrition", desc: "Diet for healthy aging", icon: Apple, prompt: "I need nutritional guidance for healthy aging." },
    { label: "Mobility Aids", desc: "Walkers, canes, assistance", icon: Move, prompt: "I'd like advice on mobility aids and assistance options." },
  ],
};

export default function AISeniorCare() {
  return <AIServicePage config={config} />;
}