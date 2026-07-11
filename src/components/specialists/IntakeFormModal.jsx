import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, ClipboardList, SkipForward } from "lucide-react";
import TemplateLibrary from "@/components/specialists/TemplateLibrary";

const emptyForm = {
  chief_complaint: "",
  symptom_duration: "",
  symptom_severity: "moderate",
  current_medications: "",
  allergies: "",
  medical_history: "",
  surgical_history: "",
  family_history: "",
  lifestyle_notes: "",
  questions_for_provider: "",
};

export default function IntakeFormModal({ open, onOpenChange, specialty, onComplete, onSkip }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.chief_complaint.trim() || !specialty) return;
    setSaving(true);
    try {
      await base44.entities.IntakeForm.create({
        ...form,
        specialty: specialty.name,
        status: "completed",
      });

      const notesLines = [
        `Chief Complaint: ${form.chief_complaint}`,
        form.symptom_duration && `Symptom Duration: ${form.symptom_duration}`,
        `Severity: ${form.symptom_severity}`,
        form.current_medications && `Current Medications: ${form.current_medications}`,
        form.allergies && `Allergies: ${form.allergies}`,
        form.medical_history && `Medical History: ${form.medical_history}`,
        form.surgical_history && `Surgical History: ${form.surgical_history}`,
        form.family_history && `Family History: ${form.family_history}`,
        form.lifestyle_notes && `Lifestyle Notes: ${form.lifestyle_notes}`,
        form.questions_for_provider && `Questions for Provider: ${form.questions_for_provider}`,
      ].filter(Boolean);
      await base44.entities.MedicalRecord.create({
        title: `Pre-Consultation Intake — ${specialty.name}`,
        category: "intake_form",
        date: new Date().toISOString().split("T")[0],
        provider: specialty.name,
        notes: notesLines.join("\n"),
      });

      onComplete(form);
      setForm(emptyForm);
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleSkip = () => {
    setForm(emptyForm);
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-violet-600" />
            Pre-Consultation Intake — {specialty?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <p className="text-xs text-muted-foreground">Fill out this quick form so your AI specialist has context before your consultation. This will be saved to your medical records.</p>

          <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg border border-violet-100">
            <TemplateLibrary form={form} onLoadTemplate={(data) => setForm(data)} />
          </div>

          <div>
            <Label className="text-xs">Chief Complaint *</Label>
            <Textarea placeholder="Describe your main concern or symptoms" value={form.chief_complaint} onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })} rows={2} className="resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Symptom Duration</Label>
              <Input placeholder="e.g., 3 days" value={form.symptom_duration} onChange={(e) => setForm({ ...form, symptom_duration: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Severity</Label>
              <Select value={form.symptom_severity} onValueChange={(v) => setForm({ ...form, symptom_severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Current Medications</Label>
            <Textarea placeholder="List any medications you're taking" value={form.current_medications} onChange={(e) => setForm({ ...form, current_medications: e.target.value })} rows={2} className="resize-none" />
          </div>

          <div>
            <Label className="text-xs">Allergies</Label>
            <Textarea placeholder="Any known allergies" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} rows={1} className="resize-none" />
          </div>

          <div>
            <Label className="text-xs">Medical History</Label>
            <Textarea placeholder="Relevant medical conditions" value={form.medical_history} onChange={(e) => setForm({ ...form, medical_history: e.target.value })} rows={2} className="resize-none" />
          </div>

          <div>
            <Label className="text-xs">Surgical History</Label>
            <Textarea placeholder="Previous surgeries" value={form.surgical_history} onChange={(e) => setForm({ ...form, surgical_history: e.target.value })} rows={1} className="resize-none" />
          </div>

          <div>
            <Label className="text-xs">Family History</Label>
            <Textarea placeholder="Relevant family medical history" value={form.family_history} onChange={(e) => setForm({ ...form, family_history: e.target.value })} rows={1} className="resize-none" />
          </div>

          <div>
            <Label className="text-xs">Lifestyle Notes</Label>
            <Textarea placeholder="Diet, exercise, sleep, stress, etc." value={form.lifestyle_notes} onChange={(e) => setForm({ ...form, lifestyle_notes: e.target.value })} rows={1} className="resize-none" />
          </div>

          <div>
            <Label className="text-xs">Questions for Provider</Label>
            <Textarea placeholder="What would you like to ask?" value={form.questions_for_provider} onChange={(e) => setForm({ ...form, questions_for_provider: e.target.value })} rows={2} className="resize-none" />
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="ghost" onClick={handleSkip} disabled={saving} className="text-muted-foreground">
            <SkipForward className="w-4 h-4 mr-1.5" /> Skip
          </Button>
          <Button onClick={handleSubmit} disabled={!form.chief_complaint.trim() || saving} className="bg-violet-600 hover:bg-violet-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ClipboardList className="w-4 h-4 mr-2" />}
            Submit & Start
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}