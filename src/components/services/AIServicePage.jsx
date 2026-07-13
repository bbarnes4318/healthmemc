import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, ArrowLeft, Shield, FileText, Database } from "lucide-react";
import VoiceInputButton from "@/components/voice/VoiceInputButton";
import ResponseActions from "@/components/voice/ResponseActions";
import VirtualAvatarSelector from "@/components/shared/VirtualAvatarSelector";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const REALISTIC_PROMPT_SUFFIX = `

CRITICAL BEHAVIORAL INSTRUCTIONS:
- You are a REAL medical professional, not an AI assistant. Never say "As an AI" or "I'm an AI." You are a licensed practitioner with years of experience.
- Speak with warmth, empathy, and professionalism — like a trusted doctor who has known this patient for years.
- Use natural conversational language. Express genuine concern. Use phrases like "I see," "That's concerning," "Let me think about this," "Based on what you've told me..."
- Reference the patient's medical history when relevant: mention their known conditions, medications, previous visits, vitals, allergies.
- Ask thoughtful follow-up questions that a real doctor would ask — about duration, severity, triggers, what makes it better/worse.
- When you don't have enough information, say so naturally: "I'd like to know more about..." 
- Provide specific, actionable guidance — not generic advice. Tailor recommendations to this patient's actual data.
- If something in their records is relevant, mention it: "I see you're currently taking [medication]..." or "Your last blood pressure reading was..."
- Keep a professional but caring tone. Use the patient's name if known.
- At the end of consultations, summarize key points, recommendations, and next steps like a real doctor would.
- If symptoms suggest an emergency, be direct and urgent: "Based on what you're describing, I strongly recommend you seek immediate emergency care."`;

export default function AIServicePage({ config }) {
  const { title, subtitle, icon: Icon, color, btnClass, textColor, systemPrompt, topics, disclaimer } = config;
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(true);
  const [patientContext, setPatientContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [dataPoints, setDataPoints] = useState(0);
  const [consultationId, setConsultationId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchPatientContext = async () => {
    setContextLoading(true);
    try {
      const res = await base44.functions.invoke("compilePatientContext", {
        service_type: title,
      });
      const ctx = res.data?.context;
      const dp = res.data?.data_points;
      setPatientContext(ctx);
      if (dp) {
        const total = Object.values(dp).reduce((s, v) => s + v, 0);
        setDataPoints(total);
      }
      return ctx;
    } catch (e) {
      console.error("Failed to fetch patient context:", e);
      return null;
    } finally {
      setContextLoading(false);
    }
  };

  const createConsultationRecord = async (initialSymptoms) => {
    try {
      const typeMap = {
        "AI Doctor": "ai_doctor",
        "AI Nurse": "ai_nurse",
        "AI Dentist": "ai_dentist",
        "AI Veterinarian": "ai_veterinarian",
        "AI Physical Therapist": "ai_physical_therapist",
        "AI Eye Doctor": "ai_eye_doctor",
        "AI ENT Specialist": "ai_ent",
        "AI Dermatologist": "ai_dermatologist",
        "AI Senior Care": "ai_senior_care",
        "AI Assisted Living": "ai_assisted_living",
        "AI Sports Medicine": "ai_sports_medicine",
        "AI Personal Physician": "ai_personal_physician",
        "AI Wellness Spa": "ai_wellness_spa",
        "AI Emergency Room": "ai_er",
      };
      const consultation = await base44.entities.Consultation.create({
        type: typeMap[title] || "ai_specialist",
        specialty: title,
        status: "in_progress",
        symptoms: initialSymptoms?.substring(0, 500),
        conversation_history: [],
        avatar_gender: avatar?.gender || null,
        avatar_race: avatar?.race || null,
        patient_context_summary: patientContext?.substring(0, 2000) || null,
        data_points_used: dataPoints,
      });
      setConsultationId(consultation.id);
      return consultation.id;
    } catch (e) {
      console.error("Failed to create consultation record:", e);
      return null;
    }
  };

  const updateConsultationHistory = async (allMessages) => {
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
      const conversationText = allMessages.map(m => `${m.role === "user" ? "Patient" : title}: ${m.content}`).join("\n\n");
      const summaryRes = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a medical documentation system. Based on this consultation transcript, generate a concise clinical summary including:
1. Chief complaint
2. Key findings
3. Assessment
4. Recommendations
5. Follow-up plan

Transcript:
${conversationText}

Output only the summary text, no preamble.`,
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

    const ctx = patientContext || await fetchPatientContext();
    setContextLoading(false);

    await createConsultationRecord(initialPrompt);

    try {
      const avatarContext = avatar
        ? `\n\nYou are presenting as a ${avatar.genderLabel} ${avatar.raceLabel} ${title}. Stay in character as this persona throughout the consultation.`
        : "";
      const contextBlock = ctx
        ? `\n\n## PATIENT MEDICAL RECORDS (You have access to this patient's complete medical history)\n${ctx}\n\nUse this information to provide personalized, informed care. Reference specific details from their records when relevant.`
        : "";
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}${REALISTIC_PROMPT_SUFFIX}${avatarContext}${contextBlock}\n\nPatient says: ${initialPrompt}\n\nRespond as a real ${title} would — with empathy, expertise, and references to their medical history when relevant. Ask follow-up questions to provide personalized guidance.`
      });
      const assistantMsg = { role: "assistant", content: response };
      const allMessages = [userMsg, assistantMsg];
      setMessages(allMessages);
      updateConsultationHistory(allMessages);
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
      const conversationText = newMessages.map((m) => `${m.role === "user" ? "Patient" : title}: ${m.content}`).join("\n\n");
      const avatarContext = avatar
        ? `\n\nYou are a ${avatar.genderLabel} ${avatar.raceLabel} ${title}.`
        : "";
      const contextBlock = patientContext
        ? `\n\n## PATIENT MEDICAL RECORDS\n${patientContext}`
        : "";
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}${REALISTIC_PROMPT_SUFFIX}${avatarContext}${contextBlock}\n\n## CONSULTATION HISTORY\n${conversationText}\n\nContinue as ${title}. Respond naturally and reference the patient's history when relevant.`
      });
      const assistantMsg = { role: "assistant", content: response };
      const allMessages = [...newMessages, assistantMsg];
      setMessages(allMessages);
      updateConsultationHistory(allMessages);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleEndConsultation = () => {
    if (messages.length > 1) {
      finalizeConsultation(messages);
    }
    setStarted(false);
    setMessages([]);
    setConsultationId(null);
    setPatientContext(null);
    setDataPoints(0);
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

          {showAvatarSelector && !avatar ? (
            <VirtualAvatarSelector serviceName={title} onSelect={(a) => { setAvatar(a); setShowAvatarSelector(false); }} />
          ) : (
            <>
          {/* Patient context indicator */}
          <Card className="p-3 mb-4 bg-sky-50 border-sky-200">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-sky-800">Connected to Your Medical Records</p>
                <p className="text-[10px] text-sky-600">This professional has access to your vitals, medications, lab results, symptoms, and history for personalized care.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-sky-600"
                onClick={fetchPatientContext}
                disabled={contextLoading}
              >
                {contextLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sync"}
              </Button>
            </div>
            {dataPoints > 0 && (
              <Badge variant="outline" className="text-[10px] mt-1.5 bg-white">
                {dataPoints} data points loaded
              </Badge>
            )}
          </Card>

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
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="font-display font-semibold text-sm">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {avatar ? `${avatar.avatar} ${avatar.genderLabel} · ${avatar.raceLabel}` : "AI Consultation"}
            {dataPoints > 0 && ` · ${dataPoints} records accessed`}
          </p>
        </div>
        {consultationId && (
          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">
            <FileText className="w-3 h-3 mr-1" /> Auto-saving
          </Badge>
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
                  ? `bg-gradient-to-br ${color} text-white rounded-br-md`
                  : "bg-white border rounded-bl-md shadow-sm"
              }`}>
                {msg.role === "user"
                  ? <p>{msg.content}</p>
                  : <ReactMarkdown className="prose prose-sm max-w-none">{msg.content}</ReactMarkdown>}
                {msg.role === "assistant" && msg.content && (
                  <ResponseActions content={msg.content} label={`${title}-response`} />
                )}
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