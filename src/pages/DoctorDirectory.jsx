import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Stethoscope, Plus, Loader2, Trash2, Phone, Mail, MapPin, Link2,
  Copy, Check, ExternalLink, Search, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

const emptyForm = {
  doctor_name: "",
  specialty: "",
  practice_name: "",
  phone: "",
  email: "",
  address: "",
  clinician_access_id: "",
  access_link: "",
  notes: "",
};

export default function DoctorDirectory() {
  const [doctors, setDoctors] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [docs, accessGrants] = await Promise.all([
        base44.entities.DoctorDirectory.list("-created_date", 100),
        base44.entities.ClinicianAccess.filter({ status: "active" }),
      ]);
      setDoctors(docs);
      const active = accessGrants.filter((g) => new Date(g.expires_at) >= new Date());
      setGrants(active);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!form.doctor_name.trim() || !form.specialty.trim()) return;
    setSaving(true);
    try {
      await base44.entities.DoctorDirectory.create(form);
      setForm(emptyForm);
      setDialogOpen(false);
      loadData();
      toast({ title: "Doctor added", description: "Doctor contact info saved to your directory." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save doctor", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.DoctorDirectory.delete(id);
      setDoctors(doctors.filter((d) => d.id !== id));
      toast({ title: "Doctor removed" });
    } catch (e) { console.error(e); }
  };

  const handleLinkGrant = (grantId) => {
    const grant = grants.find((g) => g.id === grantId);
    if (grant) {
      const link = `${window.location.origin}/clinician-view?token=${grant.access_token}`;
      setForm({ ...form, clinician_access_id: grantId, access_link: link });
    }
  };

  const copyLink = (doctor) => {
    if (!doctor.access_link) return;
    navigator.clipboard.writeText(doctor.access_link);
    setCopiedId(doctor.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = doctors.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.doctor_name?.toLowerCase().includes(q) ||
      d.specialty?.toLowerCase().includes(q) ||
      d.practice_name?.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Doctor Directory</h1>
          <p className="text-sm text-muted-foreground">Store contact info and secure access links for your doctors</p>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by name, specialty, or practice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-600 hover:bg-sky-700">
              <Plus className="w-4 h-4 mr-1.5" /> Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Doctor</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Doctor Name *</Label>
                  <Input placeholder="Dr. Jane Smith" value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Specialty *</Label>
                  <Input placeholder="Cardiology" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Practice / Office Name</Label>
                <Input placeholder="Heart Care Associates" value={form.practice_name} onChange={(e) => setForm({ ...form, practice_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input placeholder="(555) 123-4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input type="email" placeholder="office@clinic.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Office Address</Label>
                <Input placeholder="123 Medical Center Dr, Suite 100" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              {/* Secure Access Link */}
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-3.5 h-3.5 text-sky-600" />
                  <p className="text-xs font-medium text-sky-800">Secure Record Access Link</p>
                </div>
                <p className="text-[10px] text-sky-700 mb-2">
                  Link a clinician access grant to let this doctor view your records securely. Grant access first in Clinician Access.
                </p>
                {grants.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                      value={form.clinician_access_id}
                      onChange={(e) => handleLinkGrant(e.target.value)}
                    >
                      <option value="">Select a grant...</option>
                      {grants.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.doctor_name}{g.specialty ? ` — ${g.specialty}` : ""}
                        </option>
                      ))}
                    </select>
                    {form.access_link && (
                      <div className="flex items-center gap-1.5 p-2 bg-white rounded border">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[10px] text-muted-foreground truncate flex-1">Access link attached</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7"
                    onClick={() => { window.location.href = "/clinician-dashboard"; }}
                  >
                    Go to Clinician Access <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>

              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea placeholder="Preferred contact times, parking info, etc." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
              </div>
              <Button onClick={handleSave} disabled={!form.doctor_name.trim() || !form.specialty.trim() || saving} className="w-full bg-sky-600 hover:bg-sky-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Doctor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Doctor Cards */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Stethoscope className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{search ? "No doctors found matching your search" : "No doctors saved yet"}</p>
          <p className="text-xs text-muted-foreground mt-1">Add your doctors' contact info and secure access links for quick reference.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((doc, i) => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
              <Card className="p-4 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{doc.doctor_name}</p>
                    <Badge variant="outline" className="text-[10px] mt-0.5">{doc.specialty}</Badge>
                    {doc.practice_name && <p className="text-xs text-muted-foreground mt-1 truncate">{doc.practice_name}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 shrink-0" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="space-y-1.5 mt-3">
                  {doc.phone && (
                    <a href={`tel:${doc.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-sky-600 transition">
                      <Phone className="w-3 h-3" />{doc.phone}
                    </a>
                  )}
                  {doc.email && (
                    <a href={`mailto:${doc.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-sky-600 transition">
                      <Mail className="w-3 h-3" /><span className="truncate">{doc.email}</span>
                    </a>
                  )}
                  {doc.address && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" /><span>{doc.address}</span>
                    </div>
                  )}
                </div>

                {doc.access_link && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => copyLink(doc)}
                    >
                      {copiedId === doc.id ? <Check className="w-3 h-3 mr-1 text-emerald-600" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copiedId === doc.id ? "Copied!" : "Copy Access Link"}
                    </Button>
                    <a href={doc.access_link} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                      </Button>
                    </a>
                  </div>
                )}

                {doc.notes && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">{doc.notes}</p>}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}