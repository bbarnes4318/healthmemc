import React, { useState } from "react";
import AIServicePage from "@/components/services/AIServicePage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Shield } from "lucide-react";
import {
  Flower2, Droplet, Flame, Sparkles, Moon, Wind, Leaf, Sun, Waves,
  Hand, Music, Heart, Brain, Snowflake, Gem, Bath, Calendar, BarChart3
} from "lucide-react";
import SpaScheduleBuilder from "@/components/spa/SpaScheduleBuilder";
import WellnessSessionTracker from "@/components/spa/WellnessSessionTracker";
import RecoveryMoodTracker from "@/components/spa/RecoveryMoodTracker";
import SpaWellnessDashboard from "@/components/spa/SpaWellnessDashboard";

const spaConfig = {
  title: "AI Wellness Spa",
  subtitle: "AI-powered spa consultations for relaxation, rejuvenation, and holistic wellness",
  icon: Flower2,
  color: "from-purple-500 to-pink-600",
  btnClass: "bg-purple-600 hover:bg-purple-700",
  textColor: "text-purple-600",
  systemPrompt: "You are an AI Wellness Spa consultant. You provide guidance on spa treatments, relaxation techniques, aromatherapy, hydrotherapy, massage therapy, meditation, skincare, and holistic wellness practices. Recommend specific treatments, rituals, and self-care routines tailored to the user's needs. Be warm, calming, and nurturing. Always clarify that this is wellness guidance and not medical treatment.",
  disclaimer: "AI Wellness Spa guidance is for relaxation and wellness purposes only. It is not a substitute for medical advice, diagnosis, or treatment. Consult a healthcare professional for medical concerns.",
  topics: [
    { label: "Stress Relief", desc: "Relaxation treatments & rituals", icon: Leaf, prompt: "I'm feeling stressed and need spa treatment recommendations for relaxation." },
    { label: "Better Sleep", desc: "Evening wind-down rituals", icon: Moon, prompt: "I'm having trouble sleeping and want spa-inspired rituals to help me wind down." },
    { label: "Skincare", desc: "Facial treatments & routines", icon: Sparkles, prompt: "I'd like recommendations for spa skincare treatments and at-home facial routines." },
    { label: "Aromatherapy", desc: "Essential oils & scents", icon: Droplet, prompt: "I want to learn about aromatherapy and which essential oils would benefit me." },
    { label: "Meditation", desc: "Guided mindfulness sessions", icon: Brain, prompt: "I'd like guidance on meditation and mindfulness practices for my wellness." },
    { label: "Detox & Renewal", desc: "Cleansing & body treatments", icon: Waves, prompt: "I'm interested in detox and body renewal spa treatments." },
  ],
};

const treatments = [
  { name: "Swedish Massage", icon: Hand, category: "Massage", duration: "60 min", desc: "Gentle full-body massage using long strokes to promote relaxation and improve circulation", benefits: ["Reduces stress", "Improves circulation", "Eases muscle tension"], color: "from-purple-400 to-violet-500" },
  { name: "Deep Tissue Massage", icon: Hand, category: "Massage", duration: "75 min", desc: "Targeted pressure on deeper muscle layers to relieve chronic tension and pain", benefits: ["Chronic pain relief", "Breaks up scar tissue", "Improves mobility"], color: "from-indigo-400 to-purple-500" },
  { name: "Hot Stone Therapy", icon: Flame, category: "Massage", duration: "90 min", desc: "Smooth heated stones placed on key points to melt tension and balance energy", benefits: ["Deep relaxation", "Eases stiffness", "Improves blood flow"], color: "from-orange-400 to-red-500" },
  { name: "Aromatherapy Session", icon: Droplet, category: "Aroma", duration: "45 min", desc: "Custom essential oil blend massage targeting emotional and physical wellness", benefits: ["Mood enhancement", "Stress reduction", "Better sleep"], color: "from-pink-400 to-rose-500" },
  { name: "Hydrotherapy", icon: Waves, category: "Water", duration: "30 min", desc: "Therapeutic use of water — steam, jets, and contrast baths for healing", benefits: ["Detoxification", "Muscle recovery", "Boosts immunity"], color: "from-cyan-400 to-blue-500" },
  { name: "Reflexology", icon: Hand, category: "Massage", duration: "45 min", desc: "Pressure point therapy on feet and hands to stimulate healing throughout the body", benefits: ["Energy balance", "Pain relief", "Deep relaxation"], color: "from-emerald-400 to-teal-500" },
  { name: "Sound Healing", icon: Music, category: "Energy", duration: "60 min", desc: "Vibrational therapy using singing bowls, gongs, and chimes to restore harmony", benefits: ["Mental clarity", "Emotional release", "Deep calm"], color: "from-violet-400 to-indigo-500" },
  { name: "Facial Treatment", icon: Sparkles, category: "Skincare", duration: "50 min", desc: "Deep cleansing, exfoliation, and nourishing mask customized for your skin type", benefits: ["Glowing skin", "Deep hydration", "Anti-aging"], color: "from-rose-400 to-pink-500" },
  { name: "Body Wrap", icon: Leaf, category: "Body", duration: "60 min", desc: "Nourishing wrap with clay, algae, or herbal compounds to detoxify and hydrate", benefits: ["Skin detox", "Hydration", "Inch reduction"], color: "from-green-400 to-emerald-500" },
  { name: "Meditation Session", icon: Brain, category: "Mind", duration: "30 min", desc: "Guided mindfulness practice with breathwork and visualization techniques", benefits: ["Mental clarity", "Stress relief", "Emotional balance"], color: "from-blue-400 to-indigo-500" },
  { name: "Acupuncture", icon: Gem, category: "Energy", duration: "45 min", desc: "Traditional Chinese medicine using fine needles to balance energy pathways", benefits: ["Pain management", "Stress relief", "Energy balance"], color: "from-amber-400 to-orange-500" },
  { name: "Cold Plunge Therapy", icon: Snowflake, category: "Water", duration: "15 min", desc: "Cold water immersion to reduce inflammation and boost recovery and mood", benefits: ["Reduces inflammation", "Boosts mood", "Speeds recovery"], color: "from-sky-400 to-cyan-500" },
];

const rituals = [
  {
    name: "Morning Awakening Ritual",
    icon: Sun,
    duration: "15 min",
    steps: [
      "Start with a warm glass of water with lemon to hydrate and awaken digestion",
      "Practice 5 minutes of deep breathing — inhale for 4, hold for 4, exhale for 6",
      "Apply invigorating essential oil (peppermint or citrus) to temples and wrists",
      "Gentle stretching or yoga for 5 minutes to activate the body",
      "Set a positive intention for the day",
    ],
    color: "from-amber-400 to-orange-500",
  },
  {
    name: "Evening Wind-Down Ritual",
    icon: Moon,
    duration: "20 min",
    steps: [
      "Dim lights and disconnect from screens 1 hour before bed",
      "Brew a calming herbal tea — chamomile, lavender, or valerian",
      "Diffuse lavender or bergamot essential oil in the bedroom",
      "Take a warm bath with Epsom salts and 5 drops of lavender oil",
      "Practice 5 minutes of body scan meditation before sleep",
    ],
    color: "from-indigo-400 to-purple-500",
  },
  {
    name: "Midday Stress Relief Ritual",
    icon: Wind,
    duration: "10 min",
    steps: [
      "Step away from your workspace and find a quiet spot",
      "Practice box breathing — inhale 4, hold 4, exhale 4, hold 4 (repeat 5 times)",
      "Roll a tennis ball under your feet for reflexology pressure point relief",
      "Apply eucalyptus oil to your palms, cup hands over nose, breathe deeply",
      "Stretch neck and shoulders with gentle circles",
    ],
    color: "from-teal-400 to-cyan-500",
  },
  {
    name: "Weekend Renewal Ritual",
    icon: Bath,
    duration: "60 min",
    steps: [
      "Start with dry body brushing to stimulate lymphatic flow (5 min)",
      "Draw a warm bath with 2 cups Epsom salt, 1 cup baking soda, and ginger",
      "Add rose petals and 10 drops of rosemary essential oil",
      "Soak for 20-30 minutes with a cold compress on your forehead",
      "Follow with a full-body moisturizing massage using warm almond oil",
      "Sip detox water (cucumber, mint, lemon) throughout",
    ],
    color: "from-rose-400 to-pink-500",
  },
];

function TreatmentCard({ treatment, index }) {
  const Icon = treatment.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Card className="p-4 h-full flex flex-col">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${treatment.color} flex items-center justify-center mb-3`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm">{treatment.name}</h3>
          <Badge variant="outline" className="text-[9px] shrink-0">{treatment.duration}</Badge>
        </div>
        <Badge variant="outline" className="text-[9px] w-fit mb-2 bg-purple-50 text-purple-700 border-purple-200">{treatment.category}</Badge>
        <p className="text-xs text-muted-foreground flex-1">{treatment.desc}</p>
        <div className="mt-3 space-y-1">
          {treatment.benefits.map((b) => (
            <div key={b} className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-purple-400" />
              <span className="text-[10px] text-muted-foreground">{b}</span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

function RitualCard({ ritual, index }) {
  const Icon = ritual.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card className="p-5 h-full">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ritual.color} flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{ritual.name}</h3>
            <p className="text-[10px] text-muted-foreground">{ritual.duration} • {ritual.steps.length} steps</p>
          </div>
        </div>
        <ol className="space-y-2">
          {ritual.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={`text-[10px] font-bold w-4 h-4 rounded-full bg-gradient-to-br ${ritual.color} text-white flex items-center justify-center shrink-0 mt-0.5`}>{i + 1}</span>
              <span className="text-xs text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </Card>
    </motion.div>
  );
}

function AIWellnessPlan() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const { toast } = useToast();

  const generatePlan = async () => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI Wellness Spa consultant. Create a personalized 7-day wellness spa plan for the user. Include a mix of:
- Daily self-care rituals (morning and evening)
- Recommended spa treatments to try during the week
- Aromatherapy suggestions for each day
- Simple meditation or breathing exercises
- Skincare tips
- Nutrition suggestions that complement the wellness journey

Format the response as a clear day-by-day plan (Day 1 through Day 7) with practical, actionable steps. Keep it warm and inspiring. Do NOT ask for user input — just create a general but rich plan that anyone can follow.`,
      });
      setPlan(response);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate plan", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Card className="p-5">
      <div className="text-center mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-3">
          <Flower2 className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-sm">AI-Generated 7-Day Wellness Plan</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Get a personalized week-long spa wellness journey</p>
      </div>
      {!plan && !loading && (
        <Button onClick={generatePlan} className="w-full bg-purple-600 hover:bg-purple-700">
          <Sparkles className="w-4 h-4 mr-2" />Generate My Wellness Plan
        </Button>
      )}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-sm text-muted-foreground ml-2">Crafting your wellness journey...</span>
        </div>
      )}
      {plan && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ReactMarkdown className="prose prose-sm max-w-none">{plan}</ReactMarkdown>
          <Button variant="outline" size="sm" className="mt-3" onClick={generatePlan} disabled={loading}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />Regenerate Plan
          </Button>
        </motion.div>
      )}
      <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200 mt-4">
        <Shield className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-[10px] text-purple-800">Wellness guidance only — not medical advice. Consult a healthcare professional for medical concerns.</p>
      </div>
    </Card>
  );
}

export default function AIWellnessSpa() {
  const [activeTab, setActiveTab] = useState("consult");

  return (
    <div>
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white px-4 py-6 lg:py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-3">
            <Flower2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold">AI Wellness Spa</h1>
          <p className="text-white/80 text-sm mt-1">Relaxation, rejuvenation, and holistic wellness powered by AI</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-white/70">
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />AI Consultations</span>
            <span className="flex items-center gap-1"><Hand className="w-3 h-3" />12 Treatments</span>
            <span className="flex items-center gap-1"><Moon className="w-3 h-3" />4 Rituals</span>
          </div>
        </div>
      </div>

      <div className="sticky top-14 lg:top-0 z-10 bg-white border-b border-border px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid grid-cols-4 max-w-3xl mx-auto">
            <TabsTrigger value="consult"><Flower2 className="w-3.5 h-3.5 mr-1.5" />AI Consult</TabsTrigger>
            <TabsTrigger value="schedule"><Calendar className="w-3.5 h-3.5 mr-1.5" />Schedule</TabsTrigger>
            <TabsTrigger value="sessions"><Brain className="w-3.5 h-3.5 mr-1.5" />Sessions</TabsTrigger>
            <TabsTrigger value="mood"><Heart className="w-3.5 h-3.5 mr-1.5" />Mood</TabsTrigger>
            <TabsTrigger value="dashboard"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Dashboard</TabsTrigger>
            <TabsTrigger value="treatments"><Hand className="w-3.5 h-3.5 mr-1.5" />Treatments</TabsTrigger>
            <TabsTrigger value="rituals"><Moon className="w-3.5 h-3.5 mr-1.5" />Rituals</TabsTrigger>
            <TabsTrigger value="plan"><Sparkles className="w-3.5 h-3.5 mr-1.5" />7-Day Plan</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "consult" ? (
        <AIServicePage config={spaConfig} />
      ) : activeTab === "schedule" ? (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <SpaScheduleBuilder />
        </div>
      ) : activeTab === "sessions" ? (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <WellnessSessionTracker />
        </div>
      ) : activeTab === "mood" ? (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <RecoveryMoodTracker />
        </div>
      ) : activeTab === "dashboard" ? (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
          <SpaWellnessDashboard />
        </div>
      ) : activeTab === "treatments" ? (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
          <div className="mb-4">
            <h2 className="text-lg font-display font-bold">Spa Treatment Catalog</h2>
            <p className="text-sm text-muted-foreground">Explore our curated wellness treatments — consult the AI for personalized recommendations</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {treatments.map((t, i) => <TreatmentCard key={t.name} treatment={t} index={i} />)}
          </div>
        </div>
      ) : activeTab === "rituals" ? (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
          <div className="mb-4">
            <h2 className="text-lg font-display font-bold">Wellness Rituals</h2>
            <p className="text-sm text-muted-foreground">Simple self-care rituals you can practice at home</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rituals.map((r, i) => <RitualCard key={r.name} ritual={r} index={i} />)}
          </div>
        </div>
      ) : (
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <AIWellnessPlan />
        </div>
      )}
    </div>
  );
}