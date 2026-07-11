import React, { useState } from "react";
import AIServicePage from "@/components/services/AIServicePage";
import ExerciseTracker from "@/components/pt/ExerciseTracker";
import PTSummary from "@/components/pt/PTSummary";
import PTGoals from "@/components/pt/PTGoals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Bone, Activity, Move, Stethoscope, AlignCenter, ClipboardList, BarChart3 } from "lucide-react";

const config = {
  title: "AI Physical Therapy",
  subtitle: "AI-guided rehabilitation, exercise plans, and mobility support",
  icon: Dumbbell,
  color: "from-orange-500 to-red-600",
  btnClass: "bg-orange-600 hover:bg-orange-700",
  textColor: "text-orange-600",
  systemPrompt: "You are an AI Physical Therapy assistant. You provide guidance on injury recovery, exercise plans, pain management, mobility and stretching, post-surgery rehabilitation, and posture correction. Be specific with exercise descriptions but always recommend an in-person assessment by a licensed physical therapist for hands-on treatment.",
  disclaimer: "This AI physical therapy guidance is for informational purposes only. Always consult a licensed physical therapist before starting any exercise program.",
  topics: [
    { label: "Injury Recovery", desc: "Sprains, strains, recovery", icon: Bone, prompt: "I'm recovering from an injury and need rehabilitation guidance." },
    { label: "Exercise Plan", desc: "Customized routines", icon: Dumbbell, prompt: "I'd like help creating an exercise plan for my fitness level." },
    { label: "Pain Management", desc: "Chronic and acute pain", icon: Activity, prompt: "I'm dealing with pain and need management strategies." },
    { label: "Mobility & Stretching", desc: "Flexibility improvement", icon: Move, prompt: "I want to improve my mobility and flexibility." },
    { label: "Post-Surgery Rehab", desc: "Recovery after surgery", icon: Stethoscope, prompt: "I'm recovering from surgery and need rehab guidance." },
    { label: "Posture Correction", desc: "Fix posture issues", icon: AlignCenter, prompt: "I have posture problems and need corrective exercises." },
  ],
};

export default function AIPhysicalTherapy() {
  const [activeTab, setActiveTab] = useState("consult");

  return (
    <div>
      <div className="sticky top-14 lg:top-0 z-10 bg-white border-b border-border px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="consult"><Dumbbell className="w-3.5 h-3.5 mr-1.5" />AI Consult</TabsTrigger>
            <TabsTrigger value="tracker"><ClipboardList className="w-3.5 h-3.5 mr-1.5" />Tracker</TabsTrigger>
            <TabsTrigger value="summary"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Summary</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {activeTab === "consult" ? (
        <AIServicePage config={config} />
      ) : activeTab === "tracker" ? (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <ExerciseTracker />
        </div>
      ) : (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <PTGoals />
          <PTSummary />
        </div>
      )}
    </div>
  );
}