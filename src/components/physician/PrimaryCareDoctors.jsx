import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, UserRound, Phone, Mail, MapPin, Plus, Stethoscope, Search, ExternalLink, Pencil, Trash2, Building2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const primaryCareSpecialties = [
  "Primary Care",
  "Internal Medicine",
  "Family Medicine",
  "General Practice",
  "Internal Medicine (Primary Care)",
];

export default function PrimaryCareDoctors() {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ doctor_name: "", specialty: "Primary Care", practice_name: "", phone: "", email: "", address: "", notes: "" });

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.DoctorDirectory.filter({}, "-created_date", 50);
      const pcp = all.filter((d) => {
        const spec = (d.specialty || "").toLowerCase();
        return primaryCareSpecialties.some((s) => s.toLowerCase() === spec) ||
          spec.includes("primary") || spec.includes("family medicine") || spec.includes("internal medicine") || spec.includes("general practice");
      });
      setDoctors(pcp);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.doctor_name.trim() || !form.specialty.trim()) {
      toast({ title: "Name and specialty are required", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      await base44.entities.DoctorDirectory.create({
        ...form,
        doctor_name: form.doctor_name.trim(),
        specialty: form.specialty.trim(),
      });
      toast({ title: "Primary care doctor added" });
      setForm({ doctor_name: "", specialty: "Primary Care", practice_name: "", phone: "", email: "", address: "", notes: "" });
      setShowForm(false);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to add doctor", variant: "destructive" });
    }
    setAdding(false);
  };

  const handleDelete = async (id, name) => {
    try {
      await base44.entities.DoctorDirectory.delete(id);
      toast({ title: `${name} removed` });
      load();
    } catch (e) { console.error(e); }
  };

  const filtered = doctors.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return d.doctor_name?.toLowerCase().includes(q) || d.specialty?.toLowerCase().includes(q) || d.practice_name?.toLowerCase().includes(q);
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Primary Care Doctors</h3>
            <p className="text-xs text-muted-foreground">Your PCP directory — quick access during consultations</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Doctor
        </Button>
      </div>

      {/* Search */}
      {doctors.length > 0 && (
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search doctors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs pl-9"
          />
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
            <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/30 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Doctor name *" value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} className="h-8 text-xs" />
                <Input placeholder="Specialty" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="h-8 text-xs" />
              </div>
              <Input placeholder="Practice / Clinic name" value={form.practice_name} onChange={(e) => setForm({ ...form, practice_name: e.target.value })} className="h-8 text-xs" />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-8 text-xs" />
                <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-8 text-xs" />
              </div>
              <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-8 text-xs" />
              <Input placeholder="Notes (e.g., preferred contact, office hours)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-8 text-xs" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} disabled={adding} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs">
                  {adding ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                  Save Doctor
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6">
          <UserRound className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No primary care doctors saved</p>
          <p className="text-xs text-muted-foreground mt-1">Add your PCP to quickly reference their info during consultations.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-3 rounded-lg border border-border bg-card hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                  <UserRound className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{doc.doctor_name}</p>
                    <Badge variant="outline" className="text-[9px] bg-indigo-50 text-indigo-700 border-indigo-200">
                      {doc.specialty}
                    </Badge>
                  </div>
                  {doc.practice_name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="w-2.5 h-2.5" /> {doc.practice_name}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {doc.phone && (
                      <a href={`tel:${doc.phone}`} className="text-[10px] text-muted-foreground hover:text-indigo-600 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" /> {doc.phone}
                      </a>
                    )}
                    {doc.email && (
                      <a href={`mailto:${doc.email}`} className="text-[10px] text-muted-foreground hover:text-indigo-600 flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5" /> {doc.email}
                      </a>
                    )}
                    {doc.address && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {doc.address}
                      </span>
                    )}
                  </div>
                  {doc.notes && <p className="text-[10px] text-muted-foreground italic mt-1">{doc.notes}</p>}
                  {doc.access_link && (
                    <a href={doc.access_link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 mt-1">
                      <ExternalLink className="w-2.5 h-2.5" /> Patient Portal
                    </a>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 shrink-0" onClick={() => handleDelete(doc.id, doc.doctor_name)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border">
        <Link to="/doctor-directory" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> View full doctor directory
        </Link>
      </div>
    </Card>
  );
}