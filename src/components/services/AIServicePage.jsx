import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, ArrowLeft, Shield } from "lucide-react";
import VoiceInputButton from "@/components/voice/VoiceInputButton";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function AIServicePage({ config }) {
  const { title, subtitle, icon: Icon, color, btnClass, textColor, systemPrompt, topics, disclaimer } = config;
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
        prompt: `${systemPrompt}\n\nPatient says: ${initialPrompt}\n\nRespond helpfully and ask follow-up questions to provide personalized guidance.`
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
      const conversationText = newMessages.map((m) => `${m.role === "user" ? "Patient" : `AI ${title}`}: ${m.content}`).join("\n\n");
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\n${conversationText}\n\nContinue the conversation as ${title}.`
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
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-4`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold">{title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {topics.map((topic) => (
              <Card
                key={topic.label}
                className="p-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
                onClick={() => startChat(topic.prompt)}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                  <topic.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{topic.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{topic.desc}</p>
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <p className="text-sm font-medium mb-2">Or describe what you need help with:</p>
            <div className="flex gap-2">
              <Textarea
                placeholder={`How can ${title} help you?`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                className="resize-none flex-1"
              />
              <VoiceInputButton value={input} onChange={setInput} />
              <Button onClick={() => startChat(input)} disabled={!input.trim()} className={btnClass}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {disclaimer && (
            <div className="flex items-start gap-2 p-4 bg-sky-50 rounded-xl border border-sky-200 mt-4">
              <Shield className={`w-4 h-4 ${textColor} mt-0.5 shrink-0`} />
              <p className="text-xs text-sky-800">{disclaimer}</p>
            </div>
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
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-sm">{title}</h2>
          <p className="text-xs text-muted-foreground">AI Consultation</p>
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
                  ? `bg-gradient-to-br ${color} text-white rounded-br-md`
                  : "bg-white border rounded-bl-md shadow-sm"
              }`}>
                {msg.role === "user"
                  ? <p>{msg.content}</p>
                  : <ReactMarkdown className="prose prose-sm max-w-none">{msg.content}</ReactMarkdown>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-bl-md p-3.5 shadow-sm">
              <Loader2 className={`w-4 h-4 animate-spin ${textColor}`} />
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
          <Button onClick={sendMessage} disabled={!input.trim() || loading} className={btnClass}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}