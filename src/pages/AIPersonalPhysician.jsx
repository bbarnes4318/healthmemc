import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Pill, FileText, TrendingUp, Shield, Send, Loader2,
  Stethoscope, ArrowLeft, Heart, Database, Sparkles, UserCheck
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

const SYSTEM_PROMPT = `You are a Personal Physician — a deeply knowledgeable, warm, and experienced doctor who has been this patient's trusted physician for years. You have complete access to their medical history, medications, vitals, lab results, symptoms, and wellness data.

CRITICAL BEHAVIORAL INSTRUCTIONS:
- You are a REAL doctor, not an AI. Never say "As an AI" or "I'm an AI." You are Dr. Smith (or adapt to the patient's preference), a board-certified internist with 20+ years of experience.
- Speak with genuine warmth and concern — like a doctor who remembers their patient and cares about their wellbeing.
- Use natural, conversational medical language. Say things like "Let me pull up your records..." "I see from your last visit..." "Based on your blood pressure trends..." "I'm a bit concerned about..."
- ALWAYS reference specific data from the patient's records when relevant. Mention their medications by name, cite their actual vital readings, reference previous symptoms or consultations.
- Ask the questions a real doctor would: "How long has this been going on?" "Does anything make it better?" "Are you experiencing any other symptoms?"
- Provide specific, personalized guidance — not generic health advice. Tailor every recommendation to their actual conditions, medications, and data.
- When interpreting labs, reference their actual values and explain what they mean in plain language.
- Flag concerning trends: "I notice your blood pressure has been trending up over the last few readings..."
- End consultations with a clear summary, recommendations, and next steps — just like a real doctor's visit summary.
- If something needs urgent attention, be direct: "I want you to schedule an appointment with your cardiologist this week."
- Remember and reference prior conversations — "Last time we talked about your cholesterol..."`;

export default function AIPersonalPhysician() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [patientContext, setPatientContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [dataPoints, setDataPoints] = useState(0);
  const [consultationId, setConsultationId] = useState(null);
  const [secondOpinionLoading, setSecondOpinionLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const res = await base44.functions.invoke("compilePatientContext", {
          service_type: "AI Personal Physician",
        });
        setPatientContext(res.data?.context || null);
        const dp = res.data?.data_points;
        if (dp) {
          setDataPoints(Object.values(dp).reduce((s, v) => s + v, 0));
        }
      } catch (e) {
        console.error("Failed to load patient context:", e);
      }
      setContextLoading(false);
    };
    loadContext();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createConsultation = async (initialPrompt) => {
    try {
      const consultation = await base44.entities.Consultation.create({
        type: "ai_personal_physician",
        specialty: "Personal Physician",
        status: "in_progress",
        symptoms: initialPrompt?.substring(0, 500),
        conversation_history: [],
        patient_context_summary: patientContext?.substring(0, 2000) || null,
        data_points_used: dataPoints,
      });
      setConsultationId(consultation.id);
    } catch (e) {
      console.error("Failed to create consultation:", e);
    }
  };

  const updateConsultation = async (allMessages) => {
    if (!consultationId) return;
    try {
      await base44.entities.Consultation.update(consultationId, {
        conversation_history: allMessages.map(m => ({ role: m.role, content: typeof m.content === "string" ? m.content.substring(0, 2000) : "" })),
      });
    } catch (e) {
      console.error("Failed to update consultation:", e);
    }
  };

  const finalizeConsultation = async (allMessages) => {
    if (!consultationId) return;
    try {
      const conversationText = allMessages.map(m => `${m.role === "user" ? "Patient" : "Physician"}: ${m.content}`).join("\n\n");
      const summaryRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a concise clinical visit summary from this consultation. Include: chief complaint, assessment, recommendations, and follow-up plan.\n\nTranscript:\n${conversationText}`,
      });
      await base44.entities.Consultation.update(consultationId, {
        status: "completed",
        conversation_history: allMessages.map(m => ({ role: m.role, content: typeof m.content === "string" ? m.content.substring(0, 2000) : "" })),
        report: { summary: typeof summaryRes === "string" ? summaryRes.substring(0, 3000) : "" },
      });
    } catch (e) {
      console.error("Failed to finalize consultation:", e);
    }
  };

  const startChat = async (initialPrompt) => {
    setStarted(true);
    setLoading(true);
    const userMsg = { role: "user", content: initialPrompt };
    setMessages([userMsg]);
    await createConsultation(initialPrompt);

    try {
      const contextBlock = patientContext
        ? `\n\n## PATIENT MEDICAL RECORDS (Complete History)\n${patientContext}`
        : "";
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}${contextBlock}\n\nPatient says: ${initialPrompt}\n\nRespond as their personal physician would — with warmth, expertise, and references to their specific medical history.`,
        model: "claude_sonnet_4_6",
      });
      const assistantMsg = { role: "assistant", content: response };
      const allMessages = [userMsg, assistantMsg];
      setMessages(allMessages);
      updateConsultation(allMessages);
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
      const conversationText = newMessages.map((m) => `${m.role === "user" ? "Patient" : "Physician"}: ${m.content}`).join("\n\n");
      const contextBlock = patientContext
        ? `\n\n## PATIENT MEDICAL RECORDS\n${patientContext}`
        : "";
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}${contextBlock}\n\n## CONSULTATION HISTORY\n${conversationText}\n\nContinue as their personal physician. Reference their specific data when relevant.`,
        model: "claude_sonnet_4_6",
      });
      const assistantMsg = { role: "assistant", content: response };
      const allMessages = [...newMessages, assistantMsg];
      setMessages(allMessages);
      updateConsultation(allMessages);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const getSecondOpinion = async () => {
    if (messages.length < 2 || secondOpinionLoading) return;
    setSecondOpinionLoading(true);
    const separator = { role: "assistant", content: "🔄 **— Independent Second Opinion —**" };
    setMessages((prev) => [...prev, separator]);

    try {
      const conversationText = messages
        .filter((m) => m.content && !m.content.startsWith("🔄"))
        .map((m) => `${m.role === "user" ? "Patient" : "Physician"}: ${m.content}`)
        .join("\n\n");
      const contextBlock = patientContext
        ? `\n\n## PATIENT MEDICAL RECORDS\n${patientContext}`
        : "";
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an independent physician providing a SECOND OPINION. You have not seen this patient before. Review the following consultation transcript and provide your own independent assessment.

IMPORTANT:
- Analyze the case fresh, as if you are a different doctor reviewing it for the first time.
- Confirm or disagree with the initial assessment where appropriate. Be honest if you have a different view.
- Highlight anything the first opinion may have missed — alternative diagnoses, medication interactions, additional tests to consider.
- Reference the patient's actual medical records when relevant.
- Structure your response clearly: your assessment, where you agree/disagree with the first opinion, and your additional recommendations.
- Speak as a real, experienced physician would — warm, professional, and thorough.

${contextBlock}

## CONSULTATION TRANSCRIPT
${conversationText}

Provide your independent second opinion:`,
        model: "claude_sonnet_4_6",
      });
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      const allMessages = [...messages, separator, { role: "assistant", content: response }];
      updateConsultation(allMessages);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "I wasn't able to generate a second opinion at this time. Please try again." }]);
    }
    setSecondOpinionLoading(false);
  };

  const handleEndConsultation = () => {
    if (messages.length > 1) finalizeConsultation(messages);
    setStarted(false);
    setMessages([]);
    setConsultationId(null);
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
            <p className="text-muted-foreground mt-1 text-sm">Your trusted health companion with full access to your medical history</p>
          </div>

          {contextLoading ? (
            <Card className="p-8 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs text-muted-foreground">Loading your complete medical records...</p>
            </Card>
          ) : (
            <>
              <Card className="p-4 mb-6 bg-indigo-50/50 border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs font-semibold text-indigo-800">Full Medical Records Connected</p>
                  {dataPoints > 0 && (
                    <Badge variant="outline" className="text-[10px] bg-white">{dataPoints} data points</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your physician has access to your complete health profile — medications, vitals, lab results, symptoms, surgical history, immunizations, wellness journals, nutrition, exercise, and previous consultations.
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
                  Your AI physician has access to your health records for personalized guidance. It does not replace professional medical advice. For emergencies, call 911.
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
        <Button variant="ghost" size="icon" onClick={handleEndConsultation}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="font-display font-semibold text-sm">Personal Physician</h2>
          <p className="text-xs text-muted-foreground">
            {dataPoints > 0 ? `${dataPoints} records accessed` : "Consultation in progress"}
          </p>
        </div>
        {consultationId && (
          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">
            <Sparkles className="w-3 h-3 mr-1" /> Auto-saving
          </Badge>
        )}
        {messages.length >= 2 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs shrink-0"
            onClick={getSecondOpinion}
            disabled={secondOpinionLoading || loading}
          >
            {secondOpinionLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5 mr-1.5" />}
            2nd Opinion
          </Button>
        )}
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