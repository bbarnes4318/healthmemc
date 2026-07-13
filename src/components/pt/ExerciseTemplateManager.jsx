import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, Bookmark, Zap, Volume2, Square, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const bodyParts = [
  { value: "knee", label: "Knee" }, { value: "shoulder", label: "Shoulder" },
  { value: "hip", label: "Hip" }, { value: "spine", label: "Spine" },
  { value: "ankle", label: "Ankle" }, { value: "wrist", label: "Wrist" },
  { value: "neck", label: "Neck" }, { value: "full_body", label: "Full Body" },
  { value: "other", label: "Other" },
];

const emptyTemplate = {
  template_name: "", exercise_name: "", body_part: "knee",
  difficulty: "medium", intensity: "moderate",
  sets: "", reps: "", duration_minutes: "", rom_degrees: "", default_pain_level: "", notes: "",
};

export default function ExerciseTemplateManager() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quickLog, setQuickLog] = useState(null);
  const [form, setForm] = useState(emptyTemplate);
  const [editingId, setEditingId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);

  const load = async () => {
    try {
      const data = await base44.entities.ExerciseTemplate.list("-created_date", 200);
      setTemplates(currentMemberId ? data.filter((t) => t.family_member_id === currentMemberId) : data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const handleSave = async () => {
    if (!form.template_name.trim() || !form.exercise_name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        sets: form.sets ? parseInt(form.sets) : undefined,
        reps: form.reps ? parseInt(form.reps) : undefined,
        duration_minutes: form.duration_minutes ? parseFloat(form.duration_minutes) : undefined,
        rom_degrees: form.rom_degrees ? parseFloat(form.rom_degrees) : undefined,
        default_pain_level: form.default_pain_level ? parseInt(form.default_pain_level) : undefined,
        family_member_id: currentMemberId || undefined,
      };
      if (editingId) {
        await base44.entities.ExerciseTemplate.update(editingId, payload);
      } else {
        await base44.entities.ExerciseTemplate.create(payload);
      }
      setForm(emptyTemplate);
      setEditingId(null);
      setDialogOpen(false);
      load();
      toast({ title: editingId ? "Template updated" : "Template saved" });
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleQuickLog = async (template) => {
    setQuickLog(template.id);
    try {
      await base44.entities.ExerciseLog.create({
        exercise_name: template.exercise_name,
        body_part: template.body_part,
        difficulty: template.difficulty || "medium",
        intensity: template.intensity || "moderate",
        sets: template.sets,
        reps: template.reps,
        duration_minutes: template.duration_minutes,
        rom_degrees: template.rom_degrees,
        pain_level: template.default_pain_level,
        notes: template.notes,
        date: format(new Date(), "yyyy-MM-dd"),
        family_member_id: currentMemberId || undefined,
      });
      toast({ title: "Exercise logged", description: `${template.exercise_name} added to today's log` });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to log", variant: "destructive" });
    }
    setQuickLog(null);
  };

  const handleEdit = (template) => {
    setForm({
      template_name: template.template_name || "",
      exercise_name: template.exercise_name || "",
      body_part: template.body_part || "knee",
      difficulty: template.difficulty || "medium",
      intensity: template.intensity || "moderate",
      sets: template.sets?.toString() || "",
      reps: template.reps?.toString() || "",
      duration_minutes: template.duration_minutes?.toString() || "",
      rom_degrees: template.rom_degrees?.toString() || "",
      default_pain_level: template.default_pain_level?.toString() || "",
      notes: template.notes || "",
    });
    setEditingId(template.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.ExerciseTemplate.delete(id); load(); } catch (e) { console.error(e); }
  };

  const speak = (template) => {
    if (!window.speechSynthesis) return;
    if (speakingId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    const parts = [
      template.template_name,
      `${template.exercise_name}`,
      template.body_part ? `for ${bodyParts.find((b) => b.value === template.body_part)?.label || template.body_part}` : "",
      template.sets && template.reps ? `${template.sets} sets of ${template.reps} reps` : "",
      template.duration_minutes ? `${template.duration_minutes} minutes` : "",
      template.rom_degrees ? `target range of motion ${template.rom_degrees} degrees` : "",
      template.difficulty ? `${template.difficulty} difficulty` : "",
      template.notes || "",
    ].filter(Boolean);
    const utterance = new SpeechSynthesisUtterance(parts.join(". "));
    utterance.onend = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingId(template.id);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-orange-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-orange-600" /> Exercise Templates
          </h3>
          <p className="text-xs text-muted-foreground">Save routines for one-click logging · {currentMemberName}</p>
        </div>
        <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => { setForm(emptyTemplate); setEditingId(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-1.5" /> New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="p-8 text-center">
          <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No exercise templates yet</p>
          <p className="text-xs text-muted-foreground mt-1">Save your favorite routines to log them instantly with one click.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {templates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
              <Card className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <Bookmark className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.template_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.exercise_name} · {bodyParts.find((b) => b.value === t.body_part)?.label || t.body_part}
                      {t.sets ? ` · ${t.sets}×${t.reps || ""}` : ""}
                      {t.duration_minutes ? ` · ${t.duration_minutes}min` : ""}
                      {t.rom_degrees ? ` · ${t.rom_degrees}° ROM` : ""}
                    </p>
                    {t.notes && <p className="text-[10px] text-muted-foreground italic truncate mt-0.5">{t.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-sky-500 hover:text-sky-700" onClick={() => speak(t)}>
                      {speakingId === t.id ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => handleEdit(t)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" className="h-7 bg-orange-600 hover:bg-orange-700" disabled={quickLog === t.id} onClick={() => handleQuickLog(t)}>
                      {quickLog === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Zap className="w-3.5 h-3.5 mr-1" />Log</>}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onValueChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Template" : "New Exercise Template"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Template Name *</Label>
              <Input placeholder="e.g., Morning Knee Routine" value={form.template_name} onChange={(e) => setForm({ ...form, template_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Exercise Name *</Label>
              <Input placeholder="e.g., Knee flexion stretch" value={form.exercise_name} onChange={(e) => setForm({ ...form, exercise_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Body Part *</Label>
                <Select value={form.body_part} onValueChange={(v) => setForm({ ...form, body_part: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{bodyParts.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Intensity</Label>
              <Select value={form.intensity} onValueChange={(v) => setForm({ ...form, intensity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Sets</Label><Input type="number" placeholder="3" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} /></div>
              <div><Label className="text-xs">Reps</Label><Input type="number" placeholder="10" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Duration (min)</Label><Input type="number" placeholder="15" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} /></div>
              <div><Label className="text-xs">ROM (°)</Label><Input type="number" placeholder="90" value={form.rom_degrees} onChange={(e) => setForm({ ...form, rom_degrees: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-xs">Default Pain Level (0-10)</Label>
              <Input type="number" min="0" max="10" placeholder="2" value={form.default_pain_level} onChange={(e) => setForm({ ...form, default_pain_level: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Instructions, form cues, reminders..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.template_name.trim() || !form.exercise_name.trim() || saving} className="bg-orange-600 hover:bg-orange-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingId ? "Update" : "Save"} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}