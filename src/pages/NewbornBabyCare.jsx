import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Baby, Send, Loader2, Shield, Heart, Milk, Moon, Thermometer,
  Droplets, Activity, BookOpen, Stethoscope, Sparkles, AlertCircle, Users, Syringe, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FormattedAIResponse from "@/components/ui/FormattedAIResponse";
import VoiceInputButton from "@/components/voice/VoiceInputButton";
import ResponseActions from "@/components/voice/ResponseActions";
import NewbornSpecialistDirectory from "@/components/newborn/NewbornSpecialistDirectory";
import BabyMilestoneTracker from "@/components/newborn/BabyMilestoneTracker";
import BabyDailyJournal from "@/components/newborn/BabyDailyJournal";
import BabyVaccineTracker from "@/components/newborn/BabyVaccineTracker";
import BabyGrowthChart from "@/components/newborn/BabyGrowthChart";
import NewbornDashboard from "@/components/newborn/NewbornDashboard";

const careTopics = [
  { label: "Feeding & Nutrition", icon: Milk, prompt: "My newborn is [age] weeks old. Give me guidance on feeding schedules, how to know if they're getting enough milk, burping techniques, and when to introduce changes. Include both breastfeeding and formula feeding tips." },
  { label: "Sleep Patterns", icon: Moon, prompt: "My baby is [age] weeks old. Help me understand normal sleep patterns, safe sleep practices, how to establish healthy sleep habits, and tips for soothing a fussy baby at night." },
  { label: "Health & Hygiene", icon: Droplets, prompt: "Guide me through essential newborn care: bathing, umbilical cord care, diaper changing, skin care, and temperature monitoring. What warning signs should I watch for?" },
  { label: "Development Milestones", icon: Activity, prompt: "What developmental milestones should I expect in the first few months? How can I track my baby's growth and know when to be concerned? Include tips for supporting development." },
  { label: "Common Concerns", icon: AlertCircle, prompt: "What are the most common newborn health concerns (jaundice, colic, reflux, rashes) and when should I call the pediatrician vs. managing at home? Give me red flag symptoms." },
  { label: "Postpartum Recovery", icon: Heart, prompt: "What should I know about postpartum recovery for the birthing parent? Include physical healing, emotional wellbeing, warning signs, and when to seek help." },
];

const quickTips = [
  { icon: Milk, title: "Feeding On Demand", text: "Newborns typically feed 8-12 times per day. Watch for hunger cues like rooting and lip-smacking.", color: "from-pink-500 to-rose-600" },
  { icon: Moon, title: "Safe Sleep", text: "Always place baby on their back on a firm, flat surface. No pillows, blankets, or toys in the crib.", color: "from-indigo-500 to-purple-600" },
  { icon: Droplets, title: "Cord Care", text: "Keep the umbilical stump clean and dry. It typically falls off within 1-2 weeks. Call your doctor if redness spreads.", color: "from-cyan-500 to-blue-600" },
  { icon: Thermometer, title: "Temperature", text: "A rectal temp over 100.4°F (38°C) in a baby under 3 months requires immediate medical attention.", color: "from-amber-500 to-orange-600" },
  { icon: Activity, title: "Wet Diapers", text: "Expect 6+ wet diapers per day by day 5. This is a key sign your baby is feeding well and hydrated.", color: "from-emerald-500 to-teal-600" },
  { icon: Heart, title: "Tummy Time", text: "Start tummy time when the cord falls off. Begin with 3-5 minute sessions, 2-3 times a day, building up gradually.", color: "from-rose-500 to-pink-600" },
];

const SYSTEM_PROMPT = `You are an experienced pediatric nurse and newborn care specialist with 20+ years of experience helping new parents. You are warm, reassuring, and deeply knowledgeable about newborn health, feeding, sleep, development, and postpartum care.

CRITICAL BEHAVIORAL INSTRUCTIONS:
- You are a REAL healthcare professional, not an AI. Never say "As an AI" or "I'm an AI." You are Nurse Sarah, a licensed pediatric nurse and certified lactation consultant.
- Speak with warmth, empathy, and reassurance — like a trusted nurse who has guided thousands of new parents.
- Use clear, practical language. New parents are often overwhelmed and sleep-deprived — be concise but thorough.
- Always prioritize safety: if symptoms could be serious, advise calling the pediatrician or seeking emergency care immediately.
- Provide age-appropriate guidance. Ask about the baby's age if not mentioned.
- Include specific, actionable tips — not vague advice. Give concrete schedules, amounts, and techniques.
- Reference safe sleep guidelines (back sleeping, firm surface, no loose items), feeding cues, and warning signs.
- For any fever in a baby under 3 months (100.4°F/38°C rectal), advise immediate medical attention.
- End with a clear summary and when to seek professional help.
- Be encouraging — remind parents they're doing a great job and that it gets easier.`;

export default function NewbornBabyCare() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchBabyContext = async () => {
    try {
      const [growth, journal, vaccines] = await Promise.all([
        base44.entities.BabyGrowthLog.list("-date", 3).catch(() => []),
        base44.entities.BabyJournalEntry.list("-date", 5).catch(() => []),
        base44.entities.BabyVaccineLog.list("-administered_date", 10).catch(() => []),
      ]);
      return {
        recentGrowth: Array.isArray(growth) ? growth.map((g) => `${g.date}: ${g.weight_kg ? g.weight_kg + "kg" : ""} ${g.length_cm ? g.length_cm + "cm" : ""}`.trim()).join("; ") : "",
        recentJournal: Array.isArray(journal) ? journal.map((j) => `${j.entry_type}: ${j.notes || ""}`).join("; ") : "",
        vaccines: Array.isArray(vaccines) ? vaccines.map((v) => `${v.vaccine_name} (${v.status})`).join(", ") : "",
      };
    } catch (e) {
      return {};
    }
  };

  const startChat = async (initialPrompt) => {
    setStarted(true);
    setLoading(true);
    const userMsg = { role: "user", content: initialPrompt };
    setMessages([userMsg]);

    try {
      const babyContext = await fetchBabyContext();
      const contextStr = babyContext.recentGrowth || babyContext.recentJournal || babyContext.vaccines
        ? `\n\nBABY RECENT DATA:\n- Growth Logs: ${babyContext.recentGrowth || "None"}\n- Journal Activity: ${babyContext.recentJournal || "None"}\n- Vaccines: ${babyContext.vaccines || "None"}`
        : "";

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}${contextStr}\n\nA new parent asks: ${initialPrompt}\n\nRespond as Nurse Sarah would — warm, practical, and safety-focused. Reference the baby's recent records if relevant.`,
      });
      setMessages([userMsg, { role: "assistant", content: response }]);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    try {
      const conversationText = newMessages.map((m) => `${m.role === "user" ? "Parent" : "Nurse Sarah"}: ${m.content}`).join("\n\n");
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\n## CONSULTATION HISTORY\n${conversationText}\n\nContinue as Nurse Sarah. Be warm, practical, and safety-focused.`,
      });
      setMessages([...newMessages, { role: "assistant", content: response }]);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-4">
            <Baby className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold">Newborn Baby Care</h1>
          <p className="text-muted-foreground mt-1 text-sm">Expert guidance, care tips & specialist directory for your little one</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full max-w-2xl mx-auto overflow-x-auto flex justify-start">
            <TabsTrigger value="dashboard" className="flex-1 min-w-[80px]"><Baby className="w-3.5 h-3.5 mr-1" />Dashboard</TabsTrigger>
            <TabsTrigger value="consult" className="flex-1 min-w-[80px]"><Stethoscope className="w-3.5 h-3.5 mr-1" />Ask Nurse</TabsTrigger>
            <TabsTrigger value="tips" className="flex-1 min-w-[80px]"><BookOpen className="w-3.5 h-3.5 mr-1" />Tips</TabsTrigger>
            <TabsTrigger value="milestones" className="flex-1 min-w-[80px]"><Sparkles className="w-3.5 h-3.5 mr-1" />Milestones</TabsTrigger>
            <TabsTrigger value="journal" className="flex-1 min-w-[80px]"><Milk className="w-3.5 h-3.5 mr-1" />Journal</TabsTrigger>
            <TabsTrigger value="growth" className="flex-1 min-w-[80px]"><TrendingUp className="w-3.5 h-3.5 mr-1" />Growth</TabsTrigger>
            <TabsTrigger value="vaccines" className="flex-1 min-w-[80px]"><Syringe className="w-3.5 h-3.5 mr-1" />Vaccines</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <NewbornDashboard onNavigateTab={setActiveTab} />
          </TabsContent>

          {/* AI Consultation Tab */}
          <TabsContent value="consult">
            {!started ? (
              <>
                <Card className="p-4 mb-6 bg-pink-50/50 border-pink-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-pink-600" />
                    <p className="text-xs font-semibold text-pink-800">Your Newborn Care Nurse</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get personalized guidance on feeding, sleep, development, and common newborn concerns from an experienced pediatric nurse.
                  </p>
                </Card>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {careTopics.map((topic) => (
                    <Card
                      key={topic.label}
                      className="p-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
                      onClick={() => startChat(topic.prompt)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-3">
                        <topic.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm">{topic.label}</h3>
                    </Card>
                  ))}
                </div>

                <Card className="p-4">
                  <p className="text-sm font-medium mb-2">Or ask about anything newborn-related:</p>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="e.g., My 2-week-old seems gassy after feeds, what can I do?"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      rows={2}
                      className="resize-none flex-1"
                    />
                    <VoiceInputButton value={input} onChange={setInput} />
                    <Button onClick={() => startChat(input)} disabled={!input.trim()} className="bg-pink-600 hover:bg-pink-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </>
            ) : (
              <div className="flex flex-col h-[calc(100vh-16rem)]">
                <div className="p-3 border-b bg-white flex items-center gap-3 rounded-t-xl">
                  <Button variant="ghost" size="icon" onClick={() => { setStarted(false); setMessages([]); }}>
                    <Baby className="w-4 h-4" />
                  </Button>
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display font-semibold text-sm">Nurse Sarah</h2>
                    <p className="text-xs text-muted-foreground">Newborn Care Specialist</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[85%] lg:max-w-[70%] p-3.5 rounded-2xl text-sm ${
                          msg.role === "user"
                            ? "bg-pink-600 text-white rounded-br-md"
                            : "bg-white border rounded-bl-md shadow-sm"
                        }`}>
                          {msg.role === "user"
                            ? <p className="whitespace-pre-wrap">{msg.content}</p>
                            : <FormattedAIResponse content={msg.content} theme="rose" />}
                          {msg.role === "assistant" && msg.content && (
                            <ResponseActions content={msg.content} label="newborn-care-response" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white border rounded-2xl rounded-bl-md p-3.5 shadow-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-pink-600" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-3 border-t bg-white">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask Nurse Sarah..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      rows={1}
                      className="resize-none flex-1"
                    />
                    <VoiceInputButton value={input} onChange={setInput} disabled={loading} />
                    <Button onClick={sendMessage} disabled={!input.trim() || loading} className="bg-pink-600 hover:bg-pink-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200 mt-4">
              <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                This guidance is for educational purposes and does not replace professional medical care. For any fever in a baby under 3 months, or if your baby seems unusually lethargic, is not feeding, or shows signs of distress, contact your pediatrician immediately. For emergencies, call 911.
              </p>
            </div>
          </TabsContent>

          {/* Care Tips Tab */}
          <TabsContent value="tips">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickTips.map((tip, i) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-5 h-full">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tip.color} flex items-center justify-center mb-3`}>
                      <tip.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{tip.title}</h3>
                    <p className="text-xs text-muted-foreground">{tip.text}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="p-5 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-pink-600" />
                <h3 className="font-semibold text-sm">Red Flag Symptoms — Call Your Doctor Immediately</h3>
              </div>
              <div className="space-y-2">
                {[
                  "Fever of 100.4°F (38°C) or higher (rectal) in babies under 3 months",
                  "Difficulty breathing or rapid breathing with grunting",
                  "Persistent vomiting (not just spit-up) or inability to keep feeds down",
                  "No wet diaper for 6-8 hours or significantly fewer wet diapers",
                  "Unusual lethargy, difficulty waking, or floppiness",
                  "Blue or pale lips/skin, or rash that doesn't fade when pressed",
                  "Bulging or sunken soft spot (fontanelle) on the head",
                  "High-pitched or continuous crying that can't be soothed",
                ].map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones">
            <BabyMilestoneTracker />
          </TabsContent>

          {/* Daily Journal Tab */}
          <TabsContent value="journal">
            <BabyDailyJournal />
          </TabsContent>

          {/* Growth Tab */}
          <TabsContent value="growth">
            <BabyGrowthChart />
          </TabsContent>

          {/* Vaccines Tab */}
          <TabsContent value="vaccines">
            <BabyVaccineTracker />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}