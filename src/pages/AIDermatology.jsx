import React, { useState } from "react";
import AIServicePage from "@/components/services/AIServicePage";
import DermatologyGallery from "@/components/dermatology/DermatologyGallery";
import DermatologyCompare from "@/components/dermatology/DermatologyCompare";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Camera, GitCompare, Shield } from "lucide-react";

const config = {
  title: "AI Dermatology",
  subtitle: "AI-powered skin analysis, mole tracking, and rash monitoring with photo comparison over time",
  icon: Scan,
  color: "from-teal-500 to-cyan-600",
  btnClass: "bg-teal-600 hover:bg-teal-700",
  textColor: "text-teal-600",
  systemPrompt: "You are an AI Dermatology assistant. You provide guidance on skin conditions including moles, rashes, acne, eczema, psoriasis, rosacea, dermatitis, skin lesions, sun damage, and signs of skin cancer (melanoma, basal cell carcinoma, squamous cell carcinoma). Teach users about the ABCDE rule for moles (Asymmetry, Border, Color, Diameter, Evolving). Do not provide definitive diagnoses — always recommend seeing a licensed dermatologist for clinical examination, especially for changing or concerning lesions.",
  disclaimer: "This AI dermatology guidance is for informational purposes only. Always consult a licensed dermatologist for diagnosis and treatment. Any changes in moles or skin lesions should be evaluated by a professional.",
  topics: [
    { label: "Mole Check", desc: "ABCDE rule, when to worry", icon: Scan, prompt: "I want to learn about the ABCDE rule for checking moles and when I should be concerned." },
    { label: "Rash & Itching", desc: "Identify and manage rashes", icon: Shield, prompt: "I have a rash and itching. What could it be and what should I do?" },
    { label: "Acne & Breakouts", desc: "Treatment and prevention", icon: Camera, prompt: "I'm struggling with acne breakouts and need treatment advice." },
    { label: "Eczema & Dry Skin", desc: "Flare-up management", icon: Shield, prompt: "I have eczema and dry skin flare-ups. How can I manage them?" },
    { label: "Sun Damage", desc: "SPF, sun spots, prevention", icon: Shield, prompt: "I'm concerned about sun damage and want prevention tips." },
    { label: "Skin Cancer Signs", desc: "Warning signs, screening", icon: Scan, prompt: "What are the warning signs of skin cancer I should watch for?" },
  ],
};

export default function AIDermatology() {
  const [activeTab, setActiveTab] = useState("consult");

  return (
    <div>
      <div className="sticky top-14 lg:top-0 z-10 bg-white border-b border-border px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 max-w-lg mx-auto">
            <TabsTrigger value="consult"><Scan className="w-3.5 h-3.5 mr-1.5" />AI Consult</TabsTrigger>
            <TabsTrigger value="gallery"><Camera className="w-3.5 h-3.5 mr-1.5" />Gallery</TabsTrigger>
            <TabsTrigger value="compare"><GitCompare className="w-3.5 h-3.5 mr-1.5" />Compare</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {activeTab === "consult" ? (
        <AIServicePage config={config} />
      ) : activeTab === "gallery" ? (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <DermatologyGallery />
        </div>
      ) : (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <DermatologyCompare />
        </div>
      )}
    </div>
  );
}