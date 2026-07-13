import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, Plus, Trash2, Smile, RotateCw, Baby, Footprints,
  Calendar, Share2, Camera, Sparkles, TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

const milestoneTypes = [
  { value: "first_smile", label: "First Smile", icon: Smile, color: "#f59e0b" },
  { value: "laughing", label: "First Laugh", icon: Smile, color: "#ec4899" },
  { value: "rolling_over", label: "Rolling Over", icon: RotateCw, color: "#3b82f6" },
  { value: "sitting_up", label: "Sitting Up", icon: Baby, color: "#8b5cf6" },
  { value: "crawling", label: "Crawling", icon: Baby, color: "#22c55e" },
  { value: "standing", label: "Standing", icon: TrendingUp, color: "#06b6d4" },
  { value: "first_steps", label: "First Steps", icon: Footprints, color: "#ef4444" },
  { value: "first_words", label: "First Words", icon: Sparkles, color: "#14b8a6" },
  { value: "teething", label: "First Tooth", icon: Smile, color: "#f97316" },
  { value: "solid_food", label: "First Solid Food", icon: Sparkles, color: "#a855f7" },
  { value: "custom", label: "Custom Milestone", icon: Plus, color: "#64748b" },
];

const getMilestoneMeta = (type) => milestoneTypes.find((m) => m.value === type) || milestoneTypes[milestoneTypes.length - 1];

export default function BabyMilestoneTracker() {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("timeline");
  const [form, setForm] = useState({
    baby_name: "",
    milestone_type: "first_smile",
    milestone_date: new Date().toISOString().split("T")[0],
    title: "",
    description: "",
    baby_age_weeks: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.BabyMilestone.list("-milestone_date", 200);
      setMilestones(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.milestone_date) {
      toast({ title: "Date is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const meta = getMilestoneMeta(form.milestone_type);
      const payload = {
        ...form,
        title: form.title.trim() || meta.label,
        baby_age_weeks: form.baby_age_weeks ? Number(form.baby_age_weeks) : null,
      };
      await base44.entities.BabyMilestone.create(payload);
      toast({ title: "Milestone logged!" });
      setForm({ baby_name: form.baby_name, milestone_type: "first_smile", milestone_date: new Date().toISOString().split("T")[0], title: "", description: "", baby_age_weeks: "", notes: "" });
      setShowForm(false);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save milestone", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.BabyMilestone.delete(id);
      toast({ title: "Milestone removed" });
      load();
    } catch (e) { console.error(e); }
  };

  const handleShare = () => {
    if (milestones.length === 0) return;
    const text = milestones.map((m) => {
      const meta = getMilestoneMeta(m.milestone_type);
      return `📅 ${m.milestone_date} — ${m.title || meta.label}${m.baby_name ? ` (${m.baby_name})` : ""}${m.description ? `\n   ${m.description}` : ""}`;
    }).join("\n\n");
    if (navigator.share) {
      navigator.share({ title: "Baby Milestones", text });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Milestone timeline copied to clipboard!" });
    }
  };

  const sorted = [...milestones].sort((a, b) => new Date(a.milestone_date) - new Date(b.milestone_date));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Developmental Milestones</h3>
            <p className="text-xs text-muted-foreground">Track and share your baby's first moments</p>
          </div>
        </div>
        <div className="flex gap-2">
          {milestones.length > 0 && (
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleShare}>
              <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
            </Button>
          )}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs bg-purple-600 hover:bg-purple-700">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Log Milestone
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Log a Milestone
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Milestone Type</label>
                  <select
                    value={form.milestone_type}
                    onChange={(e) => setForm({ ...form, milestone_type: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    {milestoneTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Date *</label>
                    <Input type="date" value={form.milestone_date} onChange={(e) => setForm({ ...form, milestone_date: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Baby Age (weeks)</label>
                    <Input type="number" placeholder="e.g. 16" value={form.baby_age_weeks} onChange={(e) => setForm({ ...form, baby_age_weeks: e.target.value })} className="h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Baby Name</label>
                  <Input placeholder="Baby's name" value={form.baby_name} onChange={(e) => setForm({ ...form, baby_name: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Title (optional)</label>
                  <Input placeholder="e.g. First roll from back to tummy!" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Description</label>
                  <Textarea placeholder="Describe what happened..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="resize-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Notes</label>
                  <Input placeholder="Any extra details" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-9 text-sm" />
                </div>
                <Button onClick={handleAdd} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Save Milestone
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {milestones.length > 1 && (
        <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg w-fit">
          <button onClick={() => setView("timeline")} className={`px-3 py-1 rounded-md text-xs font-medium transition ${view === "timeline" ? "bg-white shadow-sm" : "text-muted-foreground"}`}>Timeline</button>
          <button onClick={() => setView("grid")} className={`px-3 py-1 rounded-md text-xs font-medium transition ${view === "grid" ? "bg-white shadow-sm" : "text-muted-foreground"}`}>Grid</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-8">
          <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No milestones yet</p>
          <p className="text-xs text-muted-foreground mt-1">Log your baby's first smile, roll, word, and more!</p>
        </div>
      ) : view === "timeline" ? (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-300 via-pink-300 to-purple-300" />
          {sorted.map((m, i) => {
            const meta = getMilestoneMeta(m.milestone_type);
            const Icon = meta.icon;
            return (
              <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative mb-4">
                <div className="absolute -left-[18px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white" style={{ backgroundColor: meta.color }}>
                  <Icon className="w-2 h-2 text-white" />
                </div>
                <div className="p-3 rounded-lg border border-border bg-card hover:shadow-sm transition ml-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{m.title || meta.label}</p>
                      {m.baby_age_weeks && <Badge variant="outline" className="text-[9px]">{m.baby_age_weeks}w old</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="w-2.5 h-2.5" /> {m.milestone_date}{m.baby_name && ` · ${m.baby_name}`}
                  </p>
                  {m.description && <p className="text-xs text-muted-foreground mt-1">{m.description}</p>}
                  {m.notes && <p className="text-[10px] text-muted-foreground mt-1 italic">{m.notes}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sorted.map((m, i) => {
            const meta = getMilestoneMeta(m.milestone_type);
            const Icon = meta.icon;
            return (
              <motion.div key={m.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                <div className="p-3 rounded-lg border border-border bg-card text-center hover:shadow-sm transition relative">
                  <Button variant="ghost" size="icon" className="h-5 w-5 absolute top-1 right-1 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="w-2.5 h-2.5" />
                  </Button>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${meta.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <p className="text-xs font-semibold">{m.title || meta.label}</p>
                  <p className="text-[10px] text-muted-foreground">{m.milestone_date}</p>
                  {m.baby_age_weeks && <Badge variant="outline" className="text-[9px] mt-1">{m.baby_age_weeks}w</Badge>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}