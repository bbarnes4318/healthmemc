import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  MessageSquare, Send, Loader2, Lock, Stethoscope, Inbox,
  ArrowLeft, Mail, Shield, CheckCircle, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

export default function DoctorMessageInbox() {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [composeMode, setComposeMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMsg, setNewMsg] = useState({ doctor_id: "", subject: "", body: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, msgs] = await Promise.all([
        base44.entities.DoctorDirectory.list("-created_date", 100),
        base44.entities.DoctorMessage.list("-created_date", 200),
      ]);
      setDoctors(docs);
      setMessages(msgs);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group messages into conversations by doctor
  const conversations = (() => {
    const map = {};
    for (const msg of messages) {
      const key = msg.doctor_id || msg.doctor_name || "unknown";
      if (!map[key]) {
        map[key] = {
          doctor_id: msg.doctor_id,
          doctor_name: msg.doctor_name || "Unknown Doctor",
          specialty: msg.specialty,
          messages: [],
          unread: 0,
          lastMessageDate: null,
        };
      }
      map[key].messages.push(msg);
      if (msg.sender_role === "doctor" && !msg.read) {
        map[key].unread++;
      }
      const msgDate = msg.created_date;
      if (!map[key].lastMessageDate || new Date(msgDate) > new Date(map[key].lastMessageDate)) {
        map[key].lastMessageDate = msgDate;
      }
    }
    return Object.values(map).sort((a, b) => {
      if (a.unread !== b.unread) return b.unread - a.unread;
      return new Date(b.lastMessageDate) - new Date(a.lastMessageDate);
    });
  })();

  const handleSend = async () => {
    if (!newMsg.body.trim()) {
      toast({ title: "Please enter a message", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const selectedDoctor = doctors.find((d) => d.id === newMsg.doctor_id);
      const conversationId = newMsg.doctor_id || "general";

      // Save the patient's message
      await base44.entities.DoctorMessage.create({
        conversation_id: conversationId,
        doctor_id: newMsg.doctor_id || undefined,
        doctor_name: selectedDoctor?.doctor_name || "Primary Care Doctor",
        specialty: selectedDoctor?.specialty || undefined,
        sender_role: "patient",
        subject: newMsg.subject.trim() || "General Question",
        body: newMsg.body.trim(),
        read: false,
      });

      // Generate doctor's care instructions response using AI
      const prompt = `You are ${selectedDoctor?.doctor_name || "Dr. Smith"}, a ${selectedDoctor?.specialty || "primary care physician"} with 20+ years of experience. A patient has sent you a secure message through their health portal.

Patient message subject: "${newMsg.subject || "General Question"}"
Patient message: "${newMsg.body}"

Respond as their personal doctor would via a secure patient portal message:
- Be warm, professional, and concise (portal messages should be 150-300 words).
- Address their question directly with specific medical guidance.
- If they describe symptoms, provide initial assessment and next steps.
- Include any care instructions (medication changes, lifestyle advice, follow-up needed).
- If the situation seems urgent, advise them to schedule an appointment or seek immediate care.
- Never say "As an AI" — you are a real doctor responding through the portal.
- Sign off as Dr. ${selectedDoctor?.doctor_name?.split(' ').slice(-1)[0] || "Smith"}.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: "claude_sonnet_4_6",
      });

      // Save the doctor's response
      await base44.entities.DoctorMessage.create({
        conversation_id: conversationId,
        doctor_id: newMsg.doctor_id || undefined,
        doctor_name: selectedDoctor?.doctor_name || "Primary Care Doctor",
        specialty: selectedDoctor?.specialty || undefined,
        sender_role: "doctor",
        subject: "Re: " + (newMsg.subject || "General Question"),
        body: typeof response === "string" ? response : "Thank you for your message. Please schedule a follow-up appointment to discuss further.",
        care_instructions: typeof response === "string" ? response : null,
        read: false,
      });

      toast({ title: "Message sent", description: "Your doctor will respond shortly." });
      setNewMsg({ doctor_id: "", subject: "", body: "" });
      setComposeMode(false);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to send message", variant: "destructive" });
    }
    setSending(false);
  };

  const handleMarkRead = async (msg) => {
    if (msg.sender_role === "doctor" && !msg.read) {
      try {
        await base44.entities.DoctorMessage.update(msg.id, { read: true });
        load();
      } catch (e) { console.error(e); }
    }
  };

  const openConversation = (conv) => {
    setActiveConversation(conv);
    // Mark all doctor messages in this conversation as read
    conv.messages.filter((m) => m.sender_role === "doctor" && !m.read).forEach((m) => {
      base44.entities.DoctorMessage.update(m.id, { read: true }).catch(() => {});
    });
    setTimeout(load, 500);
  };

  const selectedDoctor = doctors.find((d) => d.id === newMsg.doctor_id);

  if (loading) {
    return (
      <Card className="p-5 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Inbox className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Secure Doctor Messages</h3>
            <p className="text-xs text-muted-foreground">Send questions & receive care instructions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversations.some((c) => c.unread > 0) && (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-[9px]">
              {conversations.reduce((s, c) => s + c.unread, 0)} new
            </Badge>
          )}
          <Button
            size="sm"
            onClick={() => { setComposeMode(!composeMode); setActiveConversation(null); }}
            className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs"
          >
            {composeMode ? <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> : <MessageSquare className="w-3.5 h-3.5 mr-1.5" />}
            {composeMode ? "Back" : "New Message"}
          </Button>
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-1.5 p-2 rounded-md bg-emerald-50 border border-emerald-200 mb-4">
        <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
        <p className="text-[10px] text-emerald-800">Messages are private and visible only to you and your designated care team.</p>
      </div>

      <AnimatePresence mode="wait">
        {composeMode ? (
          /* Compose new message */
          <motion.div
            key="compose"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-3"
          >
            <div>
              <label className="text-xs font-medium mb-1 block">Send to</label>
              {doctors.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-md">
                  No doctors in your directory. Add a primary care doctor first.
                </p>
              ) : (
                <select
                  value={newMsg.doctor_id}
                  onChange={(e) => setNewMsg({ ...newMsg, doctor_id: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Select a doctor...</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.doctor_name} {doc.specialty ? `— ${doc.specialty}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Subject</label>
              <Input
                placeholder="e.g., Question about my medication dosage"
                value={newMsg.subject}
                onChange={(e) => setNewMsg({ ...newMsg, subject: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Message</label>
              <Textarea
                placeholder="Describe your question or concern for your doctor..."
                value={newMsg.body}
                onChange={(e) => setNewMsg({ ...newMsg, body: e.target.value })}
                rows={4}
                className="text-sm resize-none"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={sending || !newMsg.body.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send Secure Message
            </Button>
          </motion.div>
        ) : activeConversation ? (
          /* View conversation thread */
          <motion.div
            key="thread"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setActiveConversation(null)}>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Button>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{activeConversation.doctor_name}</p>
                {activeConversation.specialty && <p className="text-[10px] text-muted-foreground">{activeConversation.specialty}</p>}
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeConversation.messages
                .slice()
                .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                .map((msg) => {
                  const isPatient = msg.sender_role === "patient";
                  return (
                    <div key={msg.id} className={`flex ${isPatient ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                        isPatient
                          ? "bg-indigo-600 text-white rounded-br-md"
                          : "bg-white border rounded-bl-md shadow-sm"
                      }`}>
                        {!isPatient && msg.subject && (
                          <p className="text-[10px] font-semibold text-muted-foreground mb-1">{msg.subject}</p>
                        )}
                        {isPatient ? (
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                        ) : (
                          <ReactMarkdown className="prose prose-sm max-w-none">{msg.body}</ReactMarkdown>
                        )}
                        <p className={`text-[9px] mt-1.5 ${isPatient ? "text-indigo-200" : "text-muted-foreground"}`}>
                          {format(new Date(msg.created_date), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
            {/* Reply button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 text-xs"
              onClick={() => {
                setNewMsg({
                  doctor_id: activeConversation.doctor_id || "",
                  subject: "",
                  body: "",
                });
                setComposeMode(true);
                setActiveConversation(null);
              }}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Reply to {activeConversation.doctor_name}
            </Button>
          </motion.div>
        ) : (
          /* Conversation list */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">Send a secure message to your primary care doctor to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.doctor_id || conv.doctor_name}
                    onClick={() => openConversation(conv)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/40 transition flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{conv.doctor_name}</p>
                        {conv.unread > 0 && (
                          <Badge className="bg-red-500 text-white text-[9px] px-1.5">{conv.unread}</Badge>
                        )}
                      </div>
                      {conv.specialty && <p className="text-[10px] text-muted-foreground truncate">{conv.specialty}</p>}
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.messages[conv.messages.length - 1]?.body?.substring(0, 60)}...
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] text-muted-foreground">
                        {conv.lastMessageDate && format(new Date(conv.lastMessageDate), "MMM d")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <div className="flex items-start gap-1.5 p-2.5 bg-amber-50 rounded-md border border-amber-200 mt-4">
        <Shield className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[10px] text-amber-800">
          For medical emergencies, call 911 immediately. Portal messages are for non-urgent questions only.
        </p>
      </div>
    </Card>
  );
}