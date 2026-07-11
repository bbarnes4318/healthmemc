import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Pill, Plus, Loader2, Upload, Trash2, Camera } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import DrugInteractionAlert from "@/components/pharmacy/DrugInteractionAlert";

const emptyMed = { name: "", dosage: "", frequency: "", prescribing_provider: "", notes: "", start_date: "", supply_quantity: "" };

export default function MedicationManager() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyMed);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [interactionData, setInteractionData] = useState(null);
  const [interactionAlertOpen, setInteractionAlertOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);

  const loadMeds = async () => {
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId, active: true } : { active: true };
      const data = await base44.entities.Medication.filter(filter);
      setMedications(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadMeds(); }, [currentMemberId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(result.file_url);
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  const checkInteractions = async (newMedName, existingMeds) => {
    if (existingMeds.length === 0) return [];
    const existingNames = existingMeds.map((m) => `${m.name} (${m.dosage}, ${m.frequency})`);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical pharmacology expert. Check for potential drug interactions between a NEW medication and the patient's EXISTING medications.

NEW medication: ${newMedName}
EXISTING medications: ${existingNames.join(", ")}

For each interaction found, provide:
- severity: "severe" (contraindicated, life-threatening), "moderate" (may need dose adjustment or monitoring), or "mild" (minor, usually manageable)
- risk: short label for the interaction type (e.g., "Increased bleeding risk", "QT prolongation", "Serotonin syndrome")
- description: what happens mechanistically
- recommendation: practical advice (e.g., "Consult prescriber before combining", "Monitor for symptoms of...")

Only report genuine, clinically recognized interactions. If no interactions exist, return an empty array. Do not include interactions between the existing medications themselves — only between the new medication and each existing one.`,
        response_json_schema: {
          type: "object",
          properties: {
            interactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  new_medication: { type: "string" },
                  existing_medication: { type: "string" },
                  severity: { type: "string", enum: ["severe", "moderate", "mild"] },
                  risk: { type: "string" },
                  description: { type: "string" },
                  recommendation: { type: "string" },
                },
              },
            },
          },
        },
      });
      return response.interactions || [];
    } catch (e) {
      console.error("Interaction check failed:", e);
      return [];
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.dosage.trim() || !form.frequency.trim()) return;

    // Check interactions before saving
    if (medications.length > 0) {
      setCheckingInteractions(true);
      const interactions = await checkInteractions(form.name.trim(), medications);
      setCheckingInteractions(false);

      if (interactions.length > 0) {
        setInteractionData(interactions);
        setPendingSave({ ...form });
        setInteractionAlertOpen(true);
        return;
      }
    }

    await performSave(form);
  };

  const handleConfirmSaveWithInteractions = async () => {
    setInteractionAlertOpen(false);
    if (pendingSave) {
      await performSave(pendingSave);
      setPendingSave(null);
    }
    setInteractionData(null);
  };

  const handleCancelInteractionAlert = () => {
    setInteractionAlertOpen(false);
    setPendingSave(null);
    setInteractionData(null);
  };

  const performSave = async (medData) => {
    setSaving(true);
    try {
      await base44.entities.Medication.create({
        ...medData,
        active: true,
        photo_url: photoUrl || undefined,
        family_member_id: currentMemberId || undefined,
      });
      setForm(emptyMed);
      setPhotoUrl(null);
      setDialogOpen(false);
      loadMeds();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleAddPhoto = async (medId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Medication.update(medId, { photo_url: result.file_url });
      loadMeds();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.Medication.update(id, { active: false });
      loadMeds();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-amber-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Medications for {currentMemberName}</h3>
          <p className="text-xs text-muted-foreground">{medications.length} active medications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-1.5" /> Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Medication</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {photoUrl && (
                <img src={photoUrl} alt="Medication" className="w-full h-32 rounded-lg object-cover" />
              )}
              <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition text-sm">
                <Camera className="w-4 h-4" />
                {uploading ? "Uploading..." : photoUrl ? "Photo uploaded ✓" : "Upload pill bottle photo"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
              <div>
                <Label className="text-xs">Name *</Label>
                <Input placeholder="e.g., Lisinopril" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Dosage *</Label>
                  <Input placeholder="e.g., 10mg" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Frequency *</Label>
                  <Input placeholder="e.g., Once daily" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Prescribing Provider</Label>
                <Input placeholder="Doctor name" value={form.prescribing_provider} onChange={(e) => setForm({ ...form, prescribing_provider: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Supply (pills)</Label>
                  <Input type="number" placeholder="e.g., 30" value={form.supply_quantity} onChange={(e) => setForm({ ...form, supply_quantity: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea placeholder="Any notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
              </div>
            </div>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name.trim() || !form.dosage.trim() || !form.frequency.trim() || saving || checkingInteractions} className="bg-amber-600 hover:bg-amber-700">
                {checkingInteractions ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {checkingInteractions ? "Checking interactions..." : saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DrugInteractionAlert
        open={interactionAlertOpen}
        interactions={interactionData}
        newMedName={pendingSave?.name || ""}
        onConfirm={handleConfirmSaveWithInteractions}
        onCancel={handleCancelInteractionAlert}
      />

      {medications.length === 0 ? (
        <Card className="p-8 text-center">
          <Pill className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No active medications</p>
          <p className="text-xs text-muted-foreground mt-1">Add medications to track adherence and upload photos for caregivers</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {medications.map((med) => (
            <Card key={med.id} className="p-3 flex items-center gap-3">
              {med.photo_url ? (
                <img src={med.photo_url} alt={med.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
              ) : (
                <label className="w-14 h-14 rounded-lg bg-amber-50 border-2 border-dashed border-amber-200 flex items-center justify-center cursor-pointer hover:bg-amber-100 transition shrink-0">
                  <Camera className="w-5 h-5 text-amber-400" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAddPhoto(med.id, e)} />
                </label>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{med.name}</p>
                <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency}</p>
                {med.prescribing_provider && <p className="text-xs text-muted-foreground">Prescribed by {med.prescribing_provider}</p>}
                {med.photo_url && (
                  <label className="text-[10px] text-amber-600 cursor-pointer hover:underline flex items-center gap-0.5 mt-0.5">
                    <Camera className="w-2.5 h-2.5" /> Change photo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAddPhoto(med.id, e)} />
                  </label>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 shrink-0" onClick={() => handleDelete(med.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}