import React from "react";
import AIServicePage from "@/components/services/AIServicePage";
import { Dumbbell, Bone, Activity, Move, Stethoscope, AlignCenter } from "lucide-react";

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
  return <AIServicePage config={config} />;
}