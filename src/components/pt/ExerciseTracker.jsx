import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, Dumbbell, TrendingUp, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import VoiceInputButton from "@/components/voice/VoiceInputButton";

const bodyParts = [
  { value: "knee", label: "Knee" },
  { value: "shoulder", label: "Shoulder" },
  { value: "hip", label: "Hip" },
  { value: "spine", label: "Spine" },
  { value: "ankle", label: "Ankle" },
  { value: "wrist", label: "Wrist" },
  { value: "neck", label: "Neck" },
  { value: "full_body", label: "Full Body" },
  { value: "other", label: "Other" },
];

const difficultyColors = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

const emptyExercise = { exercise_name: "", body_part: "knee", difficulty: "medium", intensity: "moderate", sets: "", reps: "", duration_minutes: "", rom_degrees: "", pain_level: "", notes: "" };

const intensityColors = { low: "bg-green-100 text-green-700", moderate: "bg-amber-100 text-amber-700", high: "bg-red-100 text-red-700" };

export default function ExerciseTracker() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyExercise);
  const [saving, setSaving] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState("knee");

  const today = format(new Date(), "yyyy-MM-dd");

  const load = async () => {
    try {
      const data = await base44.entities.ExerciseLog.list("-date", 100);
      const filtered = currentMemberId ? data.filter((l) => l.family_member_id === currentMemberId) : data;
      setLogs(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const handleSave = async () => {
    if (!form.exercise_name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.ExerciseLog.create({
        ...form,
        sets: form.sets ? parseInt(form.sets) : undefined,
        reps: form.reps ? parseInt(form.reps) : undefined,
        duration_minutes: form.duration_minutes ? parseFloat(form.duration_minutes) : undefined,
        rom_degrees: form.rom_degrees ? parseFloat(form.rom_degrees) : undefined,
        pain_level: form.pain_level ? parseInt(form.pain_level) : undefined,
        date: today,
        family_member_id: currentMemberId || undefined,
      });
      setForm(emptyExercise);
      setDialogOpen(false);
      load();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.ExerciseLog.delete(id); load(); } catch (e) { console.error(e); }
  };

  const todayExercises = useMemo(() => logs.filter((l) => l.date === today), [logs, today]);

  const romProgress = useMemo(() => {
    const partLogs = logs.filter((l) => l.body_part === selectedBodyPart && l.rom_degrees != null);
    const byDate = {};
    partLogs.forEach((l) => {
      if (!byDate[l.date] || l.rom_degrees > byDate[l.date]) byDate[l.date] = l.rom_degrees;
    });
    return Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(new Date(), 13 - i);
      const dateStr = format(d, "yyyy-MM-dd");
      return {
        day: format(d, "MMM d"),
        rom: byDate[dateStr] || null,
      };
    }).filter((d) => d.rom !== null);
  }, [logs, selectedBodyPart]);

  const painProgress = useMemo(() => {
    const partLogs = logs.filter((l) => l.body_part === selectedBodyPart && l.pain_level != null);
    const byDate = {};
    partLogs.forEach((l) => {
      if (!(l.date in byDate)) byDate[l.date] = l.pain_level;
    });
    return Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(new Date(), 13 - i);
      const dateStr = format(d, "yyyy-MM-dd");
      return {
        day: format(d, "MMM d"),
        pain: byDate[dateStr] || null,
      };
    }).filter((d) => d.pain !== null);
  }, [logs, selectedBodyPart]);

  const chartData = useMemo(() => {
    const dateMap = {};
    romProgress.forEach((d) => { dateMap[d.day] = { ...dateMap[d.day], rom: d.rom }; });
    painProgress.forEach((d) => { dateMap[d.day] = { ...dateMap[d.day], pain: d.pain }; });
    return Object.entries(dateMap).map(([day, vals]) => ({ day, ...vals }));
  }, [romProgress, painProgress]);

  const totalExercises = logs.length;
  const avgDifficulty = useMemo(() => {
    const diffMap = { easy: 1, medium: 2, hard: 3 };
    if (logs.length === 0) return 0;
    return (logs.reduce((s, l) => s + (diffMap[l.difficulty] || 2), 0) / logs.length);
  }, [logs]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-orange-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-orange-600" /> Exercise & Recovery Tracker
          </h3>
          <p className="text-xs text-muted-foreground">Tracking for {currentMemberName}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-1.5" /> Log Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Log Exercise Session</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Exercise Name *</Label>
                <Input placeholder="e.g., Knee flexion stretch" value={form.exercise_name} onChange={(e) => setForm({ ...form, exercise_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Body Part *</Label>
                  <Select value={form.body_part} onValueChange={(v) => setForm({ ...form, body_part: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {bodyParts.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Intensity Level</Label>
                <Select value={form.intensity} onValueChange={(v) => setForm({ ...form, intensity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Sets</Label>
                  <Input type="number" placeholder="3" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Reps</Label>
                  <Input type="number" placeholder="10" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Duration (min)</Label>
                  <Input type="number" placeholder="15" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Range of Motion (°)</Label>
                  <Input type="number" placeholder="90" value={form.rom_degrees} onChange={(e) => setForm({ ...form, rom_degrees: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Pain Level (0-10)</Label>
                <Input type="number" min="0" max="10" placeholder="2" value={form.pain_level} onChange={(e) => setForm({ ...form, pain_level: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <div className="flex gap-2">
                  <Input placeholder="How did it feel?" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  <VoiceInputButton value={form.notes} onChange={(text) => setForm({ ...form, notes: text })} />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.exercise_name.trim() || saving} className="bg-orange-600 hover:bg-orange-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Exercise
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-orange-500" />
            <p className="text-xs text-muted-foreground font-medium">Total Sessions</p>
          </div>
          <p className="text-xl font-display font-bold text-orange-600">{totalExercises}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-4 h-4 text-orange-500" />
            <p className="text-xs text-muted-foreground font-medium">Today</p>
          </div>
          <p className="text-xl font-display font-bold text-orange-600">{todayExercises.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <p className="text-xs text-muted-foreground font-medium">Avg Difficulty</p>
          </div>
          <p className="text-xl font-display font-bold text-orange-600">
            {avgDifficulty < 1.67 ? "Easy" : avgDifficulty < 2.34 ? "Medium" : "Hard"}
          </p>
        </Card>
      </div>

      {/* ROM Recovery Chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-orange-600" /> Recovery Progress</h4>
          <Select value={selectedBodyPart} onValueChange={setSelectedBodyPart}>
            <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {bodyParts.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {chartData.length === 0 ? (
          <div className="py-8 text-center">
            <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No ROM data for {bodyParts.find((b) => b.value === selectedBodyPart)?.label} yet</p>
            <p className="text-xs text-muted-foreground">Log exercises with range-of-motion values to see your recovery progress</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="rom" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="ROM (°)" connectNulls />
              <Line yAxisId="right" type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Pain Level" connectNulls strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Today's Exercises */}
      <div>
        <h4 className="text-xs font-semibold mb-2">Today's Exercises</h4>
        {todayExercises.length === 0 ? (
          <Card className="p-6 text-center">
            <Dumbbell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No exercises logged today</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {todayExercises.map((ex, i) => (
              <motion.div key={ex.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ex.exercise_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {bodyParts.find((b) => b.value === ex.body_part)?.label || ex.body_part}
                      {ex.sets ? ` · ${ex.sets}×${ex.reps || ""}` : ""}
                      {ex.duration_minutes ? ` · ${ex.duration_minutes}min` : ""}
                      {ex.rom_degrees ? ` · ${ex.rom_degrees}° ROM` : ""}
                      {ex.pain_level != null ? ` · Pain: ${ex.pain_level}/10` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${difficultyColors[ex.difficulty] || difficultyColors.medium}`}>
                      {ex.difficulty}
                    </span>
                    {ex.intensity && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${intensityColors[ex.intensity] || intensityColors.moderate}`}>
                        {ex.intensity} intensity
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 shrink-0" onClick={() => handleDelete(ex.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}