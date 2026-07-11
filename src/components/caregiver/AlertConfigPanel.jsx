import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, Pill, AlertTriangle, Users, Mail, Phone, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const roleLabels = { family: "Family", caregiver: "Caregiver", friend: "Friend", other: "Other" };

export default function AlertConfigPanel() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localContacts, setLocalContacts] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.TrustedContact.filter({ status: "active" });
        setContacts(data);
        setLocalContacts(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const toggleAlert = (contactId, field) => {
    setLocalContacts((prev) =>
      prev.map((c) => c.id === contactId ? { ...c, [field]: !c[field] } : c)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        localContacts.map((c) =>
          base44.entities.TrustedContact.update(c.id, {
            alert_missed_medications: c.alert_missed_medications,
            alert_emergencies: c.alert_emergencies,
            alert_appointments: c.alert_appointments,
          })
        )
      );
      setContacts(localContacts);
      toast({ title: "Alert settings saved", description: "Caregiver notification preferences updated." });
    } catch (e) {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
    setSaving(false);
  };

  const hasChanges = JSON.stringify(localContacts) !== JSON.stringify(contacts);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
          <span className="text-sm text-muted-foreground">Loading alert configuration...</span>
        </div>
      </Card>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No trusted contacts configured</p>
        <p className="text-xs text-muted-foreground mt-1">Add trusted contacts in Settings to enable caregiver alerts.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-4 h-4 text-violet-600" />
        <h3 className="font-semibold text-sm">Caregiver Alert Configuration</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Configure which caregivers receive automated alerts for emergencies and missed medications.
      </p>

      <div className="space-y-3">
        {localContacts.map((c) => (
          <div key={c.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <Badge variant="outline" className="text-[10px]">{roleLabels[c.role] || c.role}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {c.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                  {c.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-10">
              <label className="flex items-center justify-between p-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs font-medium">Emergencies</span>
                </div>
                <Switch checked={!!c.alert_emergencies} onCheckedChange={() => toggleAlert(c.id, "alert_emergencies")} />
              </label>
              <label className="flex items-center justify-between p-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition">
                <div className="flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium">Missed Meds</span>
                </div>
                <Switch checked={!!c.alert_missed_medications} onCheckedChange={() => toggleAlert(c.id, "alert_missed_medications")} />
              </label>
              <label className="flex items-center justify-between p-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs font-medium">Appointments</span>
                </div>
                <Switch checked={!!c.alert_appointments} onCheckedChange={() => toggleAlert(c.id, "alert_appointments")} />
              </label>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className="w-full mt-4 bg-violet-600 hover:bg-violet-700"
      >
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Alert Settings
      </Button>
    </Card>
  );
}