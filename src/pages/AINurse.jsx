import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  HeartPulse, Send, Loader2, Pill, Activity, Moon,
  Calendar, Syringe, Shield, Dumbbell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import VoiceInputButton from "@/components/voice/VoiceInputButton";

const nurseTopics = [
  { label: "Daily Check-in", icon: HeartPulse, prompt: "I'd like to do my daily health check-in", color: "from-emerald-500 to-teal-600" },
  { label: "Medication Reminder", icon: Pill, prompt: "Help me review my medications", color: "from-blue-500 to-indigo-600" },
  { label: "Recovery Monitoring", icon: Activity, prompt: "I'm recovering from a procedure and need monitoring guidance", color: "from-violet-500 to-purple-600" },
  { label: "Sleep Coaching", icon: Moon, prompt: "I'm having trouble sleeping and need guidance", color: "from-indigo-500 to-blue-600" },
  { label: "Wellness Coaching", icon: Dumbbell, prompt: "I'd like some wellness and lifestyle coaching", color: "from-amber-500 to-orange-600" },
  { label: "Vaccination Reminders", icon: Syringe, prompt: "Help me check which vaccinations I might need", color: "from-rose-500 to-pink-600" },
];

export default function AINurse() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startChat = async (initialPrompt) => {
    setStarted(true);
    setLoading(true);
    const userMsg = { role: "user", content: initialPrompt };
    setMessages([userMsg]);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI Nurse assistant — warm, empathetic, and professional. You provide daily check-ins, recovery monitoring, medication reminders, wellness coaching, chronic disease support, surgery preparation guidance, post-discharge follow-up, and vaccination reminders.

You do NOT diagnose conditions. For medical concerns, recommend consulting the AI Doctor or a healthcare provider. Be supportive and caring.

Patient says: ${initialPrompt}

Respond helpfully and ask follow-up questions to provide personalized guidance.`
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
      const conversationText = newMessages.map((m) => `${m.role === "user" ? "Patient" : "AI Nurse"}: ${m.content}`).join("\n\n");
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI Nurse assistant. Continue this conversation with empathy and care. Don't diagnose. For medical issues, refer to the AI Doctor.

${conversationText}

Respond helpfully.`
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
              <HeartPulse className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold">AI Nurse</h1>
            <p className="text-muted-foreground mt-1 text-sm">Your personal wellness companion for daily support and care</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {nurseTopics.map((topic) => (
              <Card
                key={topic.label}
                className="p-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
                onClick={() => startChat(topic.prompt)}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${topic.color} flex items-center justify-center mb-3`}>
                  <topic.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{topic.label}</h3>
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <p className="text-sm font-medium mb-2">Or describe what you need help with:</p>
            <div className="flex gap-2">
              <Textarea
                placeholder="How can the AI Nurse help you today?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                className="resize-none flex-1"
              />
              <VoiceInputButton value={input} onChange={setInput} />
              <Button onClick={() => startChat(input)} disabled={!input.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
      <div className="p-4 border-b bg-white flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <HeartPulse className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-sm">AI Nurse</h2>
          <p className="text-xs text-muted-foreground">Here to support you</p>
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
                  ? "bg-emerald-600 text-white rounded-br-md"
                  : "bg-white border rounded-bl-md shadow-sm"
              }`}>
                {msg.role === "user" ? (
                  <p>{msg.content}</p>
                ) : (
                  <ReactMarkdown className="prose prose-sm max-w-none">{msg.content}</ReactMarkdown>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-bl-md p-3.5 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={1}
            className="resize-none flex-1"
          />
          <VoiceInputButton value={input} onChange={setInput} disabled={loading} />
          <Button onClick={sendMessage} disabled={!input.trim() || loading} className="bg-emerald-600 hover:bg-emerald-700">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}