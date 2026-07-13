import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { Pill, Activity, Dumbbell, Loader2, Check } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const bodyParts = [
  { value: "knee", label: "Knee" },
  { value: "shoulder", label: "Shoulder" },
  { value: "hip", label: "Hip" },
  { value: "spine", label: "Spine" },
  { value: "ankle", label: "Ankle" },
  { value: "wrist", label: "Wrist" },
  { value: "neck", label: "Neck" },
  { value: "full_body", label: "Full Body" },
  { value: "other", label: "Other" },
];

export default function QuickActionOverlay() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [openType, setOpenType] = useState(null); // 'med' | 'pain' | 'pt'
  const [saving, setSaving] = useState(false);
  const [medications, setMedications] = useState([]);

  // Med form
  const [medForm, setMedForm] = useState({
    medication_name: "",
    status: "taken",
    notes: "",
  });

  // Pain form
  const [painForm, setPainForm] = useState({
    body_part: "knee",
    pain_level: 5,
    notes: "",
  });

  // PT exercise form
  const [ptForm, setPtForm] = useState({
    exercise_name: "",
    body_part: "knee",
    difficulty: "medium",
    intensity: "moderate",
    sets: "",
    reps: "",
    duration_minutes: "",
    pain_level: "",
    notes: "",
  });

  useEffect(() => {
    const loadMeds = async () => {
      try {
        const filter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
        const meds = await base44.entities.Medication.filter(filter);
        setMedications(meds);
      } catch (e) { console.error(e); }
    };
    loadMeds();
  }, [currentMemberId]);

  const today = format(new Date(), "yyyy-MM-dd");

  const handleSaveMed = async () => {
    if (!medForm.medication_name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.MedicationLog.create({
        medication_name: medForm.medication_name,
        scheduled_date: today,
        status: medForm.status,
        taken_at: medForm.status === "taken" ? new Date().toISOString() : undefined,
        notes: medForm.notes || undefined,
        family_member_id: currentMemberId || undefined,
      });
      toast({ title: "Medication logged", description: `${medForm.medication_name} — ${medForm.status}` });
      setMedForm({ medication_name: "", status: "taken", notes: "" });
      setOpenType(null);
    } catch (e) {
      toast({ title: "Failed to log medication", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleSavePain = async () => {
    setSaving(true);
    try {
      await base44.entities.ExerciseLog.create({
        exercise_name: "Pain Check-In",
        body_part: painForm.body_part,
        difficulty: "easy",
        intensity: "low",
        pain_level: painForm.pain_level,
        notes: painForm.notes || undefined,
        date: today,
        family_member_id: currentMemberId || undefined,
      });
      toast({ title: "Pain level logged", description: `${bodyParts.find((b) => b.value === painForm.body_part)?.label}: ${painForm.pain_level}/10` });
      setPainForm({ body_part: "knee", pain_level: 5, notes: "" });
      setOpenType(null);
    } catch (e) {
      toast({ title: "Failed to log pain", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleSavePT = async () => {
    if (!ptForm.exercise_name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.ExerciseLog.create({
        exercise_name: ptForm.exercise_name,
        body_part: ptForm.body_part,
        difficulty: ptForm.difficulty,
        intensity: ptForm.intensity,
        sets: ptForm.sets ? parseInt(ptForm.sets) : undefined,
        reps: ptForm.reps ? parseInt(ptForm.reps) : undefined,
        duration_minutes: ptForm.duration_minutes ? parseInt(ptForm.duration_minutes) : undefined,
        pain_level: ptForm.pain_level ? parseInt(ptForm.pain_level) : undefined,
        notes: ptForm.notes || undefined,
        date: today,
        family_member_id: currentMemberId || undefined,
      });
      toast({ title: "Exercise logged", description: `${ptForm.exercise_name} recorded` });
      setPtForm({ exercise_name: "", body_part: "knee", difficulty: "medium", intensity: "moderate", sets: "", reps: "", duration_minutes: "", pain_level: "", notes: "" });
      setOpenType(null);
    } catch (e) {
      toast({ title: "Failed to log exercise", variant: "destructive" });
    }
    setSaving(false);
  };

  const quickActions = [
    { type: "med", label: "Log Meds", icon: Pill, color: "from-emerald-500 to-teal-600", desc: "Record a dose taken" },
    { type: "pain", label: "Log Pain", icon: Activity, color: "from-rose-500 to-red-600", desc: "Rate your pain level" },
    { type: "pt", label: "Log PT Exercise", icon: Dumbbell, color: "from-orange-500 to-amber-600", desc: "Track a session" },
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action, i) => (
          <motion.div
            key={action.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <button onClick={() => setOpenType(action.type)} className="w-full text-left">
              <div className="p-3 rounded-xl border bg-card hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-2`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <p className="font-semibold text-xs">{action.label}</p>
                <p className="text-[10px] text-muted-foreground">{action.desc}</p>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Medication Log Dialog */}
      <Dialog open={openType === "med"} onOpenChange={(open) => !open && setOpenType(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pill className="w-4 h-4 text-emerald-600" /> Log Medication</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Medication *</Label>
              {medications.length > 0 ? (
                <Select value={medForm.medication_name} onValueChange={(v) => setMedForm({ ...medForm, medication_name: v })}>
                  <SelectTrigger><SelectValue placeholder="Select medication..." /></SelectTrigger>
                  <SelectContent>
                    {medications.map((m) => <SelectItem key={m.id} value={m.name}>{m.name} — {m.dosage}</SelectItem>)}
                    <SelectItem value="__custom">+ Other (type below)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input placeholder="Medication name" value={medForm.medication_name} onChange={(e) => setMedForm({ ...medForm, medication_name: e.target.value })} />
              )}
              {medForm.medication_name === "__custom" && (
                <Input placeholder="Type medication name" className="mt-2" onChange={(e) => setMedForm({ ...medForm, medication_name: e.target.value })} />
              )}
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <div className="flex gap-2">
                {["taken", "missed", "skipped"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setMedForm({ ...medForm, status: s })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition ${
                      medForm.status === s
                        ? s === "taken" ? "bg-emerald-500 text-white" : s === "missed" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Input placeholder="e.g., with food" value={medForm.notes} onChange={(e) => setMedForm({ ...medForm, notes: e.target.value })} />
            </div>
            <Button onClick={handleSaveMed} disabled={!medForm.medication_name.trim() || medForm.medication_name === "__custom" || saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pain Log Dialog */}
      <Dialog open={openType === "pain"} onOpenChange={(open) => !open && setOpenType(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Activity className="w-4 h-4 text-rose-600" /> Log Pain Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Body Area</Label>
              <Select value={painForm.body_part} onValueChange={(v) => setPainForm({ ...painForm, body_part: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bodyParts.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Pain Level (0–10)</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={painForm.pain_level}
                  onChange={(e) => setPainForm({ ...painForm, pain_level: parseInt(e.target.value) })}
                  className="flex-1 accent-rose-600"
                />
                <div className={`w-12 text-center py-1 rounded-lg font-bold text-sm ${
                  painForm.pain_level <= 3 ? "bg-green-100 text-green-700" :
                  painForm.pain_level <= 6 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {painForm.pain_level}
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                <span>No pain</span><span>Moderate</span><span>Severe</span>
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea placeholder="Describe the pain..." value={painForm.notes} onChange={(e) => setPainForm({ ...painForm, notes: e.target.value })} rows={2} className="resize-none" />
            </div>
            <Button onClick={handleSavePain} disabled={saving} className="w-full bg-rose-600 hover:bg-rose-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PT Exercise Dialog */}
      <Dialog open={openType === "pt"} onOpenChange={(open) => !open && setOpenType(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Dumbbell className="w-4 h-4 text-orange-600" /> Log PT Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Exercise Name *</Label>
              <Input placeholder="e.g., Straight Leg Raise" value={ptForm.exercise_name} onChange={(e) => setPtForm({ ...ptForm, exercise_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Body Part</Label>
                <Select value={ptForm.body_part} onValueChange={(v) => setPtForm({ ...ptForm, body_part: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {bodyParts.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Difficulty</Label>
                <Select value={ptForm.difficulty} onValueChange={(v) => setPtForm({ ...ptForm, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Sets</Label>
                <Input type="number" placeholder="3" value={ptForm.sets} onChange={(e) => setPtForm({ ...ptForm, sets: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Reps</Label>
                <Input type="number" placeholder="10" value={ptForm.reps} onChange={(e) => setPtForm({ ...ptForm, reps: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Min</Label>
                <Input type="number" placeholder="15" value={ptForm.duration_minutes} onChange={(e) => setPtForm({ ...ptForm, duration_minutes: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Pain Level (0–10, optional)</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={ptForm.pain_level || 0}
                  onChange={(e) => setPtForm({ ...ptForm, pain_level: e.target.value })}
                  className="flex-1 accent-orange-600"
                />
                <div className="w-10 text-center py-1 rounded-lg font-bold text-sm bg-muted">
                  {ptForm.pain_level || "—"}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea placeholder="How did it feel?" value={ptForm.notes} onChange={(e) => setPtForm({ ...ptForm, notes: e.target.value })} rows={2} className="resize-none" />
            </div>
            <Button onClick={handleSavePT} disabled={!ptForm.exercise_name.trim() || saving} className="w-full bg-orange-600 hover:bg-orange-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Save Exercise
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}