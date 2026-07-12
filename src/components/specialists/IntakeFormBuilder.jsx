import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  ClipboardList, Plus, Loader2, Trash2, FileText, Save, Edit3, Copy,
  Calendar, CheckCircle2, Wand2, Eye,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const emptyForm = {
  template_name: "",
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

const fieldLabels = {
  chief_complaint: "Chief Complaint",
  symptom_duration: "Symptom Duration",
  symptom_severity: "Severity",
  current_medications: "Current Medications",
  allergies: "Allergies",
  medical_history: "Medical History",
  surgical_history: "Surgical History",
  family_history: "Family History",
  lifestyle_notes: "Lifestyle Notes",
  questions_for_provider: "Questions for Provider",
};

export default function IntakeFormBuilder() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState(null);

  const load = async () => {
    try {
      const data = await base44.entities.IntakeTemplate.list("-created_date", 100);
      setTemplates(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.template_name.trim() || !form.chief_complaint.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await base44.entities.IntakeTemplate.update(editingId, { ...form });
        toast({ title: "Template updated" });
      } else {
        await base44.entities.IntakeTemplate.create({ ...form });
        toast({ title: "Template created", description: `"${form.template_name}" is ready to use before appointments.` });
      }
      setForm(emptyForm);
      setEditingId(null);
      setDialogOpen(false);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleEdit = (template) => {
    setForm({
      template_name: template.template_name || "",
      chief_complaint: template.chief_complaint || "",
      symptom_duration: template.symptom_duration || "",
      symptom_severity: template.symptom_severity || "moderate",
      current_medications: template.current_medications || "",
      allergies: template.allergies || "",
      medical_history: template.medical_history || "",
      surgical_history: template.surgical_history || "",
      family_history: template.family_history || "",
      lifestyle_notes: template.lifestyle_notes || "",
      questions_for_provider: template.questions_for_provider || "",
    });
    setEditingId(template.id);
    setDialogOpen(true);
  };

  const handleDuplicate = async (template) => {
    try {
      await base44.entities.IntakeTemplate.create({
        ...template,
        template_name: `${template.template_name} (Copy)`,
      });
      load();
      toast({ title: "Template duplicated" });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try { await base44.entities.IntakeTemplate.delete(id); load(); } catch (e) { console.error(e); }
  };

  const handleAutoFill = async () => {
    setAutoFilling(true);
    try {
      const [profiles, meds] = await Promise.all([
        base44.entities.HealthProfile.filter({}),
        base44.entities.Medication.filter({ active: true }),
      ]);
      const hp = profiles[0];
      const updates = {};
      if (meds.length > 0) {
        updates.current_medications = meds.map((m) => `${m.name} ${m.dosage} (${m.frequency})`).join("\n");
      }
      if (hp?.allergies?.length > 0) {
        updates.allergies = hp.allergies.join(", ");
      }
      if (hp?.chronic_conditions?.length > 0) {
        updates.medical_history = hp.chronic_conditions.join(", ");
      }
      setForm((prev) => ({ ...prev, ...updates }));
      toast({ title: "Auto-filled from your health data" });
    } catch (e) { console.error(e); }
    setAutoFilling(false);
  };

  const handleNewTemplate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">My Templates</h3>
          <p className="text-xs text-muted-foreground">{templates.length} saved template{templates.length !== 1 ? "s" : ""}</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleNewTemplate}>
          <Plus className="w-4 h-4 mr-2" /> New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No templates yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create reusable intake forms to fill out before doctor visits, helping your provider understand your health history.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((template, i) => (
            <motion.div key={template.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate">{template.template_name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{template.chief_complaint}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.symptom_severity && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${template.symptom_severity === "severe" ? "bg-red-100 text-red-700" : template.symptom_severity === "moderate" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                          {template.symptom_severity}
                        </span>
                      )}
                      {template.created_date && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {format(new Date(template.created_date), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setViewingTemplate(template)}>
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleEdit(template)}>
                        <Edit3 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleDuplicate(template)}>
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Template" : "Create Intake Form Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground">Save your health history as a template to quickly fill out before appointments.</p>

            <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg border border-violet-100">
              <Button variant="outline" size="sm" className="text-xs" disabled={autoFilling} onClick={handleAutoFill}>
                {autoFilling ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1.5" />}
                Auto-Fill from Health Data
              </Button>
            </div>

            <div>
              <Label className="text-xs">Template Name *</Label>
              <Input placeholder="e.g., Annual Checkup, Migraine Visit" value={form.template_name} onChange={(e) => setForm({ ...form, template_name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Chief Complaint *</Label>
              <Textarea placeholder="Describe your main concern or symptoms" value={form.chief_complaint} onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })} rows={2} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Symptom Duration</Label>
                <Input placeholder="e.g., 3 days" value={form.symptom_duration} onChange={(e) => setForm({ ...form, symptom_duration: e.target.value })} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Severity</Label>
                <Select value={form.symptom_severity} onValueChange={(v) => setForm({ ...form, symptom_severity: v })}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
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
            <Button variant="ghost" onClick={() => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.template_name.trim() || !form.chief_complaint.trim() || saving} className="bg-violet-600 hover:bg-violet-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingId ? "Update Template" : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Template Dialog */}
      <Dialog open={!!viewingTemplate} onOpenChange={(v) => { if (!v) setViewingTemplate(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-600" />
              {viewingTemplate?.template_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {Object.entries(fieldLabels).map(([key, label]) => {
              const value = viewingTemplate?.[key];
              if (!value) return null;
              return (
                <div key={key} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                  <p className="text-sm mt-0.5 whitespace-pre-wrap">{value}</p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}