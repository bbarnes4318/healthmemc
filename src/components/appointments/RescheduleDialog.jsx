import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CalendarClock } from "lucide-react";

export default function RescheduleDialog({ open, onOpenChange, appointment, onRescheduled }) {
  const { toast } = useToast();
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointment) {
      setDate(appointment.date ? appointment.date.slice(0, 16) : "");
      setNotes(appointment.notes || "");
    }
  }, [appointment]);

  const handleReschedule = async () => {
    if (!date) {
      toast({ title: "Please select a new date and time", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await onRescheduled(appointment.id, { date, notes, status: "scheduled" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-sky-600" />
            Reschedule Appointment
          </DialogTitle>
        </DialogHeader>
        {appointment && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
              <p className="text-sm font-semibold">{appointment.title}</p>
              {appointment.provider && <p className="text-xs text-muted-foreground mt-0.5">{appointment.provider}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">New Date & Time</label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Updated reason or prep instructions..." />
            </div>
            <Button onClick={handleReschedule} disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarClock className="w-4 h-4 mr-2" />}
              Confirm Reschedule
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}