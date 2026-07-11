import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus, Bell, Pill, Phone, Calendar } from "lucide-react";

const alertOptions = [
  { key: "alert_missed_medications", label: "Missed Medication Alerts", icon: Pill, desc: "Notified when a dose is missed" },
  { key: "alert_emergencies", label: "Emergency Alerts", icon: Bell, desc: "Notified when emergency button is pressed" },
  { key: "alert_appointments", label: "Appointment Reminders", icon: Calendar, desc: "Reminded of upcoming appointments" },
];

export default function TrustedContactForm({ onSaved }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    relationship: "",
    role: "family",
    alert_missed_medications: true,
    alert_emergencies: true,
    alert_appointments: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      await base44.entities.TrustedContact.create({ ...form, status: "active" });
      setForm({ name: "", email: "", phone: "", relationship: "", role: "family", alert_missed_medications: true, alert_emergencies: true, alert_appointments: false });
      onSaved();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Name *</Label>
          <Input placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Email *</Label>
          <Input type="email" placeholder="jane@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Phone</Label>
          <Input placeholder="(555) 123-4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Relationship</Label>
          <Input placeholder="e.g., Spouse, Daughter" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} />
        </div>
      </div>
      <div>
        <Label className="text-xs">Role</Label>
        <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="family">Family Member</SelectItem>
            <SelectItem value="caregiver">Caregiver</SelectItem>
            <SelectItem value="friend">Friend</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs mb-2 block">Alert Preferences</Label>
        <div className="space-y-2">
          {alertOptions.map((opt) => (
            <label key={opt.key} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${form[opt.key] ? "border-sky-300 bg-sky-50" : "border-border hover:bg-muted/50"}`}>
              <Checkbox checked={form[opt.key]} onCheckedChange={(v) => setForm({ ...form, [opt.key]: v })} />
              <opt.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <div>
                <span className="text-xs font-medium">{opt.label}</span>
                <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.email.trim() || saving} className="w-full bg-sky-600 hover:bg-sky-700">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
        Add Trusted Contact
      </Button>
    </div>
  );
}