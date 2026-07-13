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
  Loader2, Plus, Phone, Mail, MapPin, Search, Stethoscope, Baby, Trash2, Edit3
} from "lucide-react";
import { motion } from "framer-motion";

const specialistTypes = [
  "Pediatrician",
  "Neonatologist",
  "Lactation Consultant",
  "Pediatric Nurse",
  "Doula / Postpartum Doula",
  "Pediatric Dermatologist",
  "Pediatric Cardiologist",
  "Speech & Feeding Therapist",
  "Other",
];

const typeColors = {
  "Pediatrician": "#3b82f6",
  "Neonatologist": "#8b5cf6",
  "Lactation Consultant": "#ec4899",
  "Pediatric Nurse": "#22c55e",
  "Doula / Postpartum Doula": "#f59e0b",
  "Pediatric Dermatologist": "#06b6d4",
  "Pediatric Cardiologist": "#ef4444",
  "Speech & Feeding Therapist": "#14b8a6",
  "Other": "#64748b",
};

export default function NewbornSpecialistDirectory() {
  const { toast } = useToast();
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    doctor_name: "",
    specialty: "Pediatrician",
    practice_name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.DoctorDirectory.list("-created_date", 200);
      // Filter to newborn/pediatric-related specialties
      const babyRelated = data.filter((d) => {
        const s = (d.specialty || "").toLowerCase();
        return s.includes("pediatr") || s.includes("neonat") || s.includes("lactation") ||
          s.includes("doula") || s.includes("newborn") || s.includes("infant") ||
          s.includes("feeding") || s.includes("postpartum");
      });
      setSpecialists(babyRelated);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.doctor_name.trim() || !form.specialty.trim()) {
      toast({ title: "Name and specialty are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.DoctorDirectory.create(form);
      toast({ title: "Specialist added" });
      setForm({ doctor_name: "", specialty: "Pediatrician", practice_name: "", phone: "", email: "", address: "", notes: "" });
      setShowForm(false);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to add specialist", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.DoctorDirectory.delete(id);
      toast({ title: "Specialist removed" });
      load();
    } catch (e) { console.error(e); }
  };

  const filtered = specialists.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (s.doctor_name || "").toLowerCase().includes(q) ||
      (s.specialty || "").toLowerCase().includes(q) ||
      (s.practice_name || "").toLowerCase().includes(q);
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Newborn Care Specialists</h3>
            <p className="text-xs text-muted-foreground">Your directory of baby care providers</p>
          </div>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Specialist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Baby className="w-4 h-4 text-pink-600" /> Add Newborn Care Specialist
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Specialist Name *</label>
                <Input
                  placeholder="Dr. Jane Smith"
                  value={form.doctor_name}
                  onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Specialty *</label>
                <select
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  className="w-full h-8 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {specialistTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Practice / Hospital</label>
                <Input
                  placeholder="Children's Hospital"
                  value={form.practice_name}
                  onChange={(e) => setForm({ ...form, practice_name: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Phone</label>
                  <Input
                    placeholder="(555) 123-4567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Email</label>
                  <Input
                    placeholder="dr@clinic.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Address</label>
                <Input
                  placeholder="123 Main St, City, State"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Notes</label>
                <Input
                  placeholder="Office hours, specialties, etc."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <Button onClick={handleAdd} disabled={saving} className="w-full bg-pink-600 hover:bg-pink-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Specialist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, specialty, or practice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-pink-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <Baby className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No specialists yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your pediatrician, lactation consultant, or other newborn care providers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((s, i) => {
            const color = typeColors[s.specialty] || typeColors["Other"];
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-3 rounded-lg border border-border bg-card hover:shadow-sm transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                    <Stethoscope className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate">{s.doctor_name}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <Badge className="text-[9px] mt-0.5" style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}>
                      {s.specialty}
                    </Badge>
                    {s.practice_name && <p className="text-xs text-muted-foreground mt-1">{s.practice_name}</p>}
                    {s.phone && (
                      <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 hover:text-pink-600">
                        <Phone className="w-3 h-3" /> {s.phone}
                      </a>
                    )}
                    {s.email && (
                      <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-pink-600 truncate">
                        <Mail className="w-3 h-3 shrink-0" /> {s.email}
                      </a>
                    )}
                    {s.address && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3 shrink-0" /> {s.address}
                      </p>
                    )}
                    {s.notes && <p className="text-[10px] text-muted-foreground mt-1 italic">{s.notes}</p>}
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