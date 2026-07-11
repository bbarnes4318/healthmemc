import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { ClipboardCheck, Loader2, CheckCircle, Heart, Activity, Droplet, Scale } from "lucide-react";
import { motion } from "framer-motion";

const feelings = [
  { value: "great", label: "Great", emoji: "😄", color: "bg-emerald-100 border-emerald-400 text-emerald-700" },
  { value: "good", label: "Good", emoji: "🙂", color: "bg-sky-100 border-sky-400 text-sky-700" },
  { value: "okay", label: "Okay", emoji: "😐", color: "bg-amber-100 border-amber-400 text-amber-700" },
  { value: "poor", label: "Poor", emoji: "😟", color: "bg-rose-100 border-rose-400 text-rose-700" },
];

export default function CheckInButton() {
  const [open, setOpen] = useState(false);
  const [feeling, setFeeling] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [bpSys, setBpSys] = useState("");
  const [bpDia, setBpDia] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const { currentMemberId, currentMemberName } = useFamilyMember();

  const reset = () => {
    setFeeling(""); setHeartRate(""); setBpSys(""); setBpDia(""); setWeight(""); setNotes(""); setDone(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const fmId = currentMemberId || undefined;
      const records = [];

      if (heartRate) records.push(
        base44.entities.VitalRecord.create({ type: "heart_rate", value: parseFloat(heartRate), unit: "bpm", recorded_at: now, family_member_id: fmId, notes: `Check-in: feeling ${feeling}` })
      );
      if (bpSys && bpDia) records.push(
        base44.entities.VitalRecord.create({ type: "blood_pressure", value: parseFloat(bpSys), secondary_value: parseFloat(bpDia), unit: "mmHg", recorded_at: now, family_member_id: fmId, notes: `Check-in: feeling ${feeling}` })
      );
      if (weight) records.push(
        base44.entities.VitalRecord.create({ type: "weight", value: parseFloat(weight), unit: "kg", recorded_at: now, family_member_id: fmId, notes: `Check-in: feeling ${feeling}` })
      );

      if (records.length === 0 && feeling) {
        records.push(
          base44.entities.VitalRecord.create({ type: "heart_rate", value: 0, unit: "bpm", recorded_at: now, family_member_id: fmId, notes: `Daily check-in: feeling ${feeling}${notes ? " — " + notes : ""}` })
        );
      }

      await Promise.all(records);
      setDone(true);
      toast({ title: "Check-in saved!", description: `Today's vitals recorded for ${currentMemberName}.` });
      setTimeout(() => { setOpen(false); reset(); }, 1500);
    } catch (e) {
      toast({ title: "Failed to save check-in", variant: "destructive" });
      console.error(e);
    }
    setSaving(false);
  };

  const hasInput = feeling || heartRate || (bpSys && bpDia) || weight;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="bg-white text-sky-700 hover:bg-sky-50 font-semibold shadow-lg shadow-sky-700/20">
          <ClipboardCheck className="w-4 h-4 mr-2" />
          Check In
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-sky-600" /> Daily Check-In
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold">Check-in complete!</p>
            <p className="text-xs text-muted-foreground mt-1">Your vitals have been saved for {currentMemberName}.</p>
          </motion.div>
        ) : (
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-medium">How are you feeling today?</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {feelings.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFeeling(f.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition ${feeling === f.value ? f.color : "border-border bg-card hover:bg-muted"}`}
                  >
                    <span className="text-lg">{f.emoji}</span>
                    <span className="text-[10px] font-medium">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs flex items-center gap-1"><Heart className="w-3 h-3 text-rose-500" /> Heart Rate</Label>
                <Input type="number" placeholder="72" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} className="mt-1" />
                <p className="text-[10px] text-muted-foreground">bpm</p>
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><Droplet className="w-3 h-3 text-sky-500" /> Blood Pressure</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input type="number" placeholder="120" value={bpSys} onChange={(e) => setBpSys(e.target.value)} className="w-full" />
                  <span className="text-muted-foreground">/</span>
                  <Input type="number" placeholder="80" value={bpDia} onChange={(e) => setBpDia(e.target.value)} className="w-full" />
                </div>
                <p className="text-[10px] text-muted-foreground">mmHg</p>
              </div>
            </div>

            <div>
              <Label className="text-xs flex items-center gap-1"><Scale className="w-3 h-3 text-violet-500" /> Weight</Label>
              <Input type="number" step="0.1" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1" />
              <p className="text-[10px] text-muted-foreground">kg</p>
            </div>

            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea placeholder="Any symptoms or observations..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="resize-none mt-1" />
            </div>

            <Button onClick={handleSave} disabled={!hasInput || saving} className="w-full bg-sky-600 hover:bg-sky-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ClipboardCheck className="w-4 h-4 mr-2" />}
              Save Check-In
            </Button>
            {!hasInput && <p className="text-[10px] text-muted-foreground text-center">Select a feeling or enter at least one vital to check in.</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}