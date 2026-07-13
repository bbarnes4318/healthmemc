import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, PawPrint, Syringe, Stethoscope, Bell, AlertTriangle, CheckCircle, Trash2, Calendar, Scissors, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { format, differenceInDays, isAfter, isBefore, addMonths, parseISO } from "date-fns";

const petTypeIcons = { dog: "🐕", cat: "🐈", bird: "🦜", rabbit: "🐰", other: "🐾" };

const recordTypeConfig = {
  vet_visit: { label: "Vet Visit", icon: Stethoscope, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
  vaccination: { label: "Vaccination", icon: Syringe, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  dental_cleaning: { label: "Dental Cleaning", icon: PawPrint, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
  grooming: { label: "Grooming", icon: Scissors, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  parasite_prevention: { label: "Parasite Prevention", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  other: { label: "Other", icon: Bell, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
};

const commonVaccines = {
  dog: ["Rabies", "DHPP (Distemper)", "Bordetella", "Leptospirosis", "Canine Influenza", "Lyme"],
  cat: ["Rabies", "FVRCP", "FeLV (Feline Leukemia)", "Bordetella"],
  bird: ["Polyomavirus", "Pacheco's Disease"],
  rabbit: ["RHDV2", "Myxomatosis"],
  other: [],
};

const emptyForm = {
  pet_name: "",
  pet_type: "dog",
  breed: "",
  record_type: "vaccination",
  vaccine_type: "",
  last_done_date: "",
  next_due_date: "",
  frequency_months: 12,
  clinic_name: "",
  notes: "",
};

export default function PetHealthReminders() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await base44.entities.PetHealthSchedule.list("-next_due_date", 200);
      setSchedules(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.pet_name.trim() || !form.next_due_date) return;
    setSaving(true);
    try {
      const status = computeStatus(form.next_due_date);
      await base44.entities.PetHealthSchedule.create({
        ...form,
        frequency_months: form.frequency_months ? parseInt(form.frequency_months) : 12,
        status,
      });
      setForm(emptyForm);
      setDialogOpen(false);
      load();
      toast({ title: "Reminder scheduled", description: "You'll be alerted 2 weeks before the due date." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.PetHealthSchedule.delete(id); load(); } catch (e) { console.error(e); }
  };

  const handleComplete = async (item) => {
    try {
      const nextDate = format(addMonths(new Date(), item.frequency_months || 12), "yyyy-MM-dd");
      await base44.entities.PetHealthSchedule.update(item.id, {
        last_done_date: format(new Date(), "yyyy-MM-dd"),
        next_due_date: nextDate,
        status: "upcoming",
        reminder_sent: false,
      });
      load();
      toast({ title: "Marked as complete", description: `Next reminder set for ${format(addMonths(new Date(), item.frequency_months || 12), "MMM d, yyyy")}.` });
    } catch (e) { console.error(e); }
  };

  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));
  }, [schedules]);

  const today = new Date();
  const overdue = sortedSchedules.filter((s) => isBefore(parseISO(s.next_due_date), today));
  const dueSoon = sortedSchedules.filter((s) => {
    const due = parseISO(s.next_due_date);
    return isAfter(due, today) && differenceInDays(due, today) <= 14;
  });
  const upcoming = sortedSchedules.filter((s) => differenceInDays(parseISO(s.next_due_date), today) > 14);

  const renderCard = (item, i) => {
    const config = recordTypeConfig[item.record_type] || recordTypeConfig.other;
    const dueDate = parseISO(item.next_due_date);
    const daysUntil = differenceInDays(dueDate, today);
    const isOverdue = daysUntil < 0;
    const Icon = config.icon;

    return (
      <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
        <Card className={`p-3.5 border ${isOverdue ? "border-red-300 bg-red-50/50" : daysUntil <= 14 ? "border-amber-300 bg-amber-50/50" : "border-border"}`}>
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{petTypeIcons[item.pet_type] || "🐾"}</span>
                <p className="text-sm font-semibold truncate">{item.pet_name}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>{config.label}</span>
              </div>
              {(item.vaccine_type || item.breed) && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {item.vaccine_type && <span>{item.vaccine_type}</span>}
                  {item.vaccine_type && item.breed && " · "}
                  {item.breed && <span>{item.breed}</span>}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className={`text-[10px] font-medium ${isOverdue ? "text-red-600" : daysUntil <= 14 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {isOverdue
                    ? `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""}`
                    : daysUntil === 0 ? "Due today"
                    : `Due in ${daysUntil} days`}
                </span>
                <span className="text-[10px] text-muted-foreground">· {format(dueDate, "MMM d, yyyy")}</span>
              </div>
              {item.clinic_name && <p className="text-[9px] text-muted-foreground mt-0.5">📍 {item.clinic_name}</p>}
              {item.notes && <p className="text-[9px] text-muted-foreground italic mt-0.5">{item.notes}</p>}
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" onClick={() => handleComplete(item)} title="Mark complete">
                <CheckCircle className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(item.id)} title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" /> Pet Health Reminders
          </h2>
          <p className="text-xs text-muted-foreground">Automated alerts for vet visits, vaccinations & preventive care</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Schedule Pet Health Reminder</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Pet Name *</Label>
                  <Input placeholder="e.g., Buddy" value={form.pet_name} onChange={(e) => setForm({ ...form, pet_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Pet Type</Label>
                  <Select value={form.pet_type} onValueChange={(v) => setForm({ ...form, pet_type: v, vaccine_type: "" })}>
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
                <Label className="text-xs">Breed (optional)</Label>
                <Input placeholder="e.g., Golden Retriever" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Reminder Type</Label>
                <Select value={form.record_type} onValueChange={(v) => setForm({ ...form, record_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(recordTypeConfig).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.record_type === "vaccination" && commonVaccines[form.pet_type]?.length > 0 && (
                <div>
                  <Label className="text-xs">Vaccine Type</Label>
                  <Select value={form.vaccine_type} onValueChange={(v) => setForm({ ...form, vaccine_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select vaccine" /></SelectTrigger>
                    <SelectContent>
                      {commonVaccines[form.pet_type].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Last Done</Label>
                  <Input type="date" value={form.last_done_date} onChange={(e) => setForm({ ...form, last_done_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Next Due Date *</Label>
                  <Input type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Repeat Every (months)</Label>
                  <Input type="number" value={form.frequency_months} onChange={(e) => setForm({ ...form, frequency_months: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Clinic (optional)</Label>
                  <Input placeholder="e.g., City Vet Clinic" value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes (optional)</Label>
                <Textarea placeholder="Any additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
              </div>
            </div>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.pet_name.trim() || !form.next_due_date || saving} className="bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
                Schedule Reminder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
      ) : schedules.length === 0 ? (
        <Card className="p-12 text-center">
          <PawPrint className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No reminders scheduled yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add vaccination and vet visit reminders to get automated email alerts.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {overdue.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Overdue ({overdue.length})
              </h3>
              <div className="space-y-2">{overdue.map((item, i) => renderCard(item, i))}</div>
            </div>
          )}
          {dueSoon.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Due Soon ({dueSoon.length})
              </h3>
              <div className="space-y-2">{dueSoon.map((item, i) => renderCard(item, i))}</div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Upcoming ({upcoming.length})
              </h3>
              <div className="space-y-2">{upcoming.map((item, i) => renderCard(item, i))}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function computeStatus(nextDueDate) {
  const due = parseISO(nextDueDate);
  const today = new Date();
  const days = differenceInDays(due, today);
  if (days < 0) return "overdue";
  if (days <= 14) return "due_soon";
  return "upcoming";
}