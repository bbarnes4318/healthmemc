import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Loader2, Shield, CheckCircle2, Clock, Stethoscope, MapPin, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const PRICE = "149.00";
const VISIT_DURATION = "60 minutes";

const timeSlots = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

const includes = [
  "Board-certified physician at your doorstep",
  "60-minute comprehensive visit",
  "Vital signs & physical examination",
  "Point-of-care testing (basic labs)",
  "Prescription management",
  "Post-visit summary & care plan",
];

export default function HomeDoctorVisit() {
  const { members } = useFamilyMember();
  const { toast } = useToast();
  const [form, setForm] = useState({
    visit_date: "",
    time_slot: "",
    reason: "",
    address: "",
    family_member_id: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    if (!form.visit_date || !form.time_slot || !form.address.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Create appointment
      const visitDateTime = new Date(`${form.visit_date}T${form.time_slot === "8:00 AM" ? "08:00" : form.time_slot}`);
      await base44.entities.Appointment.create({
        title: "Home Doctor Visit",
        date: visitDateTime.toISOString(),
        type: "checkup",
        status: "scheduled",
        provider: "Home Visit Physician",
        notes: `Time slot: ${form.time_slot}\nReason: ${form.reason}\nAddress: ${form.address}`,
        family_member_id: form.family_member_id || undefined,
      });

      // Initiate checkout
      const response = await base44.functions.invoke("create-checkout", {
        item_name: "Home Doctor Visit",
        price: PRICE,
      });

      if (response.data?.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
        toast({ title: "Failed to start checkout", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Booking failed", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Hero */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
            <Home className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Home Doctor Visit</h1>
            <p className="text-sm text-muted-foreground">A licensed physician comes to you — quality care in the comfort of your home</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Details */}
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-sky-500 to-blue-600 text-white border-0">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold">${PRICE}</span>
                <span className="text-sky-100 text-sm">per visit</span>
              </div>
              <p className="text-sky-100 text-xs mt-1">{VISIT_DURATION} · Same-day availability</p>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600" /> What's Included
              </h3>
              <div className="space-y-2">
                {includes.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" /> How It Works
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center shrink-0">1</div>
                  <p className="text-xs text-muted-foreground">Book your preferred date, time, and address</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center shrink-0">2</div>
                  <p className="text-xs text-muted-foreground">Complete secure payment to confirm your visit</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center shrink-0">3</div>
                  <p className="text-xs text-muted-foreground">A physician arrives at your location at the scheduled time</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center shrink-0">4</div>
                  <p className="text-xs text-muted-foreground">Receive a post-visit summary and care plan in your records</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Form */}
          <div>
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-sky-600" /> Book Your Visit
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Visit Date *</Label>
                  <Input
                    type="date"
                    min={today}
                    value={form.visit_date}
                    onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Preferred Time *</Label>
                  <Select value={form.time_slot} onValueChange={(v) => setForm({ ...form, time_slot: v })}>
                    <SelectTrigger><SelectValue placeholder="Select a time slot" /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {members.length > 0 && (
                  <div>
                    <Label className="text-xs">For Family Member (optional)</Label>
                    <Select value={form.family_member_id} onValueChange={(v) => setForm({ ...form, family_member_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Yourself" /></SelectTrigger>
                      <SelectContent>
                        {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.relationship})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> Visit Address *</Label>
                  <Textarea
                    placeholder="Full address where the doctor should visit"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div>
                  <Label className="text-xs">Reason for Visit</Label>
                  <Textarea
                    placeholder="Briefly describe your symptoms or reason for the visit"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-xl font-bold text-sky-600">${PRICE}</span>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                    size="lg"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                    {submitting ? "Processing..." : `Pay $${PRICE} & Book Visit`}
                  </Button>
                </div>

                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <Shield className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-amber-800">
                    Home visits are for non-emergency care only. If you're experiencing a medical emergency, call 911 immediately.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}