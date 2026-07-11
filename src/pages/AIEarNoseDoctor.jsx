import React, { useState } from "react";
import AIServicePage from "@/components/services/AIServicePage";
import HearingExam from "@/components/ent/HearingExam";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ear, Volume2, Wind, AlertTriangle, Ear as EarIcon, Activity } from "lucide-react";

const config = {
  title: "AI Ear & Nose Doctor",
  subtitle: "AI-powered ENT guidance, hearing screening, and sinus/respiratory consultations",
  icon: Ear,
  color: "from-purple-500 to-pink-600",
  btnClass: "bg-purple-600 hover:bg-purple-700",
  textColor: "text-purple-600",
  systemPrompt: "You are an AI Ear, Nose, and Throat (ENT) assistant. You provide guidance on hearing concerns, ear infections, tinnitus, vertigo, sinus issues, nasal congestion, allergies, sore throats, voice/hoarseness, and when to see an ENT specialist. Be thorough but accessible. Do not provide definitive diagnoses — recommend seeing a licensed ENT specialist (otolaryngologist) or audiologist for clinical examination and treatment.",
  disclaimer: "This AI ENT guidance is for informational purposes only. Always consult a licensed ENT specialist or audiologist for diagnosis and treatment.",
  topics: [
    { label: "Hearing Loss", desc: "Difficulty hearing, muffled", icon: Volume2, prompt: "I'm having trouble hearing and need help understanding possible causes." },
    { label: "Ear Pain", desc: "Earache, pressure, infection", icon: AlertTriangle, prompt: "I have ear pain and pressure. What should I do?" },
    { label: "Tinnitus", desc: "Ringing in the ears", icon: Ear, prompt: "I'm experiencing ringing in my ears and need guidance." },
    { label: "Sinus Issues", desc: "Congestion, sinusitis", icon: Wind, prompt: "I have sinus congestion and pressure. What can help?" },
    { label: "Sore Throat", desc: "Pain, swelling, hoarseness", icon: AlertTriangle, prompt: "I have a persistent sore throat and need advice." },
    { label: "Allergies", desc: "Nasal allergies, hay fever", icon: Wind, prompt: "I'm struggling with nasal allergies and need management tips." },
  ],
};

export default function AIEarNoseDoctor() {
  const [activeTab, setActiveTab] = useState("consult");

  return (
    <div>
      <div className="sticky top-14 lg:top-0 z-10 bg-white border-b border-border px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="consult"><EarIcon className="w-3.5 h-3.5 mr-1.5" />AI Consult</TabsTrigger>
            <TabsTrigger value="exam"><Activity className="w-3.5 h-3.5 mr-1.5" />Hearing Test</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {activeTab === "consult" ? (
        <AIServicePage config={config} />
      ) : (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <HearingExam />
        </div>
      )}
    </div>
  );
}