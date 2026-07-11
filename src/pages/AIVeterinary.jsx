import React from "react";
import AIServicePage from "@/components/services/AIServicePage";
import { PawPrint, Stethoscope, Syringe, Apple, Brain, Shield } from "lucide-react";

const config = {
  title: "AI Veterinary Care",
  subtitle: "AI-powered pet health consultations — symptoms, vaccinations, nutrition, and breed-specific care",
  icon: PawPrint,
  color: "from-purple-500 to-pink-600",
  btnClass: "bg-purple-600 hover:bg-purple-700",
  textColor: "text-purple-600",
  systemPrompt: "You are an AI Veterinary assistant. You provide guidance on pet health, common symptoms, vaccinations, pet nutrition, behavioral issues, parasite prevention, and breed-specific health concerns for all types of pets. Always recommend seeing a licensed veterinarian for diagnosis and treatment. Do not provide definitive diagnoses.",
  disclaimer: "This AI veterinary guidance is for informational purposes only. Always consult a licensed veterinarian for pet diagnosis and treatment.",
  topics: [
    { label: "Pet Symptoms", desc: "Identify possible issues", icon: Stethoscope, prompt: "My pet is showing symptoms and I need guidance." },
    { label: "Vaccinations", desc: "Schedule and types", icon: Syringe, prompt: "I need advice on pet vaccination schedules." },
    { label: "Pet Nutrition", desc: "Diet and supplements", icon: Apple, prompt: "I'd like guidance on my pet's nutrition and diet." },
    { label: "Behavioral Issues", desc: "Training and behavior", icon: Brain, prompt: "My pet has behavioral issues and I need advice." },
    { label: "Parasite Prevention", desc: "Fleas, ticks, heartworm", icon: Shield, prompt: "I need guidance on parasite prevention for my pet." },
    { label: "Breed-Specific Health", desc: "Breed concerns and care", icon: PawPrint, prompt: "I'd like to learn about breed-specific health concerns for my pet." },
  ],
};

export default function AIVeterinary() {
  return <AIServicePage config={config} />;
}