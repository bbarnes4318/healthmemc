import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Dumbbell, Heart, Flame, Wind, Zap, PersonStanding, Bike, Activity, Loader2, Check, Clock, Users, Flame as CalIcon, Shield, Sparkles, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import VoiceInputButton from "@/components/voice/VoiceInputButton";
import AIFitnessPlanner from "@/components/fitness/AIFitnessPlanner";
import VirtualAvatarSelector from "@/components/shared/VirtualAvatarSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const typeIcons = {
  strength: Dumbbell, cardio: Heart, hiit: Flame, yoga: Wind,
  pilates: PersonStanding, cycling: Bike, boxing: Zap, dance: Activity,
  swimming: Activity, recovery: Heart,
};
const typeColors = {
  strength: "from-red-500 to-orange-600", cardio: "from-rose-500 to-pink-600",
  hiit: "from-orange-500 to-amber-600", yoga: "from-violet-500 to-purple-600",
  pilates: "from-cyan-500 to-blue-600", cycling: "from-emerald-500 to-teal-600",
  boxing: "from-amber-500 to-yellow-600", dance: "from-pink-500 to-fuchsia-600",
  swimming: "from-blue-500 to-indigo-600", recovery: "from-teal-500 to-green-600",
};
const diffColors = {
  beginner: "bg-emerald-100 text-emerald-700", intermediate: "bg-amber-100 text-amber-700", advanced: "bg-red-100 text-red-700",
};

const trainers = [
  {
    id: "strength", name: "Iron Mike", title: "Strength & Conditioning Coach",
    specialty: "Strength Training", icon: Dumbbell, color: "from-red-500 to-orange-600",
    bio: "Former competitive powerlifter. 15+ years building raw strength and muscle.",
    systemPrompt: "You are Iron Mike, a certified strength and conditioning coach with 15 years of experience. You specialize in building muscle, increasing strength, and proper form for compound lifts. Be motivating, direct, and practical. Always recommend proper warm-ups and emphasize safety. Include specific sets, reps, and rest periods.",
    topics: ["Build muscle mass", "Increase bench press", "Squat form check", "Strength program"],
  },
  {
    id: "cardio", name: "Dash Sarah", title: "Cardio & Endurance Specialist",
    specialty: "Running & Cycling", icon: Heart, color: "from-rose-500 to-pink-600",
    bio: "Marathon runner and cycling coach. Passionate about heart health and endurance.",
    systemPrompt: "You are Dash Sarah, a cardio and endurance specialist. You help people improve running, cycling, and overall cardiovascular fitness. Focus on heart rate zones, progressive overload, and recovery. Be energetic and encouraging. Include specific training plans with distances and paces.",
    topics: ["Start running", "5K training plan", "Improve stamina", "Heart rate zones"],
  },
  {
    id: "hiit", name: "Blaze Troy", title: "HIIT & Fat Loss Coach",
    specialty: "High-Intensity Training", icon: Flame, color: "from-orange-500 to-amber-600",
    bio: "CrossFit enthusiast. Specializes in torching calories and metabolic conditioning.",
    systemPrompt: "You are Blaze Troy, a HIIT and fat loss coach. You design high-intensity interval workouts that maximize calorie burn in minimal time. Be high-energy and push clients to their limits safely. Include work/rest ratios, exercise lists, and modifications for different fitness levels.",
    topics: ["Burn fat fast", "20-min HIIT workout", "Metabolic conditioning", "Home HIIT routine"],
  },
  {
    id: "yoga", name: "Zen Aria", title: "Yoga & Mobility Instructor",
    specialty: "Flexibility & Recovery", icon: Wind, color: "from-violet-500 to-purple-600",
    bio: "200hr RYT yoga teacher. Blends vinyasa flow with therapeutic mobility work.",
    systemPrompt: "You are Zen Aria, a certified yoga and mobility instructor. You help people improve flexibility, reduce stress, and recover from workouts through yoga, stretching, and breathwork. Be calm, supportive, and mindful. Include pose sequences, hold times, and breathing instructions.",
    topics: ["Morning yoga flow", "Improve flexibility", "Stress relief yoga", "Post-workout stretch"],
  },
  {
    id: "weightloss", name: "Burn Bella", title: "Weight Management Coach",
    specialty: "Fat Loss & Metabolism", icon: Zap, color: "from-pink-500 to-fuchsia-600",
    bio: "Nutrition-certified trainer. Focuses on sustainable fat loss and habit change.",
    systemPrompt: "You are Burn Bella, a weight management and fat loss coach. You combine exercise programming with nutrition guidance for sustainable weight loss. Be empathetic, practical, and science-based. Include calorie awareness, macro suggestions, and progressive workout plans. Emphasize consistency over perfection.",
    topics: ["Lose weight sustainably", "Boost metabolism", "Beginner fat loss plan", "Plateau breaking"],
  },
  {
    id: "recovery", name: "Care Carlos", title: "Recovery & Rehab Specialist",
    specialty: "Injury Prevention", icon: Activity, color: "from-teal-500 to-green-600",
    bio: "Physical therapy background. Helps clients train around injuries safely.",
    systemPrompt: "You are Care Carlos, a recovery and rehabilitation fitness specialist with a physical therapy background. You help people exercise safely with injuries, chronic pain, or mobility limitations. Be careful, thorough, and always recommend consulting a doctor for medical issues. Include modifications, gentle movements, and progressive loading.",
    topics: ["Knee-friendly exercises", "Lower back pain", "Post-injury rehab", "Gentle mobility work"],
  },
];

function TrainerChat({ trainer, avatar, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [patientContext, setPatientContext] = useState(null);
  const [consultationId, setConsultationId] = useState(null);
  const TIcon = trainer.icon;

  useEffect(() => {
    const loadContext = async () => {
      try {
        const res = await base44.functions.invoke("compilePatientContext", {
          service_type: "AI Fitness",
        });
        setPatientContext(res.data?.context || null);
      } catch (e) { console.error("Context load failed:", e); }
    };
    loadContext();
  }, []);

  const ensureConsultation = async () => {
    if (consultationId) return consultationId;
    try {
      const c = await base44.entities.Consultation.create({
        type: "ai_fitness",
        specialty: trainer.title,
        status: "in_progress",
        conversation_history: [],
        avatar_gender: avatar?.gender || null,
        avatar_race: avatar?.race || null,
      });
      setConsultationId(c.id);
      return c.id;
    } catch (e) { console.error(e); return null; }
  };

  const saveMessages = async (allMessages, cid) => {
    if (!cid) return;
    try {
      await base44.entities.Consultation.update(cid, {
        conversation_history: allMessages.map(m => ({ role: m.role, content: typeof m.content === "string" ? m.content.substring(0, 2000) : "" })),
      });
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const cid = await ensureConsultation();
      const history = [...messages, userMsg].map((m) => `${m.role === "user" ? "Client" : "Trainer"}: ${m.content}`).join("\n");
      const avatarContext = avatar ? `\n\nYou are presenting as a ${avatar.genderLabel} ${avatar.raceLabel} fitness trainer. Stay in character as this persona.` : "";
      const contextBlock = patientContext
        ? `\n\n## CLIENT HEALTH & FITNESS DATA\n${patientContext}\n\nReference their actual exercise history, vitals, and health data when giving advice.`
        : "";
      const behaviorPrompt = `\n\nBEHAVIOR: You are a REAL fitness professional, not an AI. Speak naturally with motivation and expertise. Reference their actual workout history, vitals, and health data when relevant. Never say "As an AI."`;
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${trainer.systemPrompt}${behaviorPrompt}${avatarContext}${contextBlock}\n\nConversation history:\n${history}\n\nClient: ${text}\n\nRespond as ${trainer.name}:`,
      });
      const assistantMsg = { role: "assistant", content: response };
      const allMessages = [...messages, userMsg, assistantMsg];
      setMessages((prev) => [...prev, assistantMsg]);
      saveMessages(allMessages, cid);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "assistant", content: "I'm having trouble responding right now. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[400px]">
      <Card className="p-4 mb-3 flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${trainer.color} flex items-center justify-center shrink-0`}>
          <TIcon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-sm">{trainer.name}</h3>
          <p className="text-xs text-muted-foreground">
            {avatar ? `${avatar.avatar} ${avatar.genderLabel} · ${avatar.raceLabel}` : trainer.title}
            {patientContext && " · Records connected"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>Back to Trainers</Button>
      </Card>

      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center mb-3">Ask {trainer.name} about:</p>
            {trainer.topics.map((topic) => (
              <button key={topic} onClick={() => sendMessage(topic)}
                className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition text-sm">
                {topic}
              </button>
            ))}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === "user" ? "bg-sky-600 text-white" : "bg-muted"}`}>
              {msg.role === "assistant" ? <ReactMarkdown className="prose prose-sm max-w-none">{msg.content}</ReactMarkdown> : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-xl"><Loader2 className="w-4 h-4 animate-spin text-sky-600" /></div>
          </div>
        )}
      </div>

      <div className="flex gap-2 items-end">
        <VoiceInputButton value={input} onChange={(val) => setInput(val)} />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder={`Ask ${trainer.name}...`}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring max-h-24"
        />
        <Button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} className="bg-sky-600 hover:bg-sky-700">
          Send
        </Button>
      </div>
    </div>
  );
}

function ClassCatalog({ user }) {
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [cls, enrs] = await Promise.all([
        base44.entities.FitnessClass.list("-created_date", 100),
        base44.entities.ClassEnrollment.filter({ status: "enrolled" }),
      ]);
      setClasses(cls);
      setEnrollments(enrs);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const isEnrolled = (classId) => enrollments.some((e) => e.class_id === classId && e.status === "enrolled");

  const handleEnroll = async (cls) => {
    try {
      if (isEnrolled(cls.id)) {
        await base44.entities.ClassEnrollment.updateMany(
          { class_id: cls.id, user_name: user?.full_name || "You", status: "enrolled" },
          { $set: { status: "cancelled" } }
        );
        await base44.entities.FitnessClass.update(cls.id, { current_participants: Math.max(0, (cls.current_participants || 0) - 1) });
        toast({ title: "Unenrolled", description: `You've left ${cls.class_name}.` });
      } else {
        await base44.entities.ClassEnrollment.create({
          class_id: cls.id, class_name: cls.class_name, trainer_name: cls.trainer_name,
          user_name: user?.full_name || "You", enrolled_date: format(new Date(), "yyyy-MM-dd"), status: "enrolled",
        });
        await base44.entities.FitnessClass.update(cls.id, { current_participants: (cls.current_participants || 0) + 1 });
        toast({ title: "Enrolled!", description: `You're signed up for ${cls.class_name}.` });
      }
      load();
    } catch (e) { console.error(e); toast({ title: "Failed to update enrollment", variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {classes.map((cls, i) => {
        const TIcon = typeIcons[cls.trainer_type] || Dumbbell;
        const color = typeColors[cls.trainer_type] || "from-sky-500 to-indigo-600";
        const enrolled = isEnrolled(cls.id);
        const full = (cls.current_participants || 0) >= (cls.max_participants || 20);
        return (
          <motion.div key={cls.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${color}`} />
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                    <TIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{cls.class_name}</h4>
                    <p className="text-xs text-muted-foreground">{cls.trainer_name}</p>
                  </div>
                  <Badge className={diffColors[cls.difficulty] || diffColors.intermediate}>{cls.difficulty}</Badge>
                </div>
                {cls.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{cls.description}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.duration_minutes}min</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{cls.schedule_day} {cls.schedule_time}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{cls.current_participants || 0}/{cls.max_participants || 20}</span>
                  {cls.calories_burn_estimate && <span className="flex items-center gap-1"><CalIcon className="w-3 h-3" />~{cls.calories_burn_estimate}cal</span>}
                </div>
                {cls.equipment_needed?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {cls.equipment_needed.map((eq) => (
                      <span key={eq} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{eq}</span>
                    ))}
                  </div>
                )}
                <Button
                  onClick={() => handleEnroll(cls)}
                  disabled={!enrolled && full}
                  variant={enrolled ? "outline" : "default"}
                  className={`w-full ${!enrolled && !full ? "bg-sky-600 hover:bg-sky-700" : ""} ${enrolled ? "border-emerald-300 text-emerald-700" : ""}`}
                >
                  {enrolled ? <><Check className="w-4 h-4 mr-1.5" /> Enrolled</> : full ? "Class Full" : "Enroll Now"}
                </Button>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function AIFitnessCenter() {
  const [user, setUser] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [avatar, setAvatar] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center mx-auto mb-3">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold">AI Fitness Center</h1>
          <p className="text-muted-foreground mt-1 text-sm">Train with AI personal trainers and join live fitness classes</p>
        </div>

        {selectedTrainer && avatar ? (
          <TrainerChat trainer={selectedTrainer} avatar={avatar} onBack={() => { setSelectedTrainer(null); setAvatar(null); }} />
        ) : selectedTrainer ? (
          <VirtualAvatarSelector serviceName={selectedTrainer.title} onSelect={setAvatar} />
        ) : (
          <Tabs defaultValue="trainers">
            <TabsList className="grid grid-cols-3 w-full max-w-lg mx-auto mb-6">
              <TabsTrigger value="trainers"><Dumbbell className="w-3.5 h-3.5 mr-1.5" />Trainers</TabsTrigger>
              <TabsTrigger value="planner"><Sparkles className="w-3.5 h-3.5 mr-1.5" />Planner</TabsTrigger>
              <TabsTrigger value="classes"><Users className="w-3.5 h-3.5 mr-1.5" />Classes</TabsTrigger>
            </TabsList>

            <TabsContent value="trainers">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trainers.map((trainer, i) => {
                  const TIcon = trainer.icon;
                  return (
                    <motion.div key={trainer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => setSelectedTrainer(trainer)}>
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${trainer.color} flex items-center justify-center mb-3`}>
                          <TIcon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="font-display font-bold text-sm">{trainer.name}</h3>
                        <p className="text-xs text-sky-600 font-medium">{trainer.title}</p>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{trainer.bio}</p>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {trainer.topics.slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200 mt-4">
                <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">AI trainer guidance is for general fitness purposes. Consult a healthcare provider before starting any exercise program, especially if you have medical conditions.</p>
              </div>
            </TabsContent>

            <TabsContent value="planner">
              <AIFitnessPlanner />
            </TabsContent>

            <TabsContent value="classes">
              <ClassCatalog user={user} />
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </div>
  );
}