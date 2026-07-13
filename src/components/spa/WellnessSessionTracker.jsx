import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Loader2, Brain, Hand, Leaf, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const categoryConfig = {
  spa_treatment: { label: "Spa Treatment", icon: Hand, color: "text-pink-600", bg: "bg-pink-100" },
  meditation: { label: "Meditation", icon: Brain, color: "text-purple-600", bg: "bg-purple-100" },
  relaxation_ritual: { label: "Relaxation Ritual", icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-100" },
};

const sessionTypes = {
  spa_treatment: ["Swedish Massage", "Deep Tissue", "Hot Stone", "Aromatherapy", "Hydrotherapy", "Facial", "Body Wrap", "Reflexology", "Sound Healing", "Acupuncture", "Cold Plunge", "Other"],
  meditation: ["Mindfulness", "Breathing", "Body Scan", "Loving Kindness", "Visualization", "Mantra", "Sound Bath", "Other"],
  relaxation_ritual: ["Morning Ritual", "Evening Wind-Down", "Midday Reset", "Weekend Renewal", "Bath Ritual", "Tea Ceremony", "Other"],
};

const scoreLabels = ["Poor", "Low", "Okay", "Good", "Great"];
const stressLabels = ["Minimal", "Low", "Moderate", "High", "Severe"];

const emptyForm = {
  session_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  session_category: "meditation",
  session_name: "",
  session_type: "Mindfulness",
  duration_minutes: "30",
  mood_before_score: 3,
  mood_after_score: 4,
  stress_before_score: 3,
  stress_after_score: 2,
  notes: "",
};

function ScoreSelector({ label, value, onChange, options }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <div className="flex gap-0.5 mt-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`flex-1 text-[9px] py-1 rounded font-medium transition ${value === n ? "bg-purple-600 text-white" : "bg-muted text-muted-foreground hover:bg-purple-100"}`}>
            {options[n - 1]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WellnessSessionTracker() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await base44.entities.SpaWellnessSession.list("-session_date", 100);
      setSessions(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.session_name.trim() || !form.session_date) return;
    setSaving(true);
    try {
      await base44.entities.SpaWellnessSession.create({
        ...form,
        duration_minutes: parseInt(form.duration_minutes) || 30,
      });
      setForm(emptyForm); setDialogOpen(false); load();
      toast({ title: "Session logged", description: "Your wellness session has been recorded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.SpaWellnessSession.delete(id); load(); } catch (e) { console.error(e); }
  };

  const filtered = filter === "all" ? sessions : sessions.filter((s) => s.session_category === filter);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" /> Wellness Session Tracker
          </h3>
          <p className="text-xs text-muted-foreground">Track meditation, spa treatments, and rituals with before/after scores</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700"><Plus className="w-3.5 h-3.5 mr-1" />Log Session</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Log Wellness Session</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={form.session_category} onValueChange={(v) => setForm({ ...form, session_category: v, session_type: sessionTypes[v][0] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Date & Time</Label>
                  <Input type="datetime-local" value={form.session_date} onChange={(e) => setForm({ ...form, session_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Session Name *</Label>
                <Input placeholder="e.g., Morning Mindfulness" value={form.session_name} onChange={(e) => setForm({ ...form, session_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={form.session_type} onValueChange={(v) => setForm({ ...form, session_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sessionTypes[form.session_category].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Duration (min)</Label>
                  <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
                <p className="text-xs font-semibold text-purple-800">Mood (1=Poor → 5=Great)</p>
                <div className="grid grid-cols-2 gap-3">
                  <ScoreSelector label="Before" value={form.mood_before_score} onChange={(v) => setForm({ ...form, mood_before_score: v })} options={scoreLabels} />
                  <ScoreSelector label="After" value={form.mood_after_score} onChange={(v) => setForm({ ...form, mood_after_score: v })} options={scoreLabels} />
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                <p className="text-xs font-semibold text-blue-800">Stress (1=Minimal → 5=Severe)</p>
                <div className="grid grid-cols-2 gap-3">
                  <ScoreSelector label="Before" value={form.stress_before_score} onChange={(v) => setForm({ ...form, stress_before_score: v })} options={stressLabels} />
                  <ScoreSelector label="After" value={form.stress_after_score} onChange={(v) => setForm({ ...form, stress_after_score: v })} options={stressLabels} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea placeholder="How did you feel? What worked well?" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
              </div>
              <Button onClick={handleSave} disabled={!form.session_name.trim() || saving} className="w-full bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-1.5 mb-3">
        {["all", "meditation", "spa_treatment", "relaxation_ritual"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition ${filter === f ? "bg-purple-600 text-white" : "bg-muted text-muted-foreground hover:bg-purple-100"}`}>
            {f === "all" ? "All" : categoryConfig[f].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No sessions logged yet</p>
          <p className="text-xs text-muted-foreground mt-1">Track your meditation, spa treatments, and relaxation rituals.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s, i) => {
            const cat = categoryConfig[s.session_category] || categoryConfig.spa_treatment;
            const Icon = cat.icon;
            const moodDelta = (s.mood_after_score || 0) - (s.mood_before_score || 0);
            const stressDelta = (s.stress_before_score || 0) - (s.stress_after_score || 0);
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                <Card className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${cat.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{s.session_name}</p>
                        <Badge variant="outline" className="text-[9px]">{s.session_type}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(s.session_date), "MMM d, yyyy h:mm a")} • {s.duration_minutes}m
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-muted-foreground">Mood:</span>
                          <span className="font-medium">{scoreLabels[(s.mood_before_score || 3) - 1]}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium text-purple-600">{scoreLabels[(s.mood_after_score || 4) - 1]}</span>
                          {moodDelta > 0 && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-muted-foreground">Stress:</span>
                          <span className="font-medium">{stressLabels[(s.stress_before_score || 3) - 1]}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium text-blue-600">{stressLabels[(s.stress_after_score || 2) - 1]}</span>
                          {stressDelta > 0 && <TrendingDown className="w-3 h-3 text-emerald-500" />}
                        </div>
                      </div>
                      {s.notes && <p className="text-[10px] text-muted-foreground mt-1 italic">{s.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 shrink-0" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}