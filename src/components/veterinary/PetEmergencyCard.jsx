import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, PawPrint, FileDown, AlertTriangle, Pill, Syringe, Phone, Trash2, Edit3, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { format, differenceInYears } from "date-fns";
import { generatePetEmergencyPdf } from "@/lib/generatePetEmergencyPdf";

const petTypeIcons = { dog: "🐕", cat: "🐈", bird: "🦜", rabbit: "🐰", other: "🐾" };

const emptyForm = {
  name: "",
  pet_type: "dog",
  breed: "",
  birth_date: "",
  sex: "unknown",
  weight_kg: "",
  known_allergies: "",
  current_medications: "",
  microchip_id: "",
  vet_clinic: "",
  vet_phone: "",
  emergency_contact: "",
  notes: "",
};

export default function PetEmergencyCard() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await base44.entities.PetProfile.list("-created_date", 50);
      setPets(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (pet) => { setForm({ ...emptyForm, ...pet, weight_kg: pet.weight_kg || "" }); setEditId(pet.id); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined };
      if (editId) {
        await base44.entities.PetProfile.update(editId, payload);
        toast({ title: "Pet profile updated" });
      } else {
        await base44.entities.PetProfile.create(payload);
        toast({ title: "Pet profile created", description: "Emergency card is ready." });
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.PetProfile.delete(id); load(); } catch (e) { console.error(e); }
  };

  const handleExport = (pet) => {
    setExporting(pet.id);
    try {
      generatePetEmergencyPdf(pet);
      toast({ title: "PDF exported", description: "Take this card to the animal hospital." });
    } catch (e) {
      console.error(e);
      toast({ title: "Export failed", variant: "destructive" });
    }
    setExporting(null);
  };

  const getAge = (birthDate) => {
    if (!birthDate) return null;
    const years = differenceInYears(new Date(), new Date(birthDate));
    return years;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-purple-600" /> Pet Emergency Cards
          </h2>
          <p className="text-xs text-muted-foreground">Critical info for animal hospital visits — breed, age, allergies & medications</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Pet
        </Button>
      </div>

      {pets.length === 0 ? (
        <Card className="p-12 text-center">
          <PawPrint className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No pet profiles yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create a profile to generate an emergency card you can bring to the vet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pets.map((pet, i) => {
            const age = getAge(pet.birth_date);
            return (
              <motion.div key={pet.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-5 border-red-200">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl shrink-0">
                      {petTypeIcons[pet.pet_type] || "🐾"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold">{pet.name}</h3>
                      <p className="text-xs text-muted-foreground">{pet.breed || pet.pet_type}{age !== null && ` · ${age} yr${age !== 1 ? "s" : ""}`}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(pet)}><Edit3 className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(pet.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className={`p-2.5 rounded-lg mb-2 ${pet.known_allergies ? "bg-red-50 border border-red-200" : "bg-muted/30"}`}>
                    <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-0.5">
                      <AlertTriangle className={`w-3 h-3 ${pet.known_allergies ? "text-red-500" : ""}`} /> Known Allergies
                    </p>
                    <p className={`text-xs ${pet.known_allergies ? "text-red-700 font-medium" : "text-muted-foreground"}`}>
                      {pet.known_allergies || "None recorded"}
                    </p>
                  </div>

                  {/* Medications */}
                  <div className={`p-2.5 rounded-lg mb-2 ${pet.current_medications ? "bg-amber-50 border border-amber-200" : "bg-muted/30"}`}>
                    <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-0.5">
                      <Pill className={`w-3 h-3 ${pet.current_medications ? "text-amber-500" : ""}`} /> Current Medications
                    </p>
                    <p className={`text-xs ${pet.current_medications ? "text-amber-800" : "text-muted-foreground"}`}>
                      {pet.current_medications || "None recorded"}
                    </p>
                  </div>

                  {/* Vet Contact */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground mb-3">
                    {pet.vet_clinic && <div className="flex items-center gap-1"><Heart className="w-3 h-3" /> {pet.vet_clinic}</div>}
                    {pet.vet_phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {pet.vet_phone}</div>}
                    {pet.microchip_id && <div className="col-span-2">Microchip: {pet.microchip_id}</div>}
                    {pet.weight_kg && <div>Weight: {pet.weight_kg} kg</div>}
                    {pet.sex && pet.sex !== "unknown" && <div className="capitalize">Sex: {pet.sex}</div>}
                  </div>

                  <Button variant="outline" size="sm" className="w-full border-red-300 text-red-700 hover:bg-red-50" onClick={() => handleExport(pet)} disabled={exporting === pet.id}>
                    {exporting === pet.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 mr-1.5" />}
                    Export Emergency PDF
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Pet Profile" : "Create Pet Profile"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Pet Name *</Label>
                <Input placeholder="e.g., Buddy" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Pet Type</Label>
                <Select value={form.pet_type} onValueChange={(v) => setForm({ ...form, pet_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">🐕 Dog</SelectItem>
                    <SelectItem value="cat">🐈 Cat</SelectItem>
                    <SelectItem value="bird">🦜 Bird</SelectItem>
                    <SelectItem value="rabbit">🐰 Rabbit</SelectItem>
                    <SelectItem value="other">🐾 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Breed</Label>
                <Input placeholder="e.g., Golden Retriever" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Birth Date</Label>
                <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Sex</Label>
                <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Weight (kg)</Label>
                <Input type="number" step="0.1" placeholder="e.g., 25" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Known Allergies</Label>
              <Textarea placeholder="e.g., Penicillin, chicken, pollen..." value={form.known_allergies} onChange={(e) => setForm({ ...form, known_allergies: e.target.value })} rows={2} className="resize-none" />
            </div>
            <div>
              <Label className="text-xs">Current Medications</Label>
              <Textarea placeholder="e.g., Apoquel 16mg (1x daily), Heartgard (monthly)..." value={form.current_medications} onChange={(e) => setForm({ ...form, current_medications: e.target.value })} rows={2} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Vet Clinic</Label>
                <Input placeholder="e.g., City Animal Hospital" value={form.vet_clinic} onChange={(e) => setForm({ ...form, vet_clinic: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Vet Phone</Label>
                <Input placeholder="e.g., (555) 123-4567" value={form.vet_phone} onChange={(e) => setForm({ ...form, vet_phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Microchip ID</Label>
                <Input placeholder="e.g., 985112004..." value={form.microchip_id} onChange={(e) => setForm({ ...form, microchip_id: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Emergency Contact</Label>
                <Input placeholder="e.g., Jane (555) 987-6543" value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Additional Notes</Label>
              <Textarea placeholder="Any other critical information..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PawPrint className="w-4 h-4 mr-2" />}
              {editId ? "Save Changes" : "Create Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}