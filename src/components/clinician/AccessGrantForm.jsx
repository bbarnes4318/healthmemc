import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus, FileText, Stethoscope, Pill, Activity } from "lucide-react";

const generateToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const durationOptions = [
  { value: 1, label: "24 hours" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

const shareOptions = [
  { key: "share_records", label: "Medical Records", icon: FileText },
  { key: "share_consultations", label: "Consultation Summaries", icon: Stethoscope },
  { key: "share_medications", label: "Current Medications", icon: Pill },
  { key: "share_vitals", label: "Vital Records", icon: Activity },
];

export default function AccessGrantForm({ onGranted }) {
  const [form, setForm] = useState({
    doctor_name: "",
    doctor_email: "",
    specialty: "",
    share_records: true,
    share_consultations: true,
    share_medications: false,
    share_vitals: false,
  });
  const [duration, setDuration] = useState("7");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.doctor_name.trim() || !form.doctor_email.trim()) return;
    setSaving(true);
    try {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(duration));
      const grant = await base44.entities.ClinicianAccess.create({
        ...form,
        access_token: token,
        expires_at: expiresAt.toISOString(),
        status: "active",
      });
      onGranted(grant);
      setForm({ doctor_name: "", doctor_email: "", specialty: "", share_records: true, share_consultations: true, share_medications: false, share_vitals: false });
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Doctor Name *</Label>
          <Input placeholder="Dr. Jane Smith" value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Doctor Email *</Label>
          <Input type="email" placeholder="dr.smith@clinic.com" value={form.doctor_email} onChange={(e) => setForm({ ...form, doctor_email: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Specialty</Label>
          <Input placeholder="Cardiology" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Access Duration</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {durationOptions.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs mb-2 block">What to Share</Label>
        <div className="grid grid-cols-2 gap-2">
          {shareOptions.map((opt) => (
            <label key={opt.key} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${form[opt.key] ? "border-sky-300 bg-sky-50" : "border-border hover:bg-muted/50"}`}>
              <Checkbox checked={form[opt.key]} onCheckedChange={(v) => setForm({ ...form, [opt.key]: v })} />
              <opt.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={!form.doctor_name.trim() || !form.doctor_email.trim() || saving} className="w-full bg-sky-600 hover:bg-sky-700">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
        Grant Secure Access
      </Button>
    </div>
  );
}