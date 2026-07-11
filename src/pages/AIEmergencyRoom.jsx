import React from "react";
import AIServicePage from "@/components/services/AIServicePage";
import { Siren, HeartPulse, Brain, Bone, Wind, Shield, Pill } from "lucide-react";

export default function AIEmergencyRoom() {
  return (
    <AIServicePage
      config={{
        title: "AI Emergency Room",
        subtitle:
          "AI-powered triage and emergency care guidance for urgent symptoms — assess severity, get first-aid steps, and know when to seek immediate care",
        icon: Siren,
        color: "from-red-500 to-rose-600",
        btnClass:
          "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700",
        textColor: "text-red-600",
        systemPrompt:
          "You are an AI Emergency Room triage assistant. A patient is describing an urgent symptom or situation. Your role:\n\n1. Assess the severity: Is this a life-threatening emergency requiring 911, an urgent care visit, or something that can wait for a regular appointment?\n2. Ask targeted follow-up questions about the symptom: onset, duration, severity (1-10), triggers, associated symptoms, medical history, and current medications.\n3. Provide immediate first-aid or home care guidance while they decide on next steps.\n4. Clearly state red-flag symptoms that require calling 911 immediately.\n5. Recommend the appropriate level of care (ER, urgent care, primary care, or home management).\n\nCRITICAL: If the patient describes symptoms of a heart attack, stroke, severe bleeding, anaphylaxis, or any immediately life-threatening condition, tell them to call 911 RIGHT NOW before anything else.\n\nBe calm, clear, and reassuring. Use simple language. Do not diagnose — provide triage guidance and safety recommendations.",
        topics: [
          {
            label: "Chest Pain",
            desc: "Chest pressure, pain, or tightness",
            icon: HeartPulse,
            prompt:
              "I'm experiencing chest pain or pressure and I'm not sure if I should go to the ER. Can you help me assess?",
          },
          {
            label: "Breathing Difficulty",
            desc: "Shortness of breath or wheezing",
            icon: Wind,
            prompt:
              "I'm having trouble breathing and want to know if this is an emergency or something I can manage.",
          },
          {
            label: "Head Injury",
            desc: "Head trauma, concussion symptoms",
            icon: Brain,
            prompt:
              "I hit my head and I'm not feeling right. Can you help me figure out if I need to go to the ER?",
          },
          {
            label: "Severe Injury",
            desc: "Bleeding, fractures, or deep wounds",
            icon: Bone,
            prompt:
              "I have a severe injury with bleeding or possible fracture. What should I do right now?",
          },
          {
            label: "Allergic Reaction",
            desc: "Swelling, hives, or anaphylaxis signs",
            icon: Shield,
            prompt:
              "I think I'm having an allergic reaction. How do I know if it's an emergency?",
          },
          {
            label: "Medication Issue",
            desc: "Overdose, adverse reaction, or missed dose",
            icon: Pill,
            prompt:
              "I'm concerned about a medication issue — possible adverse reaction or overdose. What should I do?",
          },
        ],
        disclaimer:
          "This AI service provides triage guidance only and does not replace professional medical care. If you believe you are experiencing a life-threatening emergency, call 911 or go to your nearest emergency room immediately. Do not delay seeking emergency care based on AI guidance.",
      }}
    />
  );
}