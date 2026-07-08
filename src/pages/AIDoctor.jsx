import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Stethoscope, Send, Loader2, FileText, AlertTriangle,
  CheckCircle, Download, Share2, ArrowLeft, Upload, Shield, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { generateReportPdf } from "@/lib/generateReportPdf";

export default function AIDoctor() {
  const [step, setStep] = useState("input"); // input, consulting, report
  const [symptoms, setSymptoms] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(result.file_url);
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const startConsultation = async () => {
    if (!symptoms.trim()) return;
    setStep("consulting");
    setLoading(true);

    const userMsg = { role: "user", content: symptoms };
    setMessages([userMsg]);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI medical consultation assistant. A patient has described their symptoms. Ask 3-5 focused follow-up questions to better understand their condition. Be empathetic and professional. Ask one question at a time or group related questions.

Patient's symptoms: ${symptoms}
${fileUrl ? `The patient has also uploaded a document for reference.` : ""}

Important: You are gathering information only. Do not diagnose yet. Ask about duration, severity, triggers, related symptoms, medical history, and current medications.`,
        model: "claude_sonnet_4_6"
      });

      const aiMsg = { role: "assistant", content: response };
      setMessages([userMsg, aiMsg]);

      const consult = await base44.entities.Consultation.create({
        type: "ai_doctor",
        status: "in_progress",
        symptoms,
        conversation_history: [userMsg, aiMsg],
      });
      setConsultation(consult);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!currentInput.trim() || loading) return;
    setLoading(true);

    const newMessages = [...messages, { role: "user", content: currentInput }];
    setMessages(newMessages);
    setCurrentInput("");

    try {
      const conversationText = newMessages
        .map((m) => `${m.role === "user" ? "Patient" : "AI Doctor"}: ${m.content}`)
        .join("\n\n");

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI medical consultation assistant continuing a conversation. Based on the patient's responses, either ask more clarifying questions or if you have enough information, say "I have enough information to provide my assessment. Let me generate your health report now." and nothing else after that statement.

Conversation so far:
${conversationText}

Be empathetic, professional, and thorough.`,
        model: "claude_sonnet_4_6"
      });

      const updatedMessages = [...newMessages, { role: "assistant", content: response }];
      setMessages(updatedMessages);

      if (consultation) {
        await base44.entities.Consultation.update(consultation.id, {
          conversation_history: updatedMessages,
        });
      }

      if (response.toLowerCase().includes("generate your health report") || response.toLowerCase().includes("enough information")) {
        setTimeout(() => generateReport(updatedMessages), 1500);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const generateReport = async (msgs) => {
    setLoading(true);
    try {
      const conversationText = msgs
        .map((m) => `${m.role === "user" ? "Patient" : "AI Doctor"}: ${m.content}`)
        .join("\n\n");

      const reportData = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the following medical consultation, generate a comprehensive health report. Be thorough but clear. Use evidence-based medicine principles.

Consultation:
${conversationText}

IMPORTANT: Include appropriate disclaimers that this is AI-generated and should be verified by a healthcare professional.`,
        model: "claude_sonnet_4_6",
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            diagnoses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  confidence: { type: "string", enum: ["High", "Moderate", "Low"] },
                  description: { type: "string" },
                },
              },
            },
            recommended_tests: { type: "array", items: { type: "string" } },
            recommended_treatments: { type: "array", items: { type: "string" } },
            medication_review: { type: "string" },
            lifestyle_recommendations: { type: "array", items: { type: "string" } },
            complementary_care: { type: "array", items: { type: "string" } },
            follow_up_plan: { type: "string" },
            emergency_warnings: { type: "array", items: { type: "string" } },
            references: { type: "array", items: { type: "string" } },
          },
        },
      });

      setReport(reportData);
      setStep("report");

      if (consultation) {
        await base44.entities.Consultation.update(consultation.id, {
          status: "completed",
          report: reportData,
          severity: reportData.emergency_warnings?.length > 0 ? "high" : "low",
        });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const requestReport = () => {
    generateReport(messages);
  };

  if (step === "input") {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold">AI Doctor Consultation</h1>
            <p className="text-muted-foreground mt-1 text-sm">Describe your symptoms and our AI will guide you through a structured consultation</p>
          </div>

          <Card className="p-6">
            <label className="text-sm font-medium mb-2 block">What symptoms are you experiencing?</label>
            <Textarea
              placeholder="Describe your symptoms in detail — when they started, severity, what makes them better or worse..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={5}
              className="resize-none mb-4"
            />

            <div className="flex items-center gap-3 mb-4">
              <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition text-sm">
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : fileUrl ? "File attached ✓" : "Attach medical file"}
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
              </label>
            </div>

            <Button
              onClick={startConsultation}
              disabled={!symptoms.trim()}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
              size="lg"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              Start Consultation
            </Button>
          </Card>

          <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200 mt-4">
            <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              This is an AI health assistant and does not replace professional medical advice. If you're experiencing a medical emergency, call 911 or your local emergency number immediately.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === "report" && report) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => { setStep("input"); setMessages([]); setReport(null); setSymptoms(""); }} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> New Consultation
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="p-6 bg-gradient-to-br from-sky-500 to-blue-600 text-white border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-display font-bold">Health Report</h2>
                  <p className="text-sky-100 text-sm">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30 border-0"
                onClick={() => generateReportPdf(report, symptoms)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </Card>

          {report.summary && (
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-2">Summary</h3>
              <p className="text-sm text-muted-foreground">{report.summary}</p>
            </Card>
          )}

          {report.diagnoses?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-3">Possible Diagnoses</h3>
              <div className="space-y-3">
                {report.diagnoses.map((d, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{d.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        d.confidence === "High" ? "bg-green-100 text-green-700" :
                        d.confidence === "Moderate" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{d.confidence} confidence</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{d.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {report.emergency_warnings?.length > 0 && (
            <Card className="p-5 border-red-200 bg-red-50">
              <h3 className="font-display font-semibold text-red-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Emergency Warnings
              </h3>
              <ul className="space-y-1">
                {report.emergency_warnings.map((w, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {report.recommended_tests?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-2">Recommended Tests</h3>
              <ul className="space-y-1">
                {report.recommended_tests.map((t, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {report.recommended_treatments?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-2">Recommended Treatments</h3>
              <ul className="space-y-1">
                {report.recommended_treatments.map((t, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {report.medication_review && (
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-2">Medication Review</h3>
              <p className="text-sm text-muted-foreground">{report.medication_review}</p>
            </Card>
          )}

          {report.lifestyle_recommendations?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-2">Lifestyle Recommendations</h3>
              <ul className="space-y-1">
                {report.lifestyle_recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <Stethoscope className="w-3.5 h-3.5 text-violet-600 mt-0.5 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {report.complementary_care?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-2">Complementary Care Options</h3>
              <ul className="space-y-1">
                {report.complementary_care.map((c, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {report.follow_up_plan && (
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-2">Follow-up Plan</h3>
              <p className="text-sm text-muted-foreground">{report.follow_up_plan}</p>
            </Card>
          )}

          {report.references?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-2">References</h3>
              <ul className="space-y-1">
                {report.references.map((r, i) => (
                  <li key={i} className="text-xs text-muted-foreground">{i + 1}. {r}</li>
                ))}
              </ul>
            </Card>
          )}

          <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              This report was generated by AI and should be reviewed by a licensed healthcare professional. It is not a substitute for medical diagnosis or treatment.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Consulting step (chat)
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-sm">AI Doctor</h2>
            <p className="text-xs text-muted-foreground">Consultation in progress</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={requestReport}>
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          Generate Report
        </Button>
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
                  ? "bg-sky-600 text-white rounded-br-md"
                  : "bg-white border rounded-bl-md shadow-sm"
              }`}>
                <ReactMarkdown className="prose prose-sm max-w-none">{msg.content}</ReactMarkdown>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-bl-md p-3.5 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            placeholder="Describe your response..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={1}
            className="resize-none flex-1"
          />
          <Button onClick={sendMessage} disabled={!currentInput.trim() || loading} className="bg-sky-600 hover:bg-sky-700">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}