import React, { useState } from "react";
import AIServicePage from "@/components/services/AIServicePage";
import ToothMap from "@/components/dental/ToothMap";
import MouthModel3D from "@/components/dental/MouthModel3D";
import OralCareChart from "@/components/dental/OralCareChart";
import DentalVisitLogSection from "@/components/dental/DentalVisitLogSection";
import DentalDashboard from "@/components/dental/DentalDashboard";
import DentalPainLogSection from "@/components/dental/DentalPainLogSection";
import DentalExportButton from "@/components/dental/DentalExportButton";
import NextCleaningScheduler from "@/components/dental/NextCleaningScheduler";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smile, AlertCircle, Droplet, Sparkles, AlertTriangle, Star, Bone as ToothIcon, ClipboardList, BarChart3, Activity, Box } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("consult");

  return (
    <div>
      <div className="sticky top-14 lg:top-0 z-10 bg-white border-b border-border px-4 py-2 flex items-center justify-between gap-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid grid-cols-6 max-w-3xl mx-auto">
            <TabsTrigger value="consult"><Smile className="w-3.5 h-3.5 mr-1.5" />AI Consult</TabsTrigger>
            <TabsTrigger value="toothmap"><ToothIcon className="w-3.5 h-3.5 mr-1.5" />Tooth Map</TabsTrigger>
            <TabsTrigger value="3dmouth"><Box className="w-3.5 h-3.5 mr-1.5" />3D Mouth</TabsTrigger>
            <TabsTrigger value="visits"><ClipboardList className="w-3.5 h-3.5 mr-1.5" />Visits</TabsTrigger>
            <TabsTrigger value="pain"><Activity className="w-3.5 h-3.5 mr-1.5" />Pain Log</TabsTrigger>
            <TabsTrigger value="dashboard"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Dashboard</TabsTrigger>
          </TabsList>
        </Tabs>
        <DentalExportButton />
      </div>
      {activeTab === "consult" ? (
        <AIServicePage config={config} />
      ) : activeTab === "toothmap" ? (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <ToothMap />
        </div>
      ) : activeTab === "3dmouth" ? (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <MouthModel3D />
        </div>
      ) : activeTab === "visits" ? (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <DentalVisitLogSection />
        </div>
      ) : activeTab === "pain" ? (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <DentalPainLogSection />
        </div>
      ) : (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-4">
          <NextCleaningScheduler />
          <DentalDashboard />
          <OralCareChart />
        </div>
      )}
    </div>
  );
}