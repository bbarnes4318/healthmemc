import React, { useState } from "react";
import AIServicePage from "@/components/services/AIServicePage";
import PetModel3D from "@/components/3d/PetModel3D";
import PetHealthReminders from "@/components/veterinary/PetHealthReminders";
import PetEmergencyCard from "@/components/veterinary/PetEmergencyCard";
import PetNutritionLog from "@/components/veterinary/PetNutritionLog";
import PetHealthTimeline from "@/components/veterinary/PetHealthTimeline";
import PetMedicationReminders from "@/components/veterinary/PetMedicationReminders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PawPrint, Stethoscope, Syringe, Apple, Brain, Shield, Box, Bell, HeartPulse, Utensils, ClipboardList, Pill } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("consult");

  return (
    <div>
      <div className="sticky top-14 lg:top-0 z-10 bg-white border-b border-border px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 md:grid-cols-7 max-w-3xl mx-auto">
            <TabsTrigger value="consult"><PawPrint className="w-3.5 h-3.5 mr-1.5" />AI Consult</TabsTrigger>
            <TabsTrigger value="3dpet"><Box className="w-3.5 h-3.5 mr-1.5" />3D Pet</TabsTrigger>
            <TabsTrigger value="emergency"><HeartPulse className="w-3.5 h-3.5 mr-1.5" />Emergency</TabsTrigger>
            <TabsTrigger value="nutrition"><Utensils className="w-3.5 h-3.5 mr-1.5" />Nutrition</TabsTrigger>
            <TabsTrigger value="medications"><Pill className="w-3.5 h-3.5 mr-1.5" />Meds</TabsTrigger>
            <TabsTrigger value="timeline"><ClipboardList className="w-3.5 h-3.5 mr-1.5" />Health Log</TabsTrigger>
            <TabsTrigger value="reminders"><Bell className="w-3.5 h-3.5 mr-1.5" />Reminders</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {activeTab === "consult" ? (
        <AIServicePage config={config} />
      ) : activeTab === "3dpet" ? (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <PetModel3D />
        </div>
      ) : activeTab === "emergency" ? (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <PetEmergencyCard />
        </div>
      ) : activeTab === "nutrition" ? (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <PetNutritionLog />
        </div>
      ) : activeTab === "medications" ? (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <PetMedicationReminders />
        </div>
      ) : activeTab === "timeline" ? (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <PetHealthTimeline />
        </div>
      ) : (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <PetHealthReminders />
        </div>
      )}
    </div>
  );
}