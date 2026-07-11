import React from "react";
import AIServicePage from "@/components/services/AIServicePage";
import { Dumbbell, Bone, Activity, HeartPulse, Timer, Shield, Brain, Zap, AlertTriangle, Trophy } from "lucide-react";

const config = {
  title: "AI Pro Sports Medicine",
  subtitle: "AI-powered sports medicine consultations for athletes — injury prevention, recovery, performance optimization, and return-to-play guidance",
  icon: Dumbbell,
  color: "from-orange-500 to-red-600",
  btnClass: "bg-orange-600 hover:bg-orange-700",
  textColor: "text-orange-600",
  systemPrompt: "You are an AI Pro Sports Medicine assistant specializing in athletic health. You provide expert guidance on sports injuries (sprains, strains, fractures, concussions), injury prevention, rehabilitation protocols, return-to-play decisions, performance optimization, recovery strategies, nutrition for athletes, and training load management. Consider the athlete's sport, competitive level, and goals. Be thorough but accessible. Do not provide definitive diagnoses or override a physician's clearance — recommend seeing a sports medicine physician or athletic trainer for clinical evaluation.",
  disclaimer: "This AI sports medicine guidance is for informational purposes only and does not replace evaluation by a licensed sports medicine physician or athletic trainer. Seek immediate medical attention for severe injuries, head trauma, or persistent pain.",
  topics: [
    { label: "Injury Assessment", desc: "Evaluate pain or injury", icon: Bone, prompt: "I'm dealing with a sports injury and need help understanding what might be going on and what to do next." },
    { label: "Injury Prevention", desc: "Warm-ups, mobility, strength", icon: Shield, prompt: "I want to learn how to prevent injuries in my sport and training routine." },
    { label: "Recovery & Rehab", desc: "Rehab protocols & timelines", icon: Activity, prompt: "I'm recovering from an injury and need guidance on rehabilitation exercises and timeline." },
    { label: "Return to Play", desc: "Safe return-to-play decisions", icon: Trophy, prompt: "I'm preparing to return to my sport after an injury and need guidance on when it's safe." },
    { label: "Performance Tips", desc: "Optimize training & recovery", icon: Zap, prompt: "I want to optimize my athletic performance and training efficiency." },
    { label: "Concussion Guidance", desc: "Head injury protocols", icon: Brain, prompt: "I or someone I know may have a concussion and need guidance on what to do." },
  ],
};

export default function AIProSportsMedicine() {
  return <AIServicePage config={config} />;
}