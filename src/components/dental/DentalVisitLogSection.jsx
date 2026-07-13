import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Loader2, Trash2, Calendar, Stethoscope, Bone as Tooth, Clock, DollarSign, X, HeartPulse } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DentalTemplateSelector from "@/components/dental/DentalTemplateSelector";
import { painLevelColors } from "@/lib/dentalProcedureTemplates";

const procedureTypes = [
  { value: "cleaning", label: "Cleaning" },
  { value: "filling", label: "Filling" },
  { value: "root_canal", label: "Root Canal" },
  { value: "extraction", label: "Extraction" },
  { value: "crown", label: "Crown" },
  { value: "bridge", label: "Bridge" },
  { value: "implant", label: "Implant" },
  { value: "whitening", label: "Whitening" },
  { value: "x_ray", label: "X-Ray" },
  { value: "examination", label: "Examination" },
  { value: "other", label: "Other" },
];

const procedureTypeLabels = Object.fromEntries(procedureTypes.map((p) => [p.value, p.label]));

const emptyForm = {
  dentist_name: "",
  visit_date: format(new Date(), "yyyy-MM-dd"),
  procedure_type: "examination",
  procedure_notes: "",
  tooth_treated: "",
  tooth_numbers: [],
  follow_up_recommended: false,
  follow_up_date: "",
  follow_up_notes: "",
  recovery_instructions: "",
  cost: "",
  notes: "",
};

export default function DentalVisitLogSection() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toothInput, setToothInput] = useState("");
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await base44.entities.DentalVisitLog.list("-visit_date", 100);
      setLogs(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addTooth = () => {
    const num = parseInt(toothInput);
    if (num >= 1 && num <= 32 && !form.tooth_numbers.includes(num)) {
      setForm({ ...form, tooth_numbers: [...form.tooth_numbers, num].sort((a, b) => a - b) });
    }
    setToothInput("");
  };

  const removeTooth = (num) => {
    setForm({ ...form, tooth_numbers: form.tooth_numbers.filter((t) => t !== num) });
  };

  const handleSave = async () => {
    if (!form.dentist_name.trim() || !form.visit_date) return;
    setSaving(true);
    try {
      await base44.entities.DentalVisitLog.create({
        ...form,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        tooth_numbers: form.tooth_numbers.length > 0 ? form.tooth_numbers : undefined,
        follow_up_date: form.follow_up_date || undefined,
      });
      setForm(emptyForm); setDialogOpen(false); load();
      toast({ title: "Dental visit logged", description: "Procedure notes and follow-up saved." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.DentalVisitLog.delete(id); load(); } catch (e) { console.error(e); }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Tooth className="w-4 h-4 text-cyan-600" /> Dental Visit Log
          </h3>
          <p className="text-xs text-muted-foreground">Track procedures, treated teeth, and follow-ups</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-1" />Log Visit</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Log Dental Visit</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between gap-2 p-2.5 bg-cyan-50 rounded-lg border border-cyan-200">
                <span className="text-xs text-cyan-700 font-medium">Pre-fill from a procedure template</span>
                <DentalTemplateSelector onApply={(tpl) => setForm({
                  ...form,
                  procedure_type: tpl.procedure_type,
                  procedure_notes: tpl.procedure_notes,
                  recovery_instructions: tpl.recovery_instructions,
                  follow_up_recommended: tpl.follow_up_recommended,
                  follow_up_notes: tpl.follow_up_notes,
                  cost: tpl.typical_cost ? String(tpl.typical_cost) : "",
                  _templatePainLevel: tpl.typical_pain_level,
                })} />
              </div>
              {form._templatePainLevel && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Typical pain level for this procedure:</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${painLevelColors[form._templatePainLevel] || ""}`}>{form._templatePainLevel}</span>
                  <span className="text-[10px] text-muted-foreground">(Log actual pain in the Pain Log tab)</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Dentist Name *</Label>
                  <Input placeholder="Dr. Smith" value={form.dentist_name} onChange={(e) => setForm({ ...form, dentist_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Visit Date *</Label>
                  <Input type="date" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Procedure Type</Label>
                <Select value={form.procedure_type} onValueChange={(v) => setForm({ ...form, procedure_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {procedureTypes.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Procedure Details</Label>
                <Textarea placeholder="e.g., Composite filling on #14, deep cleaning upper right quadrant..." value={form.procedure_notes} onChange={(e) => setForm({ ...form, procedure_notes: e.target.value })} rows={2} className="resize-none" />
              </div>
              <div>
                <Label className="text-xs">Tooth Numbers Treated (1-32)</Label>
                <div className="flex gap-1.5">
                  <Input type="number" min="1" max="32" placeholder="Add tooth #" value={toothInput} onChange={(e) => setToothInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTooth(); } }} className="h-8 w-32" />
                  <Button variant="outline" size="sm" className="h-8" onClick={addTooth}><Plus className="w-3 h-3" /></Button>
                </div>
                {form.tooth_numbers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tooth_numbers.map((num) => (
                      <button key={num} onClick={() => removeTooth(num)} className="text-xs px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full flex items-center gap-1 hover:bg-red-100 hover:text-red-700">
                        <Tooth className="w-3 h-3" />#{num} <X className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Cost ($)</Label>
                  <Input type="number" placeholder="150" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 pb-2 cursor-pointer">
                    <input type="checkbox" checked={form.follow_up_recommended} onChange={(e) => setForm({ ...form, follow_up_recommended: e.target.checked })} className="w-4 h-4" />
                    <span className="text-xs font-medium">Follow-up recommended</span>
                  </label>
                </div>
              </div>
              {form.follow_up_recommended && (
                <div className="space-y-2 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                  <div>
                    <Label className="text-xs">Follow-up Date</Label>
                    <Input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Follow-up Notes</Label>
                    <Input placeholder="e.g., Check healing, remove stitches" value={form.follow_up_notes} onChange={(e) => setForm({ ...form, follow_up_notes: e.target.value })} />
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs">Recovery Instructions</Label>
                <Textarea placeholder="e.g., Avoid hard foods for 24hrs, rinse with salt water, take ibuprofen as needed..." value={form.recovery_instructions} onChange={(e) => setForm({ ...form, recovery_instructions: e.target.value })} rows={2} className="resize-none" />
              </div>
              <div>
                <Label className="text-xs">Additional Notes</Label>
                <Textarea placeholder="Any other details..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
              </div>
              <Button onClick={handleSave} disabled={!form.dentist_name.trim() || !form.visit_date || saving} className="w-full bg-cyan-600 hover:bg-cyan-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Visit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-600" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8">
          <Tooth className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No dental visits logged yet</p>
          <p className="text-xs text-muted-foreground mt-1">Track procedures, treated teeth, and dentist follow-up recommendations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{log.dentist_name}</p>
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />{format(new Date(log.visit_date), "MMM d, yyyy")}
                      </span>
                      {log.cost != null && (
                        <Badge variant="outline" className="text-[10px]"><DollarSign className="w-2.5 h-2.5" />{log.cost}</Badge>
                      )}
                    </div>
                    {log.procedure_type && (
                      <Badge variant="outline" className="text-[10px] bg-cyan-50 text-cyan-700 border-cyan-200">{procedureTypeLabels[log.procedure_type] || log.procedure_type}</Badge>
                    )}
                    {log.procedure_notes && <p className="text-xs text-muted-foreground mt-1">{log.procedure_notes}</p>}
                    {log.tooth_numbers?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {log.tooth_numbers.map((num) => (
                          <span key={num} className="text-[10px] bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Tooth className="w-2.5 h-2.5" />#{num}
                          </span>
                        ))}
                      </div>
                    )}
                    {log.follow_up_recommended && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-amber-800">Follow-up recommended{log.follow_up_date ? `: ${format(new Date(log.follow_up_date), "MMM d, yyyy")}` : ""}</p>
                          {log.follow_up_notes && <p className="text-[10px] text-amber-700 mt-0.5">{log.follow_up_notes}</p>}
                        </div>
                      </div>
                    )}
                    {log.recovery_instructions && (
                      <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
                        <HeartPulse className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-emerald-800">Recovery Instructions</p>
                          <p className="text-[10px] text-emerald-700 mt-0.5">{log.recovery_instructions}</p>
                        </div>
                      </div>
                    )}
                    {log.notes && <p className="text-[10px] text-muted-foreground mt-2">{log.notes}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 shrink-0" onClick={() => handleDelete(log.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}