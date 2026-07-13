import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Loader2, Heart, Moon, Sun } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const moodOptions = [
  { value: "great", label: "Great", score: 5, emoji: "😊", color: "bg-emerald-100 text-emerald-700" },
  { value: "good", label: "Good", score: 4, emoji: "🙂", color: "bg-lime-100 text-lime-700" },
  { value: "okay", label: "Okay", score: 3, emoji: "😐", color: "bg-yellow-100 text-yellow-700" },
  { value: "low", label: "Low", score: 2, emoji: "😕", color: "bg-orange-100 text-orange-700" },
  { value: "poor", label: "Poor", score: 1, emoji: "😞", color: "bg-red-100 text-red-700" },
];

const stressOptions = [
  { value: "minimal", label: "Minimal", score: 1 },
  { value: "low", label: "Low", score: 2 },
  { value: "moderate", label: "Moderate", score: 3 },
  { value: "high", label: "High", score: 4 },
  { value: "severe", label: "Severe", score: 5 },
];

const sleepOptions = [
  { value: "excellent", label: "Excellent", score: 5 },
  { value: "good", label: "Good", score: 4 },
  { value: "fair", label: "Fair", score: 3 },
  { value: "poor", label: "Poor", score: 2 },
  { value: "terrible", label: "Terrible", score: 1 },
];

const emptyForm = {
  date: format(new Date(), "yyyy-MM-dd"),
  mood: "okay",
  stress_level: "moderate",
  sleep_quality: "fair",
  sleep_hours: "",
  meditation_minutes: "",
  notes: "",
  gratitude: "",
};

function OptionPicker({ label, options, value, onChange }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <div className="flex gap-0.5 mt-0.5">
        {options.map((o) => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={`flex-1 text-[9px] py-1.5 rounded font-medium transition text-center ${value === o.value ? "bg-purple-600 text-white" : "bg-muted text-muted-foreground hover:bg-purple-100"}`}>
            {o.emoji ? `${o.emoji}` : o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RecoveryMoodTracker() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await base44.entities.WellnessJournal.list("-date", 60);
      setEntries(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.date) return;
    setSaving(true);
    try {
      const moodOpt = moodOptions.find((m) => m.value === form.mood);
      const stressOpt = stressOptions.find((s) => s.value === form.stress_level);
      const sleepOpt = sleepOptions.find((s) => s.value === form.sleep_quality);
      await base44.entities.WellnessJournal.create({
        date: form.date,
        mood: form.mood,
        mood_score: moodOpt?.score || 3,
        stress_level: form.stress_level,
        stress_score: stressOpt?.score || 3,
        sleep_quality: form.sleep_quality,
        sleep_score: sleepOpt?.score || 3,
        sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : undefined,
        meditation_minutes: form.meditation_minutes ? parseInt(form.meditation_minutes) : undefined,
        notes: form.notes,
        gratitude: form.gratitude,
      });
      setForm(emptyForm); setDialogOpen(false); load();
      toast({ title: "Mood logged", description: "Your daily recovery scores have been saved." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.WellnessJournal.delete(id); load(); } catch (e) { console.error(e); }
  };

  const getOpt = (arr, val) => arr.find((a) => a.value === val);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-600" /> Recovery Mood Tracker
          </h3>
          <p className="text-xs text-muted-foreground">Daily mood, stress, and sleep scores to monitor your wellness journey</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-pink-600 hover:bg-pink-700"><Plus className="w-3.5 h-3.5 mr-1" />Log Today</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Daily Recovery Mood</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <OptionPicker label="Mood" options={moodOptions} value={form.mood} onChange={(v) => setForm({ ...form, mood: v })} />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <OptionPicker label="Stress Level" options={stressOptions} value={form.stress_level} onChange={(v) => setForm({ ...form, stress_level: v })} />
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <OptionPicker label="Sleep Quality" options={sleepOptions} value={form.sleep_quality} onChange={(v) => setForm({ ...form, sleep_quality: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Sleep Hours</Label>
                  <Input type="number" step="0.5" placeholder="7.5" value={form.sleep_hours} onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Meditation (min)</Label>
                  <Input type="number" placeholder="0" value={form.meditation_minutes} onChange={(e) => setForm({ ...form, meditation_minutes: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Gratitude</Label>
                <Input placeholder="One thing you're grateful for today..." value={form.gratitude} onChange={(e) => setForm({ ...form, gratitude: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea placeholder="How was your day? Any reflections?" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
              </div>
              <Button onClick={handleSave} disabled={!form.date || saving} className="w-full bg-pink-600 hover:bg-pink-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-pink-600" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No mood entries yet</p>
          <p className="text-xs text-muted-foreground mt-1">Log your daily mood, stress, and sleep to track your wellness journey.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const mood = getOpt(moodOptions, entry.mood) || moodOptions[2];
            const stress = getOpt(stressOptions, entry.stress_level) || stressOptions[2];
            const sleep = getOpt(sleepOptions, entry.sleep_quality) || sleepOptions[2];
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                <Card className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">{mood.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{format(new Date(entry.date), "EEEE, MMM d")}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${mood.color}`}>Mood: {mood.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Stress: {stress.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Sleep: {sleep.label}</span>
                        {entry.sleep_hours && <span className="text-[9px] text-muted-foreground">{entry.sleep_hours}h</span>}
                      </div>
                      {entry.gratitude && <p className="text-[10px] text-emerald-600 mt-1">🙏 {entry.gratitude}</p>}
                      {entry.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{entry.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 shrink-0" onClick={() => handleDelete(entry.id)}>
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