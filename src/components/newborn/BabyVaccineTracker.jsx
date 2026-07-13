import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, Plus, Trash2, Syringe, Calendar, CheckCircle, Clock,
  AlertCircle, MapPin, Stethoscope
} from "lucide-react";
import { motion } from "framer-motion";

const statusMeta = {
  completed: { label: "Completed", color: "#22c55e", icon: CheckCircle, bg: "bg-green-50 border-green-200" },
  scheduled: { label: "Scheduled", color: "#3b82f6", icon: Calendar, bg: "bg-blue-50 border-blue-200" },
  upcoming: { label: "Upcoming", color: "#8b5cf6", icon: Clock, bg: "bg-violet-50 border-violet-200" },
  missed: { label: "Missed", color: "#ef4444", icon: AlertCircle, bg: "bg-red-50 border-red-200" },
};

const standardVaccines = [
  "Hepatitis B (Birth)",
  "Hepatitis B (1-2 months)",
  "Hepatitis B (6-18 months)",
  "Rotavirus (2 months)",
  "DTaP (2 months)",
  "DTaP (4 months)",
  "DTaP (6 months)",
  "DTaP (15-18 months)",
  "Hib (2 months)",
  "Hib (4 months)",
  "PCV13 (2 months)",
  "PCV13 (4 months)",
  "PCV13 (6 months)",
  "PCV13 (12-15 months)",
  "IPV (2 months)",
  "IPV (4 months)",
  "Influenza (6+ months)",
  "MMR (12-15 months)",
  "Varicella (12-15 months)",
  "Hepatitis A (12-23 months)",
];

export default function BabyVaccineTracker() {
  const { toast } = useToast();
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    baby_name: "",
    vaccine_name: "",
    vaccine_date: new Date().toISOString().split("T")[0],
    next_due_date: "",
    age_at_vaccination: "",
    administered_by: "",
    location: "",
    status: "scheduled",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.BabyVaccine.list("-vaccine_date", 200);
      setVaccines(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.vaccine_name.trim() || !form.vaccine_date) {
      toast({ title: "Vaccine name and date are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.BabyVaccine.create(form);
      toast({ title: "Vaccine logged!" });
      setForm({ baby_name: form.baby_name, vaccine_name: "", vaccine_date: new Date().toISOString().split("T")[0], next_due_date: "", age_at_vaccination: "", administered_by: "", location: "", status: "scheduled", notes: "" });
      setShowForm(false);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save vaccine", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.BabyVaccine.delete(id);
      toast({ title: "Vaccine entry removed" });
      load();
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await base44.entities.BabyVaccine.update(id, { status: newStatus });
      load();
    } catch (e) { console.error(e); }
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = vaccines.filter((v) => v.status !== "completed" && v.vaccine_date >= today);
  const completed = vaccines.filter((v) => v.status === "completed");

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Syringe className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Vaccine Schedule</h3>
            <p className="text-xs text-muted-foreground">{completed.length} completed · {upcoming.length} upcoming</p>
          </div>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Log Vaccine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Syringe className="w-4 h-4 text-cyan-600" /> Log Vaccine
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Vaccine Name *</label>
                <Input list="vaccine-list" placeholder="e.g. DTaP (2 months)" value={form.vaccine_name} onChange={(e) => setForm({ ...form, vaccine_name: e.target.value })} className="h-9 text-sm" />
                <datalist id="vaccine-list">
                  {standardVaccines.map((v) => <option key={v} value={v} />)}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Date *</label>
                  <Input type="date" value={form.vaccine_date} onChange={(e) => setForm({ ...form, vaccine_date: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Next Due</label>
                  <Input type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Baby Age</label>
                  <Input placeholder="e.g. 2 months" value={form.age_at_vaccination} onChange={(e) => setForm({ ...form, age_at_vaccination: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="missed">Missed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Administered By</label>
                <Input placeholder="Dr. Smith" value={form.administered_by} onChange={(e) => setForm({ ...form, administered_by: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Location</label>
                <Input placeholder="Children's Clinic" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Baby Name</label>
                <Input placeholder="Baby's name" value={form.baby_name} onChange={(e) => setForm({ ...form, baby_name: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Notes</label>
                <Input placeholder="Any reactions or notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-9 text-sm" />
              </div>
              <Button onClick={handleAdd} disabled={saving} className="w-full bg-cyan-600 hover:bg-cyan-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Vaccine
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-600" /></div>
      ) : vaccines.length === 0 ? (
        <div className="text-center py-8">
          <Syringe className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No vaccines logged yet</p>
          <p className="text-xs text-muted-foreground mt-1">Track your baby's immunization schedule and upcoming due dates.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vaccines.map((v, i) => {
            const meta = statusMeta[v.status] || statusMeta.scheduled;
            const StatusIcon = meta.icon;
            return (
              <motion.div key={v.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className={`p-3 rounded-lg border ${meta.bg}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}20` }}>
                    <Syringe className="w-4 h-4" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate">{v.vaccine_name}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => handleDelete(v.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" /> {v.vaccine_date}
                      </span>
                      {v.age_at_vaccination && <span className="text-[10px] text-muted-foreground">· {v.age_at_vaccination}</span>}
                      <select
                        value={v.status}
                        onChange={(e) => handleStatusChange(v.id, e.target.value)}
                        className="text-[10px] border-0 bg-transparent font-medium cursor-pointer outline-none"
                        style={{ color: meta.color }}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="missed">Missed</option>
                      </select>
                    </div>
                    {(v.administered_by || v.location) && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        {v.administered_by && <><Stethoscope className="w-2.5 h-2.5" /> {v.administered_by}</>}
                        {v.location && <><MapPin className="w-2.5 h-2.5 ml-1" /> {v.location}</>}
                      </p>
                    )}
                    {v.next_due_date && v.status !== "completed" && (
                      <p className="text-[10px] text-blue-600 mt-0.5">Next due: {v.next_due_date}</p>
                    )}
                    {v.notes && <p className="text-[10px] text-muted-foreground mt-0.5 italic">{v.notes}</p>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}