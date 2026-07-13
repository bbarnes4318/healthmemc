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
import { format, differenceInDays } from "date-fns";

const woundStatusConfig = {
  clean_healing: "Clean & Healing", redness: "Redness", swelling: "Swelling",
  discharge: "Discharge", dehiscence: "Wound Opening", infection: "Infection Signs", fully_healed: "Fully Healed",
};
const mobilityConfig = {
  bedridden: "Bedridden", limited_assistance: "Limited Assistance", with_walker: "With Walker",
  independent_limited: "Independent", fully_mobile: "Fully Mobile",
};

const emptyTemplate = {
  template_name: "", surgery_name: "", pain_level: 3, pain_type: "aching",
  wound_status: "clean_healing", mobility_level: "limited_assistance",
  activity_type: "walking", activity_duration_minutes: "", rom_flexion: "", rom_extension: "",
  rom_abduction: "", medications_taken: "", notes: "",
};

export default function RecoveryLogTemplateManager() {
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
      const data = await base44.entities.RecoveryLogTemplate.list("-created_date", 200);
      setTemplates(currentMemberId ? data.filter((t) => t.family_member_id === currentMemberId) : data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const handleSave = async () => {
    if (!form.template_name.trim() || !form.surgery_name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        pain_level: parseInt(form.pain_level),
        activity_duration_minutes: form.activity_duration_minutes ? parseInt(form.activity_duration_minutes) : undefined,
        rom_flexion: form.rom_flexion ? parseFloat(form.rom_flexion) : undefined,
        rom_extension: form.rom_extension ? parseFloat(form.rom_extension) : undefined,
        rom_abduction: form.rom_abduction ? parseFloat(form.rom_abduction) : undefined,
        family_member_id: currentMemberId || undefined,
      };
      if (editingId) {
        await base44.entities.RecoveryLogTemplate.update(editingId, payload);
      } else {
        await base44.entities.RecoveryLogTemplate.create(payload);
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
      const today = format(new Date(), "yyyy-MM-dd");
      const surgeryDate = template.surgery_name ? today : today;
      const daysPostOp = differenceInDays(new Date(today), new Date(surgeryDate));
      await base44.entities.SurgicalRecovery.create({
        surgery_name: template.surgery_name,
        surgery_date: surgeryDate,
        log_date: today,
        days_post_op: daysPostOp,
        pain_level: template.pain_level,
        pain_type: template.pain_type,
        wound_status: template.wound_status,
        mobility_level: template.mobility_level,
        activity_type: template.activity_type,
        activity_duration_minutes: template.activity_duration_minutes,
        rom_flexion: template.rom_flexion,
        rom_extension: template.rom_extension,
        rom_abduction: template.rom_abduction,
        medications_taken: template.medications_taken,
        notes: template.notes,
        family_member_id: currentMemberId || undefined,
      });
      toast({ title: "Recovery entry logged", description: `${template.template_name} applied to today` });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to log", variant: "destructive" });
    }
    setQuickLog(null);
  };

  const handleEdit = (template) => {
    setForm({
      template_name: template.template_name || "",
      surgery_name: template.surgery_name || "",
      pain_level: template.pain_level?.toString() || "3",
      pain_type: template.pain_type || "aching",
      wound_status: template.wound_status || "clean_healing",
      mobility_level: template.mobility_level || "limited_assistance",
      activity_type: template.activity_type || "walking",
      activity_duration_minutes: template.activity_duration_minutes?.toString() || "",
      rom_flexion: template.rom_flexion?.toString() || "",
      rom_extension: template.rom_extension?.toString() || "",
      rom_abduction: template.rom_abduction?.toString() || "",
      medications_taken: template.medications_taken || "",
      notes: template.notes || "",
    });
    setEditingId(template.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.RecoveryLogTemplate.delete(id); load(); } catch (e) { console.error(e); }
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
      `Surgery: ${template.surgery_name}`,
      `Pain level: ${template.pain_level} out of 10`,
      template.pain_type ? `Pain type: ${template.pain_type}` : "",
      template.wound_status ? `Wound status: ${woundStatusConfig[template.wound_status] || template.wound_status}` : "",
      template.mobility_level ? `Mobility: ${mobilityConfig[template.mobility_level] || template.mobility_level}` : "",
      template.activity_type ? `Activity: ${template.activity_type.replace(/_/g, " ")}` : "",
      template.activity_duration_minutes ? `${template.activity_duration_minutes} minutes` : "",
      template.medications_taken ? `Medications: ${template.medications_taken}` : "",
      template.notes || "",
    ].filter(Boolean);
    const utterance = new SpeechSynthesisUtterance(parts.join(". "));
    utterance.onend = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingId(template.id);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-rose-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-rose-600" /> Recovery Log Templates
          </h3>
          <p className="text-xs text-muted-foreground">Save common pain notes for one-click logging · {currentMemberName}</p>
        </div>
        <Button size="sm" className="bg-rose-600 hover:bg-rose-700" onClick={() => { setForm(emptyTemplate); setEditingId(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-1.5" /> New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="p-8 text-center">
          <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No recovery templates yet</p>
          <p className="text-xs text-muted-foreground mt-1">Save your common pain notes and recovery states to log daily progress instantly.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {templates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
              <Card className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                    <Bookmark className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.template_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.surgery_name} · Pain {t.pain_level}/10 · {woundStatusConfig[t.wound_status] || t.wound_status}
                      {t.mobility_level ? ` · ${mobilityConfig[t.mobility_level] || t.mobility_level}` : ""}
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
                    <Button size="sm" className="h-7 bg-rose-600 hover:bg-rose-700" disabled={quickLog === t.id} onClick={() => handleQuickLog(t)}>
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
          <DialogHeader><DialogTitle>{editingId ? "Edit Template" : "New Recovery Template"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Template Name *</Label>
              <Input placeholder="e.g., Good Recovery Day" value={form.template_name} onChange={(e) => setForm({ ...form, template_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Surgery Name *</Label>
              <Input placeholder="e.g., Knee Replacement" value={form.surgery_name} onChange={(e) => setForm({ ...form, surgery_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Pain Level: {form.pain_level}/10</Label>
              <input type="range" min="0" max="10" value={form.pain_level} onChange={(e) => setForm({ ...form, pain_level: parseInt(e.target.value) })} className="w-full mt-2 accent-rose-600" />
              <div className="flex justify-between text-[10px] text-muted-foreground"><span>No pain</span><span>Moderate</span><span>Severe</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Pain Type</Label>
                <Select value={form.pain_type} onValueChange={(v) => setForm({ ...form, pain_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["aching", "sharp", "throbbing", "burning", "stinging", "stiffness", "other"].map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Wound Status</Label>
                <Select value={form.wound_status} onValueChange={(v) => setForm({ ...form, wound_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(woundStatusConfig).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Mobility Level</Label>
              <Select value={form.mobility_level} onValueChange={(v) => setForm({ ...form, mobility_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(mobilityConfig).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Activity Type</Label>
                <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["walking", "physical_therapy", "stretching", "strengthening", "cycling", "swimming", "other"].map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Activity Duration (min)</Label><Input type="number" placeholder="30" value={form.activity_duration_minutes} onChange={(e) => setForm({ ...form, activity_duration_minutes: e.target.value })} /></div>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <p className="text-xs font-medium text-rose-700 mb-2">Range of Motion (degrees)</p>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Flexion°</Label><Input type="number" placeholder="90" value={form.rom_flexion} onChange={(e) => setForm({ ...form, rom_flexion: e.target.value })} /></div>
                <div><Label className="text-xs">Extension°</Label><Input type="number" placeholder="-5" value={form.rom_extension} onChange={(e) => setForm({ ...form, rom_extension: e.target.value })} /></div>
                <div><Label className="text-xs">Abduction°</Label><Input type="number" placeholder="45" value={form.rom_abduction} onChange={(e) => setForm({ ...form, rom_abduction: e.target.value })} /></div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Medications Taken</Label>
              <Input placeholder="Pain meds, antibiotics" value={form.medications_taken} onChange={(e) => setForm({ ...form, medications_taken: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Common pain notes, how you're feeling..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.template_name.trim() || !form.surgery_name.trim() || saving} className="bg-rose-600 hover:bg-rose-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingId ? "Update" : "Save"} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}