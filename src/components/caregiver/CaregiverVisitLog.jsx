import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { Clock, Plus, Loader2, Trash2, ClipboardList, Stethoscope, Car, Utensils, Heart, Pill, Home, Calendar, User, Activity } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

const supportTypes = [
  { value: "medication_assistance", label: "Medication Assistance", icon: Pill, color: "text-emerald-600", bg: "bg-emerald-50" },
  { value: "personal_care", label: "Personal Care", icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
  { value: "transportation", label: "Transportation", icon: Car, color: "text-blue-600", bg: "bg-blue-50" },
  { value: "meal_preparation", label: "Meal Preparation", icon: Utensils, color: "text-amber-600", bg: "bg-amber-50" },
  { value: "companionship", label: "Companionship", icon: Heart, color: "text-violet-600", bg: "bg-violet-50" },
  { value: "medical_appointment", label: "Medical Appointment", icon: Stethoscope, color: "text-sky-600", bg: "bg-sky-50" },
  { value: "household", label: "Household Tasks", icon: Home, color: "text-indigo-600", bg: "bg-indigo-50" },
  { value: "other", label: "Other", icon: ClipboardList, color: "text-gray-600", bg: "bg-gray-50" },
];

const getSupportType = (value) => supportTypes.find((t) => t.value === value) || supportTypes[supportTypes.length - 1];

const emptyForm = {
  visit_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  caregiver_name: "",
  family_member_id: "",
  family_member_name: "",
  support_type: "medication_assistance",
  duration_minutes: "",
  medication_administered: false,
  meal_taken: false,
  activity_completed: false,
  notes: "",
};

export default function CaregiverVisitLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { members } = useFamilyMember();
  const { toast } = useToast();

  const loadLogs = async () => {
    try {
      const data = await base44.entities.CaregiverVisitLog.list("-visit_date", 100);
      setLogs(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  const handleSave = async () => {
    if (!form.caregiver_name.trim() || !form.visit_date) return;
    setSaving(true);
    try {
      const member = members.find((m) => m.id === form.family_member_id);
      const data = {
        ...form,
        visit_date: new Date(form.visit_date).toISOString(),
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : undefined,
        family_member_name: member?.name || form.family_member_name || "Self",
      };
      await base44.entities.CaregiverVisitLog.create(data);
      setForm(emptyForm);
      setDialogOpen(false);
      loadLogs();
      toast({ title: "Visit logged", description: "Care visit has been recorded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save visit log", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.CaregiverVisitLog.delete(id);
      setLogs(logs.filter((l) => l.id !== id));
      toast({ title: "Visit log deleted" });
    } catch (e) { console.error(e); }
  };

  const totalMinutes = logs.reduce((s, l) => s + (l.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-violet-600" />
          <h3 className="font-semibold text-sm">Care Visit Log</h3>
          {logs.length > 0 && (
            <Badge variant="outline" className="text-[10px]">{logs.length} visits • {totalHours} hrs</Badge>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4 mr-1.5" /> Log Visit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Care Visit</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Date & Time *</Label>
                <Input type="datetime-local" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Caregiver Name *</Label>
                <Input placeholder="e.g., Mary Johnson" value={form.caregiver_name} onChange={(e) => setForm({ ...form, caregiver_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Care Recipient</Label>
                <Select
                  value={form.family_member_id || "self"}
                  onValueChange={(v) => setForm({ ...form, family_member_id: v === "self" ? "" : v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Self</SelectItem>
                    {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Type of Support *</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {supportTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setForm({ ...form, support_type: t.value })}
                      className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs transition ${form.support_type === t.value ? "border-violet-300 bg-violet-50" : "border-border hover:bg-muted/50"}`}
                    >
                      <t.icon className={`w-3.5 h-3.5 ${t.color}`} />
                      <span className="text-left leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Duration (minutes)</Label>
                <Input type="number" placeholder="60" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Daily Care Checklist</Label>
                <div className="space-y-2 mt-1.5">
                  <label className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition">
                    <Checkbox checked={form.medication_administered} onCheckedChange={(v) => setForm({ ...form, medication_administered: v })} />
                    <span className="text-xs flex items-center gap-1"><Pill className="w-3 h-3 text-emerald-600" /> Medication administered</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition">
                    <Checkbox checked={form.meal_taken} onCheckedChange={(v) => setForm({ ...form, meal_taken: v })} />
                    <span className="text-xs flex items-center gap-1"><Utensils className="w-3 h-3 text-amber-600" /> Meal intake completed</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition">
                    <Checkbox checked={form.activity_completed} onCheckedChange={(v) => setForm({ ...form, activity_completed: v })} />
                    <span className="text-xs flex items-center gap-1"><Activity className="w-3 h-3 text-sky-600" /> Activity / exercise completed</span>
                  </label>
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea placeholder="What was done during the visit..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
              </div>
              <Button onClick={handleSave} disabled={!form.caregiver_name.trim() || !form.visit_date || saving} className="w-full bg-violet-600 hover:bg-violet-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Visit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-violet-600" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-6">
          <ClipboardList className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No care visits logged yet</p>
          <p className="text-xs text-muted-foreground mt-1">Record visits to keep a history of care provided.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {logs.map((log) => {
            const st = getSupportType(log.support_type);
            return (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition">
                <div className={`w-8 h-8 rounded-lg ${st.bg} flex items-center justify-center shrink-0`}>
                  <st.icon className={`w-4 h-4 ${st.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{st.label}</p>
                    {log.duration_minutes && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />{log.duration_minutes} min
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <User className="w-3 h-3" />{log.caregiver_name}
                    </span>
                    <span>→</span>
                    <span>{log.family_member_name || "Self"}</span>
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" />{format(new Date(log.visit_date), "MMM d, h:mm a")}
                    </span>
                  </div>
                  {(log.medication_administered || log.meal_taken || log.activity_completed) && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {log.medication_administered && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                          <Pill className="w-2.5 h-2.5" /> Meds given
                        </span>
                      )}
                      {log.meal_taken && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-0.5">
                          <Utensils className="w-2.5 h-2.5" /> Meal taken
                        </span>
                      )}
                      {log.activity_completed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 flex items-center gap-0.5">
                          <Activity className="w-2.5 h-2.5" /> Activity done
                        </span>
                      )}
                    </div>
                  )}
                  {log.notes && <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 shrink-0" onClick={() => handleDelete(log.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}