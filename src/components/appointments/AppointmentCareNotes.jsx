import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  Lock, Users, Loader2, Pencil, Save, X, Stethoscope, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function AppointmentCareNotes({ appointment, onUpdate }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(appointment.private_care_notes || "");
  const [sharedWithFamily, setSharedWithFamily] = useState(appointment.notes_shared_with_family || false);
  const [author, setAuthor] = useState(appointment.care_notes_author || "");
  const [saving, setSaving] = useState(false);
  const [showAuthorInput, setShowAuthorInput] = useState(false);

  const hasNotes = !!appointment.private_care_notes;

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Appointment.update(appointment.id, {
        private_care_notes: notes.trim() || undefined,
        care_notes_author: author.trim() || undefined,
        care_notes_date: new Date().toISOString(),
        notes_shared_with_family: sharedWithFamily,
      });
      toast({ title: "Care notes saved", description: "Private notes updated for this visit." });
      setEditing(false);
      setShowAuthorInput(false);
      if (onUpdate) onUpdate();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save notes", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setNotes(appointment.private_care_notes || "");
    setSharedWithFamily(appointment.notes_shared_with_family || false);
    setAuthor(appointment.care_notes_author || "");
    setEditing(false);
    setShowAuthorInput(false);
  };

  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-3 pt-3 border-t border-border overflow-hidden"
      >
        <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
            <p className="text-xs font-semibold text-sky-800">Private Care Notes & Instructions</p>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Enter care instructions, follow-up notes, or private observations for this visit..."
            className="text-xs resize-none bg-white"
          />
          {!hasNotes && !showAuthorInput ? (
            <button
              onClick={() => setShowAuthorInput(true)}
              className="text-[10px] text-sky-600 hover:underline"
            >
              + Add author name (doctor)
            </button>
          ) : null}
          {(showAuthorInput || author) && (
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Doctor name (e.g., Dr. Smith)"
              className="w-full h-7 rounded-md border border-input bg-white px-2 text-xs"
            />
          )}
          <div className="flex items-center justify-between p-2 rounded-md bg-white border border-border">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <div>
                <p className="text-xs font-medium">Share with family members</p>
                <p className="text-[10px] text-muted-foreground">Visible to your designated family</p>
              </div>
            </div>
            <Switch checked={sharedWithFamily} onCheckedChange={setSharedWithFamily} />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-sky-600 hover:bg-sky-700 h-7 text-xs">
              {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
              Save Notes
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs">
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!hasNotes) {
    return (
      <div className="mt-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-sky-600 hover:text-sky-700"
          onClick={() => setEditing(true)}
        >
          <Pencil className="w-3 h-3 mr-1" /> Add Care Notes
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
            <p className="text-xs font-semibold text-sky-800">Private Care Notes</p>
          </div>
          <div className="flex items-center gap-1.5">
            {appointment.notes_shared_with_family ? (
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[9px]">
                <Users className="w-2.5 h-2.5 mr-0.5" /> Shared with family
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px]">
                <Lock className="w-2.5 h-2.5 mr-0.5" /> Private
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-sky-600"
              onClick={() => setEditing(true)}
            >
              <Pencil className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-foreground whitespace-pre-wrap">{appointment.private_care_notes}</p>
        {(appointment.care_notes_author || appointment.care_notes_date) && (
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {appointment.care_notes_author && `— ${appointment.care_notes_author}`}
            {appointment.care_notes_date && ` · ${format(new Date(appointment.care_notes_date), "MMM d, yyyy")}`}
          </p>
        )}
      </div>
    </div>
  );
}