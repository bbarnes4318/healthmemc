import React, { useState } from "react";
import AIServicePage from "@/components/services/AIServicePage";
import HearingExam from "@/components/ent/HearingExam";
import HearingHealthLog from "@/components/ent/HearingHealthLog";
import HearingTrendChart from "@/components/health/HearingTrendChart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ear, Volume2, Wind, AlertTriangle, Ear as EarIcon, Activity, ClipboardList, TrendingUp } from "lucide-react";

const config = {
  title: "AI Ear Care",
  subtitle: "AI-powered hearing health guidance, hearing screenings, and ear care consultations",
  icon: Ear,
  color: "from-purple-500 to-fuchsia-600",
  btnClass: "bg-purple-600 hover:bg-purple-700",
  textColor: "text-purple-600",
  systemPrompt: "You are an AI Ear Care assistant specializing in hearing health. You provide guidance on hearing loss, ear infections, tinnitus, vertigo, earwax buildup, ear pain, hearing protection, hearing aids, and when to see an audiologist or ENT specialist. Be thorough but accessible. Do not provide definitive diagnoses — recommend seeing a licensed audiologist or ENT specialist (otolaryngologist) for clinical examination and treatment.",
  disclaimer: "This AI ear care guidance is for informational purposes only. Always consult a licensed audiologist or ENT specialist for diagnosis and treatment.",
  topics: [
    { label: "Hearing Loss", desc: "Difficulty hearing, muffled", icon: Volume2, prompt: "I'm having trouble hearing and need help understanding possible causes." },
    { label: "Ear Pain", desc: "Earache, pressure, infection", icon: AlertTriangle, prompt: "I have ear pain and pressure. What should I do?" },
    { label: "Tinnitus", desc: "Ringing in the ears", icon: Ear, prompt: "I'm experiencing ringing in my ears and need guidance." },
    { label: "Earwax Buildup", desc: "Blockage, cleaning tips", icon: Wind, prompt: "I think I have earwax buildup. What should I do?" },
    { label: "Hearing Aids", desc: "Options, fitting, care", icon: Volume2, prompt: "I'd like to learn about hearing aid options." },
    { label: "Hearing Protection", desc: "Preventing hearing damage", icon: Ear, prompt: "How can I protect my hearing from loud noise?" },
  ],
};

export default function EarCare() {
  const [activeTab, setActiveTab] = useState("consult");

  return (
    <div>
      <div className="sticky top-14 lg:top-0 z-10 bg-white border-b border-border px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="consult"><EarIcon className="w-3.5 h-3.5 mr-1.5" />AI Consult</TabsTrigger>
            <TabsTrigger value="exam"><Activity className="w-3.5 h-3.5 mr-1.5" />Hearing Test</TabsTrigger>
            <TabsTrigger value="log"><ClipboardList className="w-3.5 h-3.5 mr-1.5" />Health Log</TabsTrigger>
            <TabsTrigger value="trends"><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Trends</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {activeTab === "consult" ? (
        <AIServicePage config={config} />
      ) : activeTab === "exam" ? (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <HearingExam />
        </div>
      ) : activeTab === "log" ? (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <HearingHealthLog />
        </div>
      ) : (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <HearingTrendChart />
        </div>
      )}
    </div>
  );
}