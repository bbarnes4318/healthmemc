import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart, Eye, Brain, Bone, Baby, User, Users, Smile, Apple,
  Send, Loader2, ArrowLeft, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const specialties = [
  { name: "Cardiology", icon: Heart, color: "from-red-500 to-rose-600", desc: "Heart & cardiovascular" },
  { name: "Dermatology", icon: Eye, color: "from-amber-500 to-orange-600", desc: "Skin conditions" },
  { name: "Neurology", icon: Brain, color: "from-violet-500 to-purple-600", desc: "Brain & nervous system" },
  { name: "Orthopedics", icon: Bone, color: "from-sky-500 to-blue-600", desc: "Bones, joints & muscles" },
  { name: "Pediatrics", icon: Baby, color: "from-pink-500 to-rose-600", desc: "Children's health" },
  { name: "Women's Health", icon: User, color: "from-fuchsia-500 to-pink-600", desc: "OB/GYN & wellness" },
  { name: "Men's Health", icon: Users, color: "from-cyan-500 to-teal-600", desc: "Urology & wellness" },
  { name: "Mental Health", icon: Smile, color: "from-emerald-500 to-green-600", desc: "Psychology & psychiatry" },
  { name: "Nutrition", icon: Apple, color: "from-lime-500 to-green-600", desc: "Diet & nutrition" },
];

export default function Specialists() {
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConsultation = async (specialty) => {
    setSelectedSpecialty(specialty);
    setLoading(true);
    const greetMsg = { role: "assistant", content: `Welcome! I'm your AI ${specialty.name} specialist. How can I help you today? Please describe your symptoms or concerns.` };
    setMessages([greetMsg]);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const conversationText = newMessages.map((m) => `${m.role === "user" ? "Patient" : `AI ${selectedSpecialty.name} Specialist`}: ${m.content}`).join("\n\n");
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI ${selectedSpecialty.name} specialist. Use focused clinical pathways for ${selectedSpecialty.name}. Be thorough but accessible. Recommend referral to a human specialist when appropriate. Do not provide definitive diagnoses.

${conversationText}

Continue the conversation as a ${selectedSpecialty.name} specialist.`
      });
      setMessages([...newMessages, { role: "assistant", content: response }]);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  if (!selectedSpecialty) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold">AI Specialists</h1>
            <p className="text-muted-foreground mt-1 text-sm">Select a specialty for focused clinical guidance</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {specialties.map((spec) => (
              <Card
                key={spec.name}
                className="p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
                onClick={() => startConsultation(spec)}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${spec.color} flex items-center justify-center mb-3`}>
                  <spec.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{spec.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{spec.desc}</p>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
      <div className="p-4 border-b bg-white flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => { setSelectedSpecialty(null); setMessages([]); }}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedSpecialty.color} flex items-center justify-center`}>
          <selectedSpecialty.icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-sm">AI {selectedSpecialty.name}</h2>
          <p className="text-xs text-muted-foreground">Specialist consultation</p>
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
                  ? "bg-violet-600 text-white rounded-br-md"
                  : "bg-white border rounded-bl-md shadow-sm"
              }`}>
                {msg.role === "user" ? <p>{msg.content}</p> : <ReactMarkdown className="prose prose-sm max-w-none">{msg.content}</ReactMarkdown>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-bl-md p-3.5 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            placeholder="Describe your symptoms..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={1}
            className="resize-none flex-1"
          />
          <Button onClick={sendMessage} disabled={!input.trim() || loading} className="bg-violet-600 hover:bg-violet-700">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}