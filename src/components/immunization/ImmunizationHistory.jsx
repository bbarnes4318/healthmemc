import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, Loader2, Trash2, Syringe, Calendar, AlertCircle, CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { useToast } from "@/components/ui/use-toast";
import { format, differenceInDays } from "date-fns";

const siteLabels = {
  left_arm: "Left Arm", right_arm: "Right Arm", left_thigh: "Left Thigh",
  right_thigh: "Right Thigh", buttocks: "Buttocks", oral: "Oral", nasal: "Nasal", other: "Other",
};

const commonVaccines = [
  { name: "Influenza (Flu)", boosterMonths: 12 },
  { name: "COVID-19", boosterMonths: 6 },
  { name: "Tetanus/Diphtheria (Td)", boosterMonths: 120 },
  { name: "Tdap (Whooping Cough)", boosterMonths: 120 },
  { name: "Shingles (Shingrix)", boosterMonths: 0 },
  { name: "Pneumococcal", boosterMonths: 0 },
  { name: "Hepatitis B", boosterMonths: 0 },
  { name: "MMR (Measles, Mumps, Rubella)", boosterMonths: 0 },
  { name: "HPV", boosterMonths: 0 },
  { name: "RSV", boosterMonths: 0 },
];

export default function ImmunizationHistory() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vaccine_name: "",
    date_administered: format(new Date(), "yyyy-MM-dd"),
    batch_number: "",
    manufacturer: "",
    administered_by: "",
    administration_site: "left_arm",
    dose_number: 1,
    booster_interval_months: 12,
    next_booster_date: "",
    notes: "",
  });

  const load = async () => {
    try {
      const data = await base44.entities.ImmunizationLog.list("-date_administered", 200);
      const filtered = currentMemberId ? data.filter((l) => l.family_member_id === currentMemberId) : data;
      setLogs(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const calculateBoosterDate = (dateStr, months) => {
    if (!months || months === 0) return "";
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return format(d, "yyyy-MM-dd");
  };

  const handleVaccineSelect = (vaccineName) => {
    const vaccine = commonVaccines.find((v) => v.name === vaccineName);
    const months = vaccine?.boosterMonths || 0;
    setForm((prev) => ({
      ...prev,
      vaccine_name: vaccineName,
      booster_interval_months: months,
      next_booster_date: calculateBoosterDate(prev.date_administered, months),
    }));
  };

  const handleDateChange = (dateStr) => {
    setForm((prev) => ({
      ...prev,
      date_administered: dateStr,
      next_booster_date: calculateBoosterDate(dateStr, prev.booster_interval_months),
    }));
  };

  const handleBoosterMonthsChange = (months) => {
    setForm((prev) => ({
      ...prev,
      booster_interval_months: months,
      next_booster_date: calculateBoosterDate(prev.date_administered, months),
    }));
  };

  const handleSave = async () => {
    if (!form.vaccine_name.trim() || !form.date_administered) return;
    setSaving(true);
    try {
      await base44.entities.ImmunizationLog.create({
        ...form,
        dose_number: parseInt(form.dose_number) || 1,
        booster_interval_months: parseInt(form.booster_interval_months) || 0,
        family_member_id: currentMemberId || undefined,
      });
      setForm({
        vaccine_name: "", date_administered: format(new Date(), "yyyy-MM-dd"),
        batch_number: "", manufacturer: "", administered_by: "",
        administration_site: "left_arm", dose_number: 1, booster_interval_months: 12,
        next_booster_date: "", notes: "",
      });
      setDialogOpen(false);
      load();
      toast({ title: "Vaccination recorded" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.ImmunizationLog.delete(id); load(); } catch (e) { console.error(e); }
  };

  // Calculate booster status
  const today = new Date();
  const boostersDue = logs.filter((l) => {
    if (!l.next_booster_date) return false;
    const dueDate = new Date(l.next_booster_date);
    return differenceInDays(dueDate, today) <= 30;
  });

  const getBoosterStatus = (dateStr) => {
    if (!dateStr) return null;
    const dueDate = new Date(dateStr);
    const daysUntil = differenceInDays(dueDate, today);
    if (daysUntil < 0) return { label: "Overdue", color: "bg-red-100 text-red-700", days: Math.abs(daysUntil) };
    if (daysUntil <= 30) return { label: "Due Soon", color: "bg-amber-100 text-amber-700", days: daysUntil };
    return { label: "Up to Date", color: "bg-green-100 text-green-700", days: daysUntil };
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Booster Alert Banner */}
      {boostersDue.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-amber-900">Booster Reminder</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                You have {boostersDue.length} vaccine{boostersDue.length > 1 ? "s" : ""} due or overdue for a booster:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {boostersDue.map((b) => (
                  <span key={b.id} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-medium">
                    {b.vaccine_name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Syringe className="w-4 h-4 text-emerald-600" /><span className="text-xs text-muted-foreground">Total Vaccines</span></div>
          <p className="text-2xl font-bold">{logs.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-green-600" /><span className="text-xs text-muted-foreground">Up to Date</span></div>
          <p className="text-2xl font-bold text-green-600">{logs.filter((l) => getBoosterStatus(l.next_booster_date)?.label === "Up to Date").length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-amber-600" /><span className="text-xs text-muted-foreground">Due Soon</span></div>
          <p className="text-2xl font-bold text-amber-600">{logs.filter((l) => getBoosterStatus(l.next_booster_date)?.label === "Due Soon").length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-red-600" /><span className="text-xs text-muted-foreground">Overdue</span></div>
          <p className="text-2xl font-bold text-red-600">{logs.filter((l) => getBoosterStatus(l.next_booster_date)?.label === "Overdue").length}</p>
        </Card>
      </div>

      {/* Add button */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Vaccination Records</h3>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Log Vaccine
        </Button>
      </div>

      {/* Log entries */}
      {logs.length === 0 ? (
        <Card className="p-12 text-center">
          <Syringe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No vaccination records yet</p>
          <p className="text-xs text-muted-foreground mt-1">Log your immunizations to track booster schedules and maintain a complete vaccine history.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log, i) => {
            const booster = getBoosterStatus(log.next_booster_date);
            return (
              <motion.div key={log.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Syringe className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{log.vaccine_name}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(log.date_administered), "MMM d, yyyy")}</span>
                        {log.dose_number > 1 && <Badge className="bg-sky-100 text-sky-700 border-0">Dose #{log.dose_number}</Badge>}
                        {booster && (
                          <Badge className={`${booster.color} border-0`}>
                            {booster.label === "Overdue" ? `${booster.days}d overdue` : booster.label === "Due Soon" ? `Due in ${booster.days}d` : "Up to date"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {log.batch_number && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Batch: {log.batch_number}</span>}
                        {log.manufacturer && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{log.manufacturer}</span>}
                        {log.administration_site && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{siteLabels[log.administration_site] || log.administration_site}</span>}
                      </div>
                      {log.administered_by && <p className="text-xs text-muted-foreground mt-1.5"><strong>Administered by:</strong> {log.administered_by}</p>}
                      {log.next_booster_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <strong>Next booster:</strong> {format(new Date(log.next_booster_date), "MMM d, yyyy")}
                        </p>
                      )}
                      {log.notes && <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 shrink-0" onClick={() => handleDelete(log.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Vaccine Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Vaccination</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Vaccine Name *</Label>
              <Input
                placeholder="Type or select a vaccine"
                value={form.vaccine_name}
                onChange={(e) => setForm({ ...form, vaccine_name: e.target.value })}
                className="mt-1"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {commonVaccines.slice(0, 6).map((v) => (
                  <button
                    key={v.name}
                    onClick={() => handleVaccineSelect(v.name)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date Administered *</Label>
                <Input type="date" value={form.date_administered} onChange={(e) => handleDateChange(e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Dose Number</Label>
                <Input type="number" min="1" value={form.dose_number} onChange={(e) => setForm({ ...form, dose_number: e.target.value })} className="h-9 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Batch Number</Label>
                <Input placeholder="e.g., FL2024-1234" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Manufacturer</Label>
                <Input placeholder="e.g., Pfizer" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="h-9 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Administered By</Label>
                <Input placeholder="Clinic or doctor" value={form.administered_by} onChange={(e) => setForm({ ...form, administered_by: e.target.value })} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Administration Site</Label>
                <Select value={form.administration_site} onValueChange={(v) => setForm({ ...form, administration_site: v })}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(siteLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Booster Interval (months)</Label>
                <Input type="number" min="0" value={form.booster_interval_months} onChange={(e) => handleBoosterMonthsChange(parseInt(e.target.value) || 0)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Next Booster Date</Label>
                <Input type="date" value={form.next_booster_date} onChange={(e) => setForm({ ...form, next_booster_date: e.target.value })} className="h-9 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Any reactions, side effects, or notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.vaccine_name.trim() || saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Vaccine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}