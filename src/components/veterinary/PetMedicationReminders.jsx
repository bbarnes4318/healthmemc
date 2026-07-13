import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Pill, CheckCircle, Trash2, Clock, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const petTypeIcons = { dog: "🐕", cat: "🐈", bird: "🦜", rabbit: "🐰", other: "🐾" };
const timeLabels = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };
const timeIcons = { morning: "🌅", afternoon: "☀️", evening: "🌙" };

const emptyForm = {
  pet_name: "",
  pet_type: "dog",
  medication_name: "",
  dosage: "",
  frequency: "",
  time_of_day: ["morning"],
  start_date: "",
  end_date: "",
  prescribing_vet: "",
  supply_remaining: "",
  notes: "",
};

export default function PetMedicationReminders() {
  const [meds, setMeds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const { toast } = useToast();

  const today = format(new Date(), "yyyy-MM-dd");

  const load = async () => {
    try {
      const [medData, logData] = await Promise.all([
        base44.entities.PetMedication.list("-created_date", 200),
        base44.entities.PetMedicationLog.filter({ scheduled_date: today }, "-given_at", 100),
      ]);
      setMeds(medData);
      setLogs(logData);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const activeMeds = useMemo(() => meds.filter((m) => m.active !== false), [meds]);

  const givenSet = useMemo(() => {
    const s = new Set();
    logs.filter((l) => l.status === "given").forEach((l) => {
      s.add(`${l.medication_id}-${l.time_of_day}`);
    });
    return s;
  }, [logs]);

  const dueDoses = useMemo(() => {
    const doses = [];
    activeMeds.forEach((med) => {
      const times = med.time_of_day?.length ? med.time_of_day : ["morning"];
      times.forEach((t) => {
        if (!givenSet.has(`${med.id}-${t}`)) {
          doses.push({ ...med, time_of_day: t, doseKey: `${med.id}-${t}` });
        }
      });
    });
    return doses;
  }, [activeMeds, givenSet]);

  const handleSave = async () => {
    if (!form.pet_name.trim() || !form.medication_name.trim() || !form.dosage.trim()) return;
    setSaving(true);
    try {
      await base44.entities.PetMedication.create({
        ...form,
        supply_remaining: form.supply_remaining ? parseInt(form.supply_remaining) : undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      });
      setForm(emptyForm);
      setDialogOpen(false);
      load();
      toast({ title: "Medication added", description: "You'll get daily reminders to give this dose." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleConfirmDose = async (dose) => {
    setConfirming(dose.doseKey);
    try {
      await base44.entities.PetMedicationLog.create({
        medication_id: dose.id,
        medication_name: dose.medication_name,
        pet_name: dose.pet_name,
        scheduled_date: today,
        time_of_day: dose.time_of_day,
        status: "given",
        given_at: new Date().toISOString(),
      });
      load();
      toast({ title: "Dose confirmed & logged", description: `${dose.medication_name} — ${dose.pet_name}` });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to log", variant: "destructive" });
    }
    setConfirming(null);
  };

  const handleSkipDose = async (dose) => {
    try {
      await base44.entities.PetMedicationLog.create({
        medication_id: dose.id,
        medication_name: dose.medication_name,
        pet_name: dose.pet_name,
        scheduled_date: today,
        time_of_day: dose.time_of_day,
        status: "skipped",
      });
      load();
      toast({ title: "Dose skipped" });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try { await base44.entities.PetMedication.delete(id); load(); } catch (e) { console.error(e); }
  };

  const handleToggleActive = async (med) => {
    try { await base44.entities.PetMedication.update(med.id, { active: !med.active }); load(); } catch (e) { console.error(e); }
  };

  const toggleTime = (time) => {
    const current = form.time_of_day || [];
    setForm({
      ...form,
      time_of_day: current.includes(time) ? current.filter((t) => t !== time) : [...current, time],
    });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <Pill className="w-5 h-5 text-purple-600" /> Pet Medication Reminders
          </h2>
          <p className="text-xs text-muted-foreground">Daily dose alerts — confirm & log right from the reminder</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Pet Medication</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Pet Name *</Label>
                  <Input placeholder="e.g., Buddy" value={form.pet_name} onChange={(e) => setForm({ ...form, pet_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Pet Type</Label>
                  <Select value={form.pet_type} onValueChange={(v) => setForm({ ...form, pet_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">🐕 Dog</SelectItem>
                      <SelectItem value="cat">🐈 Cat</SelectItem>
                      <SelectItem value="bird">🦜 Bird</SelectItem>
                      <SelectItem value="rabbit">🐰 Rabbit</SelectItem>
                      <SelectItem value="other">🐾 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Medication Name *</Label>
                <Input placeholder="e.g., Apoquel, Carprofen" value={form.medication_name} onChange={(e) => setForm({ ...form, medication_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Dosage *</Label>
                  <Input placeholder="e.g., 16mg" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Frequency</Label>
                  <Input placeholder="e.g., 1x daily" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Times of Day</Label>
                <div className="flex gap-2 mt-1.5">
                  {Object.entries(timeLabels).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => toggleTime(v)}
                      className={`flex-1 p-2 rounded-lg border-2 text-xs font-medium transition flex items-center justify-center gap-1 ${
                        (form.time_of_day || []).includes(v) ? "border-purple-500 bg-purple-50 text-purple-700" : "border-border text-muted-foreground"
                      }`}
                    >
                      {timeIcons[v]} {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Prescribing Vet</Label>
                  <Input placeholder="e.g., Dr. Smith" value={form.prescribing_vet} onChange={(e) => setForm({ ...form, prescribing_vet: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Supply Remaining</Label>
                  <Input type="number" placeholder="e.g., 30" value={form.supply_remaining} onChange={(e) => setForm({ ...form, supply_remaining: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea placeholder="e.g., Give with food" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
              </div>
            </div>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.pet_name.trim() || !form.medication_name.trim() || !form.dosage.trim() || saving} className="bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Pill className="w-4 h-4 mr-2" />}
                Add Medication
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeMeds.length === 0 ? (
        <Card className="p-12 text-center">
          <Pill className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No medications added yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your pet's medications to get daily dose reminders.</p>
        </Card>
      ) : (
        <>
          {/* Due Today */}
          {dueDoses.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-purple-600 mb-2 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 animate-pulse" /> Due Today ({dueDoses.length})
              </h3>
              <div className="space-y-2">
                {dueDoses.map((dose, i) => (
                  <motion.div key={dose.doseKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="p-3.5 border-purple-200 bg-purple-50/40">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                          <span className="text-lg">{timeIcons[dose.time_of_day]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{petTypeIcons[dose.pet_type] || "🐾"}</span>
                            <p className="text-sm font-semibold truncate">{dose.pet_name}</p>
                          </div>
                          <p className="text-xs font-medium text-purple-700">{dose.medication_name} — {dose.dosage}</p>
                          <p className="text-[10px] text-muted-foreground">{timeLabels[dose.time_of_day]} dose</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleConfirmDose(dose)} disabled={confirming === dose.doseKey}>
                            {confirming === dose.doseKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                            Give Dose
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => handleSkipDose(dose)}>
                            Skip
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Given Today */}
          {logs.filter((l) => l.status === "given").length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Given Today ({logs.filter((l) => l.status === "given").length})
              </h3>
              <div className="space-y-1.5">
                {logs.filter((l) => l.status === "given").map((log, i) => (
                  <div key={log.id} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium flex-1">{log.medication_name}</span>
                    <span className="text-muted-foreground">{log.pet_name}</span>
                    <span className="text-[9px] text-muted-foreground">{timeIcons[log.time_of_day]} {timeLabels[log.time_of_day]}</span>
                    {log.given_at && <span className="text-[9px] text-emerald-600">{format(new Date(log.given_at), "h:mm a")}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Medications */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5" /> All Medications ({activeMeds.length})
            </h3>
            <div className="space-y-2">
              {activeMeds.map((med, i) => (
                <motion.div key={med.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <Card className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <Pill className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{petTypeIcons[med.pet_type] || "🐾"}</span>
                        <p className="text-sm font-semibold truncate">{med.pet_name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{med.medication_name} — {med.dosage}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {med.time_of_day?.map((t) => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {timeLabels[t]}
                          </span>
                        ))}
                        {med.supply_remaining != null && <span className="text-[9px] text-muted-foreground">Supply: {med.supply_remaining}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleToggleActive(med)}>
                        {med.active === false ? "Reactivate" : "Pause"}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(med.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}