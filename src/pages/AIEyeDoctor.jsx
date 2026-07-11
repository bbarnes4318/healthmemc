import React, { useState } from "react";
import AIServicePage from "@/components/services/AIServicePage";
import EyeExam from "@/components/eye/EyeExam";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Glasses, AlertTriangle, Eye as EyeIcon, Activity } from "lucide-react";

const config = {
  title: "AI Eye Doctor",
  subtitle: "AI-powered eye care guidance, vision screening, and ocular health consultations",
  icon: Eye,
  color: "from-indigo-500 to-purple-600",
  btnClass: "bg-indigo-600 hover:bg-indigo-700",
  textColor: "text-indigo-600",
  systemPrompt: "You are an AI Eye Doctor assistant. You provide guidance on vision health, eye conditions (dry eyes, conjunctivitis, cataracts, glaucoma, macular degeneration), eye strain, digital screen fatigue, contact lens care, and when to see an optometrist or ophthalmologist. Be thorough but accessible. Do not provide definitive diagnoses — recommend seeing a licensed eye care professional for clinical examination and treatment.",
  disclaimer: "This AI eye care guidance is for informational purposes only. Always consult a licensed optometrist or ophthalmologist for diagnosis and treatment.",
  topics: [
    { label: "Blurry Vision", desc: "Sudden or gradual changes", icon: EyeOff, prompt: "I'm experiencing blurry vision and need help understanding possible causes." },
    { label: "Eye Strain", desc: "Screen fatigue, discomfort", icon: AlertTriangle, prompt: "I have eye strain from screens and need relief strategies." },
    { label: "Dry Eyes", desc: "Irritation, redness, burning", icon: Eye, prompt: "My eyes feel dry and irritated. What can I do?" },
    { label: "Vision Correction", desc: "Glasses, contacts, LASIK", icon: Glasses, prompt: "I'd like to learn about vision correction options." },
    { label: "Eye Health", desc: "Nutrition, preventive care", icon: Activity, prompt: "What can I do to keep my eyes healthy long-term?" },
    { label: "Eye Emergency", desc: "Injury, flashes, floaters", icon: AlertTriangle, prompt: "I'm having an eye emergency and need guidance." },
  ],
};

export default function AIEyeDoctor() {
  const [activeTab, setActiveTab] = useState("consult");

  return (
    <div>
      <div className="sticky top-14 lg:top-0 z-10 bg-white border-b border-border px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="consult"><EyeIcon className="w-3.5 h-3.5 mr-1.5" />AI Consult</TabsTrigger>
            <TabsTrigger value="exam"><Activity className="w-3.5 h-3.5 mr-1.5" />Eye Exam</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {activeTab === "consult" ? (
        <AIServicePage config={config} />
      ) : (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <EyeExam />
        </div>
      )}
    </div>
  );
}