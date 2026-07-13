import React, { useState } from "react";
import AIServicePage from "@/components/services/AIServicePage";
import ExerciseTracker from "@/components/pt/ExerciseTracker";
import PTSummary from "@/components/pt/PTSummary";
import PTGoals from "@/components/pt/PTGoals";
import PTMilestoneTimeline from "@/components/pt/PTMilestoneTimeline";
import ExerciseTemplateManager from "@/components/pt/ExerciseTemplateManager";
import PTDailyGoals from "@/components/pt/PTDailyGoals";
import MasterRecoveryDashboard from "@/components/pt/MasterRecoveryDashboard";
import BodyDiagram from "@/components/consultations/BodyDiagram";
import BodyModel3D from "@/components/3d/BodyModel3D";
import PainHeatmap3D from "@/components/3d/PainHeatmap3D";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Bone, Activity, Move, Stethoscope, AlignCenter, ClipboardList, BarChart3, PersonStanding, Box, Award, Bookmark, LayoutDashboard, Flame } from "lucide-react";

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
          <TabsList className="grid grid-cols-9 max-w-3xl mx-auto">
            <TabsTrigger value="consult"><Dumbbell className="w-3.5 h-3.5 mr-1.5" />AI Consult</TabsTrigger>
            <TabsTrigger value="bodymap"><PersonStanding className="w-3.5 h-3.5 mr-1.5" />Body Map</TabsTrigger>
            <TabsTrigger value="3dbody"><Box className="w-3.5 h-3.5 mr-1.5" />3D Body</TabsTrigger>
            <TabsTrigger value="heatmap"><Flame className="w-3.5 h-3.5 mr-1.5" />Heatmap</TabsTrigger>
            <TabsTrigger value="tracker"><ClipboardList className="w-3.5 h-3.5 mr-1.5" />Tracker</TabsTrigger>
            <TabsTrigger value="templates"><Bookmark className="w-3.5 h-3.5 mr-1.5" />Templates</TabsTrigger>
            <TabsTrigger value="summary"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Summary</TabsTrigger>
            <TabsTrigger value="master"><LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />Master</TabsTrigger>
            <TabsTrigger value="milestones"><Award className="w-3.5 h-3.5 mr-1.5" />Milestones</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {activeTab === "consult" ? (
        <AIServicePage config={config} />
      ) : activeTab === "bodymap" ? (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <BodyDiagram />
        </div>
      ) : activeTab === "3dbody" ? (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <BodyModel3D />
        </div>
      ) : activeTab === "heatmap" ? (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <PainHeatmap3D />
        </div>
      ) : activeTab === "tracker" ? (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <ExerciseTracker />
        </div>
      ) : activeTab === "templates" ? (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <ExerciseTemplateManager />
        </div>
      ) : activeTab === "summary" ? (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <PTDailyGoals />
          <PTGoals />
          <PTSummary />
        </div>
      ) : activeTab === "master" ? (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <MasterRecoveryDashboard />
        </div>
      ) : (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <PTMilestoneTimeline />
        </div>
      )}
    </div>
  );
}