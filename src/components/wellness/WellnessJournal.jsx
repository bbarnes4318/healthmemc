import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, BookHeart, Moon, Brain, Heart, Trash2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import MoodTrendChart from "@/components/wellness/MoodTrendChart";
import { Label } from "@/components/ui/label";
import VoiceInputButton from "@/components/voice/VoiceInputButton";

const moodOptions = [
  { value: "great", emoji: "😄", label: "Great", score: 5, color: "bg-emerald-500" },
  { value: "good", emoji: "🙂", label: "Good", score: 4, color: "bg-lime-500" },
  { value: "okay", emoji: "😐", label: "Okay", score: 3, color: "bg-amber-500" },
  { value: "low", emoji: "😔", label: "Low", score: 2, color: "bg-orange-500" },
  { value: "poor", emoji: "😢", label: "Poor", score: 1, color: "bg-red-500" },
];

const stressOptions = [
  { value: "minimal", label: "Minimal", score: 1, color: "bg-emerald-500" },
  { value: "low", label: "Low", score: 2, color: "bg-lime-500" },
  { value: "moderate", label: "Moderate", score: 3, color: "bg-amber-500" },
  { value: "high", label: "High", score: 4, color: "bg-orange-500" },
  { value: "severe", label: "Severe", score: 5, color: "bg-red-500" },
];

const sleepOptions = [
  { value: "excellent", label: "Excellent", score: 5, color: "bg-emerald-500" },
  { value: "good", label: "Good", score: 4, color: "bg-lime-500" },
  { value: "fair", label: "Fair", score: 3, color: "bg-amber-500" },
  { value: "poor", label: "Poor", score: 2, color: "bg-orange-500" },
  { value: "terrible", label: "Terrible", score: 1, color: "bg-red-500" },
];

const getMood = (v) => moodOptions.find((m) => m.value === v) || moodOptions[2];
const getStress = (v) => stressOptions.find((s) => s.value === v) || stressOptions[2];
const getSleep = (v) => sleepOptions.find((s) => s.value === v) || sleepOptions[2];

export default function WellnessJournal() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  const [form, setForm] = useState({
    date: today,
    mood: "okay",
    stress_level: "moderate",
    sleep_quality: "fair",
    sleep_hours: "",
    notes: "",
    gratitude: "",
  });

  const loadEntries = async () => {
    try {
      const data = await base44.entities.WellnessJournal.list("-date", 100);
      const filtered = currentMemberId ? data.filter((e) => e.family_member_id === currentMemberId) : data.filter((e) => !e.family_member_id);
      setEntries(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadEntries(); }, [currentMemberId]);

  const todayEntry = useMemo(() => entries.find((e) => e.date === today), [entries, today]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const mood = getMood(form.mood);
      const stress = getStress(form.stress_level);
      const sleep = getSleep(form.sleep_quality);
      const payload = {
        ...form,
        date: form.date || today,
        mood_score: mood.score,
        stress_score: stress.score,
        sleep_score: sleep.score,
        sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : undefined,
        family_member_id: currentMemberId || undefined,
      };
      if (todayEntry) {
        await base44.entities.WellnessJournal.update(todayEntry.id, payload);
      } else {
        await base44.entities.WellnessJournal.create(payload);
      }
      toast({ title: "Journal entry saved", description: "Your wellness check-in is recorded." });
      setShowForm(false);
      loadEntries();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save entry", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.WellnessJournal.delete(id);
      loadEntries();
      toast({ title: "Entry deleted" });
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return <Card className="p-6"><div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Header + New Entry Button */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <BookHeart className="w-4 h-4 text-violet-600" />
          Mental Wellness Journal
        </h3>
        {!showForm && (
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={() => { setForm({ ...form, date: today }); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> {todayEntry ? "Update Today" : "New Entry"}
          </Button>
        )}
      </div>

      {/* New/Edit Entry Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <Card className="p-5 space-y-4">
            {/* Mood */}
            <div>
              <Label className="text-xs font-medium flex items-center gap-1.5 mb-2"><Heart className="w-3.5 h-3.5 text-rose-500" /> How is your mood today?</Label>
              <div className="flex gap-2 justify-between">
                {moodOptions.map((m) => (
                  <button key={m.value} onClick={() => setForm({ ...form, mood: m.value })}
                    className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition ${form.mood === m.value ? `${m.color} border-transparent text-white` : "border-border hover:bg-muted"}`}>
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-[10px] font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stress */}
            <div>
              <Label className="text-xs font-medium flex items-center gap-1.5 mb-2"><Brain className="w-3.5 h-3.5 text-orange-500" /> Stress level</Label>
              <div className="flex gap-2 justify-between">
                {stressOptions.map((s) => (
                  <button key={s.value} onClick={() => setForm({ ...form, stress_level: s.value })}
                    className={`flex-1 p-2 rounded-lg border-2 text-center transition ${form.stress_level === s.value ? `${s.color} border-transparent text-white` : "border-border hover:bg-muted"}`}>
                    <span className="text-[10px] font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5 mb-2"><Moon className="w-3.5 h-3.5 text-indigo-500" /> Sleep quality</Label>
                <div className="flex flex-col gap-1.5">
                  {sleepOptions.map((s) => (
                    <button key={s.value} onClick={() => setForm({ ...form, sleep_quality: s.value })}
                      className={`p-1.5 rounded-lg border text-left text-xs transition ${form.sleep_quality === s.value ? `${s.color} border-transparent text-white` : "border-border hover:bg-muted"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium mb-2 block">Hours slept</Label>
                <Input type="number" step="0.5" placeholder="e.g., 7.5" value={form.sleep_hours} onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })} />
              </div>
            </div>

            {/* Notes & Gratitude */}
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Notes (optional)</Label>
              <div className="flex gap-2">
                <Textarea placeholder="What's on your mind? Any events or triggers today..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none text-sm" />
                <VoiceInputButton value={form.notes} onChange={(text) => setForm({ ...form, notes: text })} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium flex items-center gap-1.5 mb-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Gratitude (optional)</Label>
              <div className="flex gap-2">
                <Textarea placeholder="One thing you're grateful for today..." value={form.gratitude} onChange={(e) => setForm({ ...form, gratitude: e.target.value })} rows={1} className="resize-none text-sm" />
                <VoiceInputButton value={form.gratitude} onChange={(text) => setForm({ ...form, gratitude: text })} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {todayEntry ? "Update Entry" : "Save Entry"}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Monthly Trend Chart */}
      <MoodTrendChart entries={entries} />

      {/* Recent Entries */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Recent Entries</h4>
        {entries.length === 0 ? (
          <Card className="p-6 text-center">
            <BookHeart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No journal entries yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start tracking your mental well-being today.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 10).map((entry, i) => {
              const m = getMood(entry.mood);
              const s = getStress(entry.stress_level);
              const sl = getSleep(entry.sleep_quality);
              return (
                <motion.div key={entry.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <Card className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg ${m.color} flex items-center justify-center text-lg shrink-0`}>{m.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold">{format(new Date(entry.date), "EEE, MMM d")}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${s.color} text-white`}>Stress: {s.label}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${sl.color} text-white`}>Sleep: {sl.label}</span>
                          {entry.sleep_hours && <span className="text-[9px] text-muted-foreground">{entry.sleep_hours}h</span>}
                        </div>
                        {entry.notes && <p className="text-xs text-muted-foreground line-clamp-2">{entry.notes}</p>}
                        {entry.gratitude && <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1"><Sparkles className="w-3 h-3" />{entry.gratitude}</p>}
                      </div>
                      <button onClick={() => handleDelete(entry.id)} className="text-muted-foreground hover:text-red-500 transition shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}