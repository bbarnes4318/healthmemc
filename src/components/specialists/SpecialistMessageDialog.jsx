import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send, FileText } from "lucide-react";
import ComprehensiveReportButton from "@/components/health/ComprehensiveReportButton";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import moment from "moment";

export default function SpecialistMessageDialog({ doctor, open, onOpenChange }) {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (doctor && open) {
      setSubject(`Latest Health Report Update — ${moment().format("MMM D, YYYY")}`);
      setBody(
        `Hi ${doctor.doctor_name},\n\nI'd like to share an update on my recent health report for your review. ` +
        `Please let me know if you have any questions or recommendations based on my latest vitals, medications, and symptoms.\n\nThank you.`
      );
    }
  }, [doctor, open]);

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const conversationId = `conv_${doctor.id}_${Date.now()}`;
      await base44.entities.DoctorMessage.create({
        conversation_id: conversationId,
        doctor_id: doctor.id,
        doctor_name: doctor.doctor_name,
        specialty: doctor.specialty || undefined,
        sender_role: "patient",
        subject: subject || undefined,
        body: body.trim(),
        family_member_id: currentMemberId || undefined,
      });
      toast({
        title: "Message sent",
        description: `Your health report update has been sent to ${doctor.doctor_name}.`,
      });
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to send message", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-4 h-4 text-sky-600" />
            Message {doctor?.doctor_name || "Doctor"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {doctor?.specialty && (
            <p className="text-xs text-muted-foreground">{doctor.specialty}{doctor.practice_name ? ` · ${doctor.practice_name}` : ""}</p>
          )}

          {/* Health report helper */}
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg flex items-center gap-3">
            <FileText className="w-4 h-4 text-sky-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sky-800">Attach your latest health report</p>
              <p className="text-[10px] text-sky-700">Generate a comprehensive PDF to share with your doctor.</p>
            </div>
            <ComprehensiveReportButton />
          </div>

          <div>
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Message subject" />
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Write your message..."
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={!body.trim() || sending} className="bg-sky-600 hover:bg-sky-700">
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}