import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, Plus, Trash2, Milk, Moon, Baby, Clock, Share2,
  Stethoscope, Droplets, ChevronLeft, ChevronRight, Users
} from "lucide-react";
import { motion } from "framer-motion";

const logTypeMeta = {
  feeding: { label: "Feeding", icon: Milk, color: "#ec4899" },
  sleep: { label: "Sleep", icon: Moon, color: "#6366f1" },
  diaper: { label: "Diaper", icon: Baby, color: "#22c55e" },
};

export default function BabyDailyJournal() {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [shareWithDoctor, setShareWithDoctor] = useState(false);
  const [babyName, setBabyName] = useState("");
  const [form, setForm] = useState({
    log_type: "feeding",
    time: new Date().toTimeString().slice(0, 5),
    duration_minutes: "",
    feeding_type: "breast",
    feeding_amount_ml: "",
    feeding_side: "both",
    diaper_type: "wet",
    sleep_quality: "good",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.BabyDailyLog.list("-date", 500);
      setLogs(data);
      const firstWithName = data.find((l) => l.baby_name);
      if (firstWithName) setBabyName(firstWithName.baby_name);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        baby_name: babyName || undefined,
        date: selectedDate,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        feeding_amount_ml: form.feeding_amount_ml ? Number(form.feeding_amount_ml) : null,
        shared_with_doctor: shareWithDoctor,
      };
      await base44.entities.BabyDailyLog.create(payload);
      toast({ title: `${logTypeMeta[form.log_type].label} logged!` });
      setForm({ log_type: form.log_type, time: new Date().toTimeString().slice(0, 5), duration_minutes: "", feeding_type: "breast", feeding_amount_ml: "", feeding_side: "both", diaper_type: "wet", sleep_quality: "good", notes: "" });
      setShowForm(false);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save log", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.BabyDailyLog.delete(id);
      toast({ title: "Entry removed" });
      load();
    } catch (e) { console.error(e); }
  };

  const handleShareSummary = async () => {
    const dayLogs = logs.filter((l) => l.date === selectedDate);
    if (dayLogs.length === 0) return;
    const feedings = dayLogs.filter((l) => l.log_type === "feeding");
    const sleeps = dayLogs.filter((l) => l.log_type === "sleep");
    const diapers = dayLogs.filter((l) => l.log_type === "diaper");
    const sleepTotal = sleeps.reduce((s, l) => s + (l.duration_minutes || 0), 0);

    const text = `👶 Daily Baby Care Summary — ${selectedDate}${babyName ? ` — ${babyName}` : ""}

🍽️ Feedings: ${feedings.length}
   ${feedings.map((f) => `  • ${f.time || ""} — ${f.feeding_type || ""}${f.feeding_amount_ml ? ` ${f.feeding_amount_ml}ml` : ""}${f.feeding_side ? ` (${f.feeding_side})` : ""}`).join("\n")}

😴 Sleep: ${sleeps.length} session(s), ${Math.floor(sleepTotal / 60)}h ${sleepTotal % 60}m total
   ${sleeps.map((s) => `  • ${s.time || ""} — ${s.duration_minutes || 0} min${s.sleep_quality ? ` (${s.sleep_quality})` : ""}`).join("\n")}

👶 Diapers: ${diapers.length}
   ${diapers.map((d) => `  • ${d.time || ""} — ${d.diaper_type || ""}`).join("\n")}

Shared from Health Me Medical Center — Newborn Care Journal`;

    if (navigator.share) {
      navigator.share({ title: "Baby Daily Summary", text });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Summary copied — ready to share with your doctor or partner!" });
    }
  };

  const shiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const dayLogs = logs.filter((l) => l.date === selectedDate).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const feedings = dayLogs.filter((l) => l.log_type === "feeding");
  const sleeps = dayLogs.filter((l) => l.log_type === "sleep");
  const diapers = dayLogs.filter((l) => l.log_type === "diaper");
  const sleepTotal = sleeps.reduce((s, l) => s + (l.duration_minutes || 0), 0);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Baby className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Shared Daily Journal</h3>
            <p className="text-xs text-muted-foreground">Feedings, sleep & diapers — shareable with partner & doctor</p>
          </div>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Log Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Baby className="w-4 h-4 text-indigo-600" /> Log Daily Activity
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Entry Type</label>
                  <select value={form.log_type} onChange={(e) => setForm({ ...form, log_type: e.target.value })} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                    <option value="feeding">Feeding</option>
                    <option value="sleep">Sleep</option>
                    <option value="diaper">Diaper Change</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Time</label>
                  <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>

              {form.log_type === "feeding" && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-pink-50/50 rounded-lg">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Type</label>
                    <select value={form.feeding_type} onChange={(e) => setForm({ ...form, feeding_type: e.target.value })} className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-sm">
                      <option value="breast">Breast</option>
                      <option value="bottle_formula">Bottle (Formula)</option>
                      <option value="bottle_breastmilk">Bottle (Breastmilk)</option>
                      <option value="solid">Solid Food</option>
                    </select>
                  </div>
                  {form.feeding_type === "breast" && (
                    <div>
                      <label className="text-xs font-medium mb-1 block">Side</label>
                      <select value={form.feeding_side} onChange={(e) => setForm({ ...form, feeding_side: e.target.value })} className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-sm">
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  )}
                  {(form.feeding_type.startsWith("bottle")) && (
                    <div>
                      <label className="text-xs font-medium mb-1 block">Amount (ml)</label>
                      <Input type="number" placeholder="60" value={form.feeding_amount_ml} onChange={(e) => setForm({ ...form, feeding_amount_ml: e.target.value })} className="h-8 text-sm" />
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="text-xs font-medium mb-1 block">Duration (min)</label>
                    <Input type="number" placeholder="15" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="h-8 text-sm" />
                  </div>
                </div>
              )}

              {form.log_type === "sleep" && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-indigo-50/50 rounded-lg">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Duration (min)</label>
                    <Input type="number" placeholder="120" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Quality</label>
                    <select value={form.sleep_quality} onChange={(e) => setForm({ ...form, sleep_quality: e.target.value })} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                      <option value="good">Good</option>
                      <option value="restless">Restless</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>
              )}

              {form.log_type === "diaper" && (
                <div className="p-2 bg-green-50/50 rounded-lg">
                  <label className="text-xs font-medium mb-1 block">Diaper Type</label>
                  <select value={form.diaper_type} onChange={(e) => setForm({ ...form, diaper_type: e.target.value })} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                    <option value="wet">Wet</option>
                    <option value="dirty">Dirty</option>
                    <option value="both">Both</option>
                    <option value="dry">Dry</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-medium mb-1 block">Notes</label>
                <Input placeholder="Any notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-9 text-sm" />
              </div>

              <div className="flex items-center justify-between p-2 bg-amber-50/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs font-medium">Share with primary doctor</span>
                </div>
                <Switch checked={shareWithDoctor} onCheckedChange={setShareWithDoctor} />
              </div>

              <Button onClick={handleAdd} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Baby name input */}
      <div className="mb-3">
        <Input placeholder="Baby's name (optional, applies to all entries)" value={babyName} onChange={(e) => setBabyName(e.target.value)} className="h-8 text-sm max-w-xs" />
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4 p-2 bg-muted rounded-lg">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shiftDate(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <p className="text-xs font-medium">{new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
          {selectedDate === new Date().toISOString().split("T")[0] && <Badge variant="outline" className="text-[9px] mt-0.5">Today</Badge>}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shiftDate(1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-3 rounded-lg bg-pink-50 border border-pink-200 text-center">
          <Milk className="w-4 h-4 text-pink-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-pink-700">{feedings.length}</p>
          <p className="text-[10px] text-muted-foreground">Feedings</p>
        </div>
        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-center">
          <Moon className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-indigo-700">{Math.floor(sleepTotal / 60)}h {sleepTotal % 60}m</p>
          <p className="text-[10px] text-muted-foreground">Sleep</p>
        </div>
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
          <Droplets className="w-4 h-4 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-green-700">{diapers.length}</p>
          <p className="text-[10px] text-muted-foreground">Diapers</p>
        </div>
      </div>

      {/* Share summary button */}
      {dayLogs.length > 0 && (
        <Button variant="outline" size="sm" className="w-full mb-4 h-8 text-xs" onClick={handleShareSummary}>
          <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share Daily Summary with Partner / Doctor
        </Button>
      )}

      {/* Share status banner */}
      <div className="flex items-center gap-2 p-2 bg-sky-50 rounded-lg border border-sky-200 mb-4">
        <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        <p className="text-[10px] text-sky-800">
          {shareWithDoctor
            ? "New entries will be shared with your primary doctor. Use the Share button above to send today's summary to your partner or doctor."
            : "Entries are visible to your family. Toggle 'Share with primary doctor' on entries to include them in doctor reports."}
        </p>
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
      ) : dayLogs.length === 0 ? (
        <div className="text-center py-8">
          <Baby className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No entries for this day</p>
          <p className="text-xs text-muted-foreground mt-1">Log a feeding, sleep session, or diaper change.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayLogs.map((log, i) => {
            const meta = logTypeMeta[log.log_type];
            const Icon = meta.icon;
            return (
              <motion.div key={log.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card hover:shadow-sm transition">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{meta.label}</span>
                    {log.time && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{log.time}</span>}
                    {log.shared_with_doctor && <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300"><Stethoscope className="w-2 h-2 mr-0.5" />Shared</Badge>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {log.log_type === "feeding" && `${log.feeding_type || ""}${log.feeding_amount_ml ? ` · ${log.feeding_amount_ml}ml` : ""}${log.feeding_side ? ` · ${log.feeding_side}` : ""}${log.duration_minutes ? ` · ${log.duration_minutes}min` : ""}`}
                    {log.log_type === "sleep" && `${log.duration_minutes || 0} min${log.sleep_quality ? ` · ${log.sleep_quality}` : ""}`}
                    {log.log_type === "diaper" && `${log.diaper_type || ""}`}
                    {log.notes && ` · ${log.notes}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => handleDelete(log.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}