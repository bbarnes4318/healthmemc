import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  UserRound, Send, Loader2, Shield, Activity, Pill, FileText,
  TrendingUp, Stethoscope, ArrowLeft, Sparkles, Heart
} from "lucide-react";
import VoiceInputButton from "@/components/voice/VoiceInputButton";
import ResponseActions from "@/components/voice/ResponseActions";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const topics = [
  { label: "Medication Review", icon: Pill, prompt: "Review all my current medications. Are there any interactions, timing issues, or concerns I should discuss with my doctor?" },
  { label: "Interpret My Labs", icon: FileText, prompt: "Look at my recent lab results and vitals. Help me understand what the values mean and if anything needs attention." },
  { label: "Health Trends", icon: TrendingUp, prompt: "Analyze my recent vital signs and wellness data. What trends do you see and what should I focus on?" },
  { label: "Preventive Care", icon: Shield, prompt: "Based on my health profile, what preventive care, screenings, or lifestyle changes should I prioritize?" },
];

export default function AIPersonalPhysician() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [healthContext, setHealthContext] = useState("");
  const [loadingContext, setLoadingContext] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const [profiles, meds, vitals, records, journals] = await Promise.all([
          base44.entities.HealthProfile.list("-created_date", 1),
          base44.entities.Medication.filter({ active: true }),
          base44.entities.VitalRecord.list("-created_date", 15),
          base44.entities.MedicalRecord.list("-date", 5),
          base44.entities.WellnessJournal.list("-date", 7),
        ]);

        const profile = profiles[0] || {};
        const activeMeds = meds.filter((m) => m.active);

        const ctx = `
PATIENT HEALTH SUMMARY:
- Age: ${profile.age || "Unknown"}
- Biological sex: ${profile.biological_sex || "Unknown"}
- Height: ${profile.height || "Unknown"} cm
- Weight: ${profile.weight || "Unknown"} kg
- Blood type: ${profile.blood_type || "Unknown"}
- Known conditions: ${profile.conditions || "None recorded"}
- Allergies: ${profile.allergies || "None recorded"}
- Health score: ${profile.health_score || "Not calculated"}

CURRENT MEDICATIONS (${activeMeds.length}):
${activeMeds.map((m) => `- ${m.name} ${m.dosage}, ${m.frequency}, times: ${(m.time_of_day || []).join(", ") || "unspecified"}, prescribed by: ${m.prescribing_provider || "unknown"}`).join("\n") || "None"}

RECENT VITALS (last ${vitals.length}):
${vitals.map((v) => `- ${v.type}: ${v.value}${v.secondary_value ? "/" + v.secondary_value : ""} ${v.unit || ""} on ${new Date(v.recorded_at || v.created_date).toLocaleDateString()}`).join("\n") || "None"}

RECENT MEDICAL RECORDS (last ${records.length}):
${records.map((r) => `- ${r.title} (${r.category}, ${r.date ? new Date(r.date).toLocaleDateString() : "no date"})${r.provider ? " - " + r.provider : ""}${r.notes ? ": " + r.notes.substring(0, 100) : ""}`).join("\n") || "None"}

RECENT WELLNESS (last ${journals.length}):
${journals.map((j) => `- ${j.date}: mood=${j.mood}, sleep=${j.sleep_quality} (${j.sleep_hours || "?"}h), stress=${j.stress_level}`).join("\n") || "None"}
`;
        setHealthContext(ctx);
      } catch (e) { console.error(e); }
      setLoadingContext(false);
    };
    loadContext();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const systemPrompt = `You are an AI Personal Physician — a knowledgeable, empathetic health companion with access to the patient's complete health history. You provide personalized guidance based on their actual medical data. You are NOT a replacement for a real doctor, but you help patients understand their health, interpret results, identify concerns, and prepare for doctor visits. Always reference the patient's specific data when relevant. Be clear about when something requires professional medical attention.

${healthContext}`;

  const startChat = async (initialPrompt) => {
    setStarted(true);
    setLoading(true);
    const userMsg = { role: "user", content: initialPrompt };
    setMessages([userMsg]);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nPatient asks: ${initialPrompt}\n\nProvide a thorough, personalized response referencing their specific health data. Ask follow-up questions if needed.`,
        model: "claude_sonnet_4_6",
      });
      setMessages([userMsg, { role: "assistant", content: response }]);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const conversationText = newMessages.map((m) => `${m.role === "user" ? "Patient" : "AI Physician"}: ${m.content}`).join("\n\n");
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\n${conversationText}\n\nContinue the conversation as the AI Personal Physician. Reference the patient's specific health data when relevant.`,
        model: "claude_sonnet_4_6",
      });
      setMessages([...newMessages, { role: "assistant", content: response }]);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  if (!started) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold">AI Personal Physician</h1>
            <p className="text-muted-foreground mt-1 text-sm">Your personalized health companion with full access to your medical history</p>
          </div>

          {loadingContext ? (
            <Card className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </Card>
          ) : (
            <>
              <Card className="p-4 mb-6 bg-indigo-50/50 border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs font-semibold text-indigo-800">Health Context Loaded</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your physician has access to your health profile, {healthContext.match(/CURRENT MEDICATIONS \((\d+)\)/)?.[1] || 0} active medications,
                  recent vitals, medical records, and wellness data.
                </p>
              </Card>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {topics.map((topic) => (
                  <Card
                    key={topic.label}
                    className="p-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
                    onClick={() => startChat(topic.prompt)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3">
                      <topic.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm">{topic.label}</h3>
                  </Card>
                ))}
              </div>

              <Card className="p-4">
                <p className="text-sm font-medium mb-2">Or ask your physician anything:</p>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="What would you like to discuss with your physician?"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={2}
                    className="resize-none flex-1"
                  />
                  <VoiceInputButton value={input} onChange={setInput} />
                  <Button onClick={() => startChat(input)} disabled={!input.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200 mt-4">
                <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">
                  This AI physician has access to your health records for personalized guidance. It does not replace professional medical advice. For emergencies, call 911.
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
      <div className="p-4 border-b bg-white flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => { setStarted(false); setMessages([]); }}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-sm">AI Personal Physician</h2>
          <p className="text-xs text-muted-foreground">Personalized consultation</p>
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
                  ? "bg-indigo-600 text-white rounded-br-md"
                  : "bg-white border rounded-bl-md shadow-sm"
              }`}>
                {msg.role === "user"
                  ? <p>{msg.content}</p>
                  : <ReactMarkdown className="prose prose-sm max-w-none">{msg.content}</ReactMarkdown>}
                {msg.role === "assistant" && msg.content && (
                  <ResponseActions content={msg.content} label="personal-physician-response" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-bl-md p-3.5 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            placeholder="Ask your physician..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={1}
            className="resize-none flex-1"
          />
          <VoiceInputButton value={input} onChange={setInput} disabled={loading} />
          <Button onClick={sendMessage} disabled={!input.trim() || loading} className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}