import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Apple, Dumbbell, Moon, Heart, Wind, Scale, Cigarette,
  ChefHat, Loader2, ArrowLeft, Shield
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import WellnessCharts from "@/components/wellness/WellnessCharts";

const programs = [
  { name: "Nutrition Plans", icon: Apple, color: "from-green-500 to-emerald-600", desc: "Personalized dietary guidance" },
  { name: "Exercise Programs", icon: Dumbbell, color: "from-blue-500 to-indigo-600", desc: "Tailored fitness routines" },
  { name: "Sleep Coaching", icon: Moon, color: "from-indigo-500 to-purple-600", desc: "Better sleep habits" },
  { name: "Stress Management", icon: Heart, color: "from-rose-500 to-pink-600", desc: "Relaxation techniques" },
  { name: "Breathing Exercises", icon: Wind, color: "from-cyan-500 to-sky-600", desc: "Guided breathing" },
  { name: "Weight Management", icon: Scale, color: "from-amber-500 to-orange-600", desc: "Healthy weight goals" },
  { name: "Smoking Cessation", icon: Cigarette, color: "from-gray-500 to-slate-600", desc: "Quit smoking support" },
  { name: "Healthy Recipes", icon: ChefHat, color: "from-lime-500 to-green-600", desc: "Nutritious meal ideas" },
];

export default function Wellness() {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProgram = async (program) => {
    setSelectedProgram(program);
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a comprehensive wellness guide for "${program.name}". Include practical, actionable tips. Structure with clear sections. Add a 7-day starter plan where applicable. Include safety notes. Clearly identify all recommendations as complementary to medical care, not a replacement for professional advice. Keep it motivating and supportive.`
      });
      setContent(response);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  if (selectedProgram) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => { setSelectedProgram(null); setContent(null); }} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> All Programs
        </Button>

        <Card className={`p-6 bg-gradient-to-br ${selectedProgram.color} text-white border-0 mb-6`}>
          <div className="flex items-center gap-3">
            <selectedProgram.icon className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-display font-bold">{selectedProgram.name}</h1>
              <p className="text-white/80 text-sm">{selectedProgram.desc}</p>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
          </div>
        ) : content ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <ReactMarkdown className="prose prose-sm max-w-none">{content}</ReactMarkdown>
            </Card>
            <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200 mt-4">
              <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                These recommendations are complementary to medical care and are not a substitute for professional medical advice.
              </p>
            </div>
          </motion.div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold">Wellness Center</h1>
          <p className="text-muted-foreground mt-1 text-sm">Holistic health programs for mind, body, and spirit</p>
        </div>

        <WellnessCharts />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {programs.map((program, i) => (
            <motion.div key={program.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
              <Card
                className="p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 h-full"
                onClick={() => loadProgram(program)}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${program.color} flex items-center justify-center mb-3`}>
                  <program.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{program.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{program.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}