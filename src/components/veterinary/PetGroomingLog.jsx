import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Scissors, Trash2, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { format, differenceInDays, subDays, isSameDay, parseISO } from "date-fns";

const groomingConfig = {
  brushing: { label: "Brushing", icon: "🪮", color: "text-purple-600", bg: "bg-purple-50", recommendedDays: 2 },
  nail_trim: { label: "Nail Trim", icon: "✂️", color: "text-amber-600", bg: "bg-amber-50", recommendedDays: 21 },
  bath: { label: "Bath", icon: "🛁", color: "text-sky-600", bg: "bg-sky-50", recommendedDays: 14 },
  ear_cleaning: { label: "Ear Cleaning", icon: "👂", color: "text-pink-600", bg: "bg-pink-50", recommendedDays: 7 },
  teeth_brushing: { label: "Teeth Brushing", icon: "🦷", color: "text-cyan-600", bg: "bg-cyan-50", recommendedDays: 1 },
  haircut: { label: "Haircut", icon: "💇", color: "text-indigo-600", bg: "bg-indigo-50", recommendedDays: 30 },
  gland_expression: { label: "Gland Expression", icon: "🩺", color: "text-rose-600", bg: "bg-rose-50", recommendedDays: 30 },
  other: { label: "Other", icon: "🐾", color: "text-slate-600", bg: "bg-slate-50", recommendedDays: 30 },
};

const emptyForm = {
  grooming_type: "brushing",
  date: format(new Date(), "yyyy-MM-dd"),
  notes: "",
  next_due_date: "",
};

export default function PetGroomingLog() {
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadPets = async () => {
      try {
        const data = await base44.entities.PetProfile.list("-created_date", 50);
        setPets(data);
        if (data.length > 0) setSelectedPetId(data[0].id);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadPets();
  }, []);

  const selectedPet = pets.find((p) => p.id === selectedPetId);

  useEffect(() => {
    if (!selectedPetId) return;
    const loadLogs = async () => {
      try {
        const data = await base44.entities.PetGroomingLog.filter({ pet_profile_id: selectedPetId }, "-date", 200);
        setLogs(data);
      } catch (e) { console.error(e); }
    };
    loadLogs();
  }, [selectedPetId]);

  const handleSave = async () => {
    if (!selectedPetId) return;
    setSaving(true);
    try {
      const cfg = groomingConfig[form.grooming_type];
      const nextDue = form.next_due_date || format(new Date(Date.now() + cfg.recommendedDays * 86400000), "yyyy-MM-dd");
      await base44.entities.PetGroomingLog.create({
        pet_profile_id: selectedPetId,
        pet_name: selectedPet?.name,
        date: form.date,
        grooming_type: form.grooming_type,
        notes: form.notes || undefined,
        next_due_date: nextDue,
      });
      setForm({ ...emptyForm, date: format(new Date(), "yyyy-MM-dd") });
      const data = await base44.entities.PetGroomingLog.filter({ pet_profile_id: selectedPetId }, "-date", 200);
      setLogs(data);
      toast({ title: "Grooming logged", description: `Next ${cfg.label.toLowerCase()} suggested for ${format(new Date(nextDue), "MMM d")}.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.PetGroomingLog.delete(id); setLogs(logs.filter((l) => l.id !== id)); } catch (e) { console.error(e); }
  };

  // Frequency stats per grooming type (last 90 days)
  const frequencyStats = useMemo(() => {
    const ninetyDaysAgo = subDays(new Date(), 90);
    const recent = logs.filter((l) => new Date(l.date) >= ninetyDaysAgo);
    const stats = {};
    Object.keys(groomingConfig).forEach((type) => {
      const typeLogs = recent.filter((l) => l.grooming_type === type);
      const lastLog = logs.find((l) => l.grooming_type === type);
      stats[type] = {
        count: typeLogs.length,
        lastDate: lastLog?.date || null,
        daysSinceLast: lastLog ? differenceInDays(new Date(), new Date(lastLog.date)) : null,
        recommendedDays: groomingConfig[type].recommendedDays,
        nextDue: lastLog?.next_due_date || null,
      };
    });
    return stats;
  }, [logs]);

  // Consistency score
  const consistencyScore = useMemo(() => {
    const types = Object.keys(groomingConfig).filter((t) => frequencyStats[t].count > 0);
    if (types.length === 0) return 0;
    const scores = types.map((t) => {
      const stat = frequencyStats[t];
      if (stat.daysSinceLast == null) return 0;
      return Math.max(0, Math.min(100, 100 - ((stat.daysSinceLast - stat.recommendedDays) / stat.recommendedDays) * 100));
    });
    return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  }, [frequencyStats]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>;
  }

  if (pets.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Scissors className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Create a pet profile first</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-bold flex items-center gap-2">
          <Scissors className="w-5 h-5 text-purple-600" /> Pet Grooming Log
        </h2>
        <p className="text-xs text-muted-foreground">Track brushing, nail trims, baths & more — with frequency counters for consistent care</p>
      </div>

      <Select value={selectedPetId} onValueChange={setSelectedPetId}>
        <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select pet" /></SelectTrigger>
        <SelectContent>
          {pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.pet_type})</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Consistency Score */}
      <Card className="p-4 border-purple-200 bg-purple-50/30">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${consistencyScore >= 70 ? "bg-emerald-100" : consistencyScore >= 40 ? "bg-amber-100" : "bg-red-100"}`}>
            <TrendingUp className={`w-6 h-6 ${consistencyScore >= 70 ? "text-emerald-600" : consistencyScore >= 40 ? "text-amber-600" : "text-red-600"}`} />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{consistencyScore}%</p>
            <p className="text-[10px] text-muted-foreground">Grooming Consistency Score (last 90 days)</p>
          </div>
        </div>
      </Card>

      {/* Frequency Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Object.entries(groomingConfig).map(([type, cfg]) => {
          const stat = frequencyStats[type];
          const isOverdue = stat.daysSinceLast != null && stat.daysSinceLast > cfg.recommendedDays;
          const isDueSoon = stat.daysSinceLast != null && stat.daysSinceLast > cfg.recommendedDays * 0.8 && !isOverdue;
          return (
            <Card key={type} className={`p-3 ${isOverdue ? "border-red-200 bg-red-50/30" : isDueSoon ? "border-amber-200 bg-amber-50/30" : ""}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">{cfg.icon}</span>
                <p className="text-[10px] font-semibold">{cfg.label}</p>
              </div>
              <p className="text-xl font-bold text-purple-600">{stat.count}</p>
              <p className="text-[8px] text-muted-foreground">times (90 days)</p>
              {stat.daysSinceLast != null ? (
                <p className={`text-[8px] mt-1 ${isOverdue ? "text-red-600 font-medium" : isDueSoon ? "text-amber-600" : "text-muted-foreground"}`}>
                  {stat.daysSinceLast}d ago {isOverdue ? "⚠️ Overdue" : ""}
                </p>
              ) : (
                <p className="text-[8px] text-muted-foreground mt-1">Never logged</p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Log Form */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Log Grooming Session</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Grooming Type</Label>
            <Select value={form.grooming_type} onValueChange={(v) => setForm({ ...form, grooming_type: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(groomingConfig).map(([v, c]) => <SelectItem key={v} value={v}>{c.icon} {c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Next Due (auto-suggested)</Label>
            <Input type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} className="mt-1" placeholder="Auto" />
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-xs">Notes</Label>
          <Textarea placeholder="e.g., Used detangling spray, nails were long..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none mt-1" />
        </div>
        <Button className="mt-3 w-full bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          Log Session
        </Button>
      </Card>

      {/* History */}
      <div>
        <h3 className="text-xs font-semibold mb-2 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-purple-600" /> Grooming History</h3>
        {logs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No grooming sessions logged yet for {selectedPet?.name}.</p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {logs.map((log, i) => {
              const cfg = groomingConfig[log.grooming_type] || groomingConfig.other;
              return (
                <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                    <span className="text-lg">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{cfg.label}</span>
                      {log.notes && <p className="text-[10px] text-muted-foreground italic truncate">{log.notes}</p>}
                    </div>
                    <span className="text-[9px] text-muted-foreground">{format(new Date(log.date), "MMM d, yyyy")}</span>
                    {log.next_due_date && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        differenceInDays(new Date(log.next_due_date), new Date()) < 0 ? "bg-red-100 text-red-600" : "bg-purple-50 text-purple-600"
                      }`}>
                        Next: {format(new Date(log.next_due_date), "MMM d")}
                      </span>
                    )}
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDelete(log.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}