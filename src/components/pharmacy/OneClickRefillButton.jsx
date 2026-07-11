import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Loader2, Pill, Mail, CheckCircle } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function OneClickRefillButton() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const { toast } = useToast();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [pharmacyEmail, setPharmacyEmail] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");

  const loadMeds = async () => {
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
      const data = await base44.entities.Medication.filter(filter);
      setMedications(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadMeds(); }, [currentMemberId]);

  const handleSend = async () => {
    if (medications.length === 0) return;
    setSending(true);
    try {
      const user = await base44.auth.me();
      const recipient = pharmacyEmail.trim() || user?.email || "";
      if (!recipient) {
        toast({ title: "Email required", description: "Enter your pharmacy's email address.", variant: "destructive" });
        setSending(false);
        return;
      }

      const medList = medications.map((m, i) =>
        `${i + 1}. ${m.name} ${m.dosage} — ${m.frequency}${m.prescribing_provider ? ` (Prescribed by: ${m.prescribing_provider})` : ""}${m.supply_quantity ? ` — Remaining: ${m.supply_quantity} pills` : ""}`
      ).join("\n");

      const subject = `Prescription Refill Request — ${user?.full_name || currentMemberName}`;
      const body = `Hello${pharmacyName ? ` ${pharmacyName}` : ""},

I am requesting refills for the following prescriptions:

${medList}

Patient Name: ${user?.full_name || currentMemberName}
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

Please process these refill requests at your earliest convenience. Thank you.

Sent from Health Me Medical Center`;

      await base44.integrations.Core.SendEmail({ to: recipient, subject, body });
      setSent(true);
      toast({
        title: "Refill summary sent",
        description: `${medications.length} medication${medications.length === 1 ? "" : "s"} submitted to ${recipient}.`,
      });
    } catch (e) {
      toast({ title: "Failed to send", variant: "destructive" });
      console.error(e);
    }
    setSending(false);
  };

  const reset = () => {
    setSent(false);
    setPharmacyEmail("");
    setPharmacyName("");
  };

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          <span className="text-sm text-muted-foreground">Loading medications...</span>
        </div>
      </Card>
    );
  }

  if (medications.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold">One-Click Refill Request</h3>
        </div>
        <p className="text-xs text-muted-foreground">No active medications to refill. Add medications first.</p>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">One-Click Refill Request</h3>
            <p className="text-xs text-muted-foreground">Send all {medications.length} active medications to your pharmacy</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Refill request sent successfully!</p>
            <p className="text-xs text-muted-foreground mt-1">Your pharmacy has received the summary.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
              Send Another Request
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5 mb-4 max-h-32 overflow-y-auto">
              {medications.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-xs">
                  <Pill className="w-3 h-3 text-amber-600 shrink-0" />
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted-foreground">{m.dosage}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <Label className="text-[10px]">Pharmacy Name (optional)</Label>
                <Input
                  placeholder="CVS, Walgreens..."
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px]">Pharmacy Email</Label>
                <Input
                  placeholder="pharmacy@email.com"
                  value={pharmacyEmail}
                  onChange={(e) => setPharmacyEmail(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">
              Leave email blank to send to your account email. A summary of all medications will be compiled automatically.
            </p>

            <Button
              onClick={handleSend}
              disabled={sending}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              {sending ? "Sending..." : `Send Refill Request (${medications.length} meds)`}
            </Button>
          </>
        )}
      </Card>
    </motion.div>
  );
}