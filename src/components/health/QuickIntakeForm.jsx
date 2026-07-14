import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { ClipboardPlus, Loader2, CheckCircle2, Activity, Pill } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

const bodyRegions = [
  "head", "neck", "left_shoulder", "right_shoulder", "left_arm", "right_arm",
  "chest", "abdomen", "back", "lower_back", "left_hip", "right_hip",
  "left_thigh", "right_thigh", "left_knee", "right_knee", "left_calf", "right_calf",
  "left_foot", "right_foot",
];
const regionLabels = bodyRegions.map((r) => r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));

const painTypes = ["aching", "sharp", "burning", "throbbing", "stiffness", "numbness", "tingling", "cramping", "other"];
const severityOptions = ["mild", "moderate", "severe"];
const medChangeTypes = [
  { value: "started", label: "Started new medication" },
  { value: "stopped", label: "Stopped medication" },
  { value: "dose_changed", label: "Dose changed" },
  { value: "side_effect", label: "Experiencing side effect" },
];

export default function QuickIntakeForm() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [mode, setMode] = useState("symptom");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [symptomForm, setSymptomForm] = useState({
    body_region: "head", severity: "mild", pain_type: "aching", description: "",
  });
  const [medForm, setMedForm] = useState({
    medication_name: "", change_type: "started", details: "",
  });

  const handleSaveSymptom = async () => {
    if (!symptomForm.description.trim()) return;
    setSaving(true);
    try {
      const fmFilter = currentMemberId ? { family_member_id: currentMemberId } : {};
      await Promise.all([
        base44.entities.SymptomMap.create({
          body_region: symptomForm.body_region,
          severity: symptomForm.severity,
          pain_type: symptomForm.pain_type,
          symptom_description: symptomForm.description,
          logged_at: new Date().toISOString(),
          ...fmFilter,
        }),
        base44.entities.MedicalRecord.create({
          title: `Symptom Report: ${symptomForm.body_region.replace(/_/g, " ")}`,
          category: "intake_form",
          date: moment().format("YYYY-MM-DD"),
          notes: `Severity: ${symptomForm.severity} | Pain type: ${symptomForm.pain_type}\n${symptomForm.description}`,
          ...fmFilter,
        }),
      ]);
      setSymptomForm({ body_region: "head", severity: "mild", pain_type: "aching", description: "" });
      showSuccess();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleSaveMedication = async () => {
    if (!medForm.medication_name.trim() || !medForm.details.trim()) return;
    setSaving(true);
    try {
      const fmFilter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const changeLabel = medChangeTypes.find((t) => t.value === medForm.change_type)?.label || medForm.change_type;
      await base44.entities.MedicalRecord.create({
        title: `Medication Change: ${medForm.medication_name}`,
        category: "intake_form",
        date: moment().format("YYYY-MM-DD"),
        notes: `${changeLabel}\n${medForm.details}`,
        ...fmFilter,
      });
      setMedForm({ medication_name: "", change_type: "started", details: "" });
      showSuccess();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const showSuccess = () => {
    setJustSaved(true);
    toast({ title: "Saved to medical records", description: "Your entry has been automatically recorded." });
    setTimeout(() => setJustSaved(false), 2500);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold flex items-center gap-2 text-sm">
          <ClipboardPlus className="w-4 h-4 text-sky-600" />
          Quick Intake
        </h3>
        <AnimatePresence>
          {justSaved && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-xs text-emerald-600 font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved to records
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-4">
        <button
          onClick={() => setMode("symptom")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
            mode === "symptom" ? "bg-white text-sky-700 shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> New Symptom
        </button>
        <button
          onClick={() => setMode("medication")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
            mode === "medication" ? "bg-white text-emerald-700 shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Pill className="w-3.5 h-3.5" /> Medication Change
        </button>
      </div>

      {mode === "symptom" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Select value={symptomForm.body_region} onValueChange={(v) => setSymptomForm({ ...symptomForm, body_region: v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {bodyRegions.map((r, i) => <SelectItem key={r} value={r}>{regionLabels[i]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={symptomForm.severity} onValueChange={(v) => setSymptomForm({ ...symptomForm, severity: v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {severityOptions.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Select value={symptomForm.pain_type} onValueChange={(v) => setSymptomForm({ ...symptomForm, pain_type: v })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {painTypes.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Describe your symptom..."
            value={symptomForm.description}
            onChange={(e) => setSymptomForm({ ...symptomForm, description: e.target.value })}
            rows={2}
            className="resize-none text-sm"
          />
          <Button
            onClick={handleSaveSymptom}
            disabled={!symptomForm.description.trim() || saving}
            className="w-full bg-sky-600 hover:bg-sky-700 h-9"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Save to Records
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            placeholder="Medication name"
            value={medForm.medication_name}
            onChange={(e) => setMedForm({ ...medForm, medication_name: e.target.value })}
            className="h-9 text-sm"
          />
          <Select value={medForm.change_type} onValueChange={(v) => setMedForm({ ...medForm, change_type: v })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {medChangeTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Describe the change or side effect..."
            value={medForm.details}
            onChange={(e) => setMedForm({ ...medForm, details: e.target.value })}
            rows={2}
            className="resize-none text-sm"
          />
          <Button
            onClick={handleSaveMedication}
            disabled={!medForm.medication_name.trim() || !medForm.details.trim() || saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-9"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Save to Records
          </Button>
        </div>
      )}
    </Card>
  );
}