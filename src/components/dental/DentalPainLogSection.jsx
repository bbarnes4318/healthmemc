import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Loader2, Trash2, Bone as Tooth, AlertCircle, Activity } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const severityColors = {
  mild: "bg-green-100 text-green-700 border-green-200",
  moderate: "bg-amber-100 text-amber-700 border-amber-200",
  severe: "bg-red-100 text-red-700 border-red-200",
};

const painTypeLabels = {
  aching: "Aching", sharp: "Sharp", throbbing: "Throbbing",
  sensitivity: "Sensitivity", burning: "Burning", other: "Other",
};

const gumAreaLabels = {
  upper_left: "Upper Left", upper_front: "Upper Front", upper_right: "Upper Right",
  lower_left: "Lower Left", lower_front: "Lower Front", lower_right: "Lower Right",
};

const emptyForm = {
  severity: "mild",
  pain_type: "aching",
  pain_teeth: [],
  gum_pain_areas: [],
  duration: "",
  notes: "",
};

export default function DentalPainLogSection() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toothInput, setToothInput] = useState("");
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await base44.entities.DentalPainLog.list("-created_date", 100);
      setLogs(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addTooth = () => {
    const num = parseInt(toothInput);
    if (num >= 1 && num <= 32 && !form.pain_teeth.includes(num)) {
      setForm({ ...form, pain_teeth: [...form.pain_teeth, num].sort((a, b) => a - b) });
    }
    setToothInput("");
  };

  const toggleGumArea = (area) => {
    setForm({
      ...form,
      gum_pain_areas: form.gum_pain_areas.includes(area)
        ? form.gum_pain_areas.filter((a) => a !== area)
        : [...form.gum_pain_areas, area],
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.DentalPainLog.create({
        ...form,
        pain_teeth: form.pain_teeth.length > 0 ? form.pain_teeth : undefined,
        gum_pain_areas: form.gum_pain_areas.length > 0 ? form.gum_pain_areas : undefined,
        logged_at: new Date().toISOString(),
      });
      setForm(emptyForm);
      setDialogOpen(false);
      load();
      toast({ title: "Pain logged", description: "Your dental pain entry has been recorded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.DentalPainLog.delete(id); load(); } catch (e) { console.error(e); }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" /> Dental Pain Tracker
          </h3>
          <p className="text-xs text-muted-foreground">Record tooth and gum pain by severity</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-1" />Log Pain</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Log Dental Pain</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Severity</Label>
                  <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Pain Type</Label>
                  <Select value={form.pain_type} onValueChange={(v) => setForm({ ...form, pain_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(painTypeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Painful Teeth (1-32)</Label>
                <div className="flex gap-1.5">
                  <Input type="number" min="1" max="32" placeholder="Add tooth #" value={toothInput} onChange={(e) => setToothInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTooth(); } }} className="h-8 w-32" />
                  <Button variant="outline" size="sm" className="h-8" onClick={addTooth}><Plus className="w-3 h-3" /></Button>
                </div>
                {form.pain_teeth.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.pain_teeth.map((num) => (
                      <button key={num} onClick={() => setForm({ ...form, pain_teeth: form.pain_teeth.filter((t) => t !== num) })}
                        className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full flex items-center gap-1 hover:bg-red-200">
                        <Tooth className="w-3 h-3" />#{num}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs">Gum Pain Areas</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(gumAreaLabels).map(([v, l]) => (
                    <button key={v} onClick={() => toggleGumArea(v)}
                      className={`text-xs px-2 py-1.5 rounded-lg border transition ${form.gum_pain_areas.includes(v) ? "bg-cyan-600 border-cyan-600 text-white" : "border-border hover:bg-muted"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs">Duration</Label>
                <Input placeholder="e.g., 2 days, off and on for a week" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea placeholder="Triggers, what makes it better/worse..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full bg-cyan-600 hover:bg-cyan-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Pain Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-600" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No pain entries logged</p>
          <p className="text-xs text-muted-foreground mt-1">Track tooth and gum pain to share with your dentist.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${severityColors[log.severity] || severityColors.mild}`}>{log.severity}</span>
                      <span className="text-[10px] text-muted-foreground">{painTypeLabels[log.pain_type] || log.pain_type}</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(log.logged_at || log.created_date), "MMM d, h:mm a")}</span>
                    </div>
                    {log.pain_teeth?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {log.pain_teeth.map((num) => (
                          <span key={num} className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Tooth className="w-2.5 h-2.5" />#{num}
                          </span>
                        ))}
                      </div>
                    )}
                    {log.gum_pain_areas?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {log.gum_pain_areas.map((area) => (
                          <span key={area} className="text-[10px] bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded-full">{gumAreaLabels[area] || area}</span>
                        ))}
                      </div>
                    )}
                    {log.duration && <p className="text-[10px] text-muted-foreground mt-1">Duration: {log.duration}</p>}
                    {log.notes && <p className="text-[10px] text-muted-foreground mt-1">{log.notes}</p>}
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