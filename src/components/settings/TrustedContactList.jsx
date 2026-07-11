import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Ban, Pause, Play, Loader2, Users, Pill, Bell, Calendar } from "lucide-react";

const roleLabels = { family: "Family", caregiver: "Caregiver", friend: "Friend", other: "Other" };

export default function TrustedContactList({ contacts, onChanged }) {
  const [updatingId, setUpdatingId] = useState(null);

  const toggleStatus = async (contact) => {
    setUpdatingId(contact.id);
    try {
      const newStatus = contact.status === "active" ? "paused" : "active";
      await base44.entities.TrustedContact.update(contact.id, { status: newStatus });
      onChanged();
    } catch (e) { console.error(e); }
    setUpdatingId(null);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.TrustedContact.delete(id);
      onChanged();
    } catch (e) { console.error(e); }
  };

  if (contacts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No trusted contacts yet</p>
        <p className="text-xs text-muted-foreground mt-1">Add a family member or caregiver to receive automated health alerts</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {contacts.map((c) => {
        const isPaused = c.status === "paused";
        return (
          <Card key={c.id} className={`p-4 ${isPaused ? "opacity-60" : ""}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <Badge variant="outline" className="text-[10px]">{roleLabels[c.role] || c.role}</Badge>
                  {c.relationship && <span className="text-xs text-muted-foreground">• {c.relationship}</span>}
                  <Badge className={`text-[10px] ${isPaused ? "bg-gray-100 text-gray-600" : "bg-emerald-100 text-emerald-700"}`}>
                    {isPaused ? "Paused" : "Active"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {c.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                  {c.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {c.alert_missed_medications && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 flex items-center gap-0.5"><Pill className="w-2.5 h-2.5" /> Missed Meds</span>}
                  {c.alert_emergencies && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 flex items-center gap-0.5"><Bell className="w-2.5 h-2.5" /> Emergencies</span>}
                  {c.alert_appointments && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" /> Appointments</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={updatingId === c.id} onClick={() => toggleStatus(c)}>
                  {updatingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : isPaused ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700" onClick={() => handleDelete(c.id)}>
                  <Ban className="w-3 h-3 mr-1" /> Remove
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}