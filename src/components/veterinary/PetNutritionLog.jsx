import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Apple, Trash2, Calendar, Bookmark, BookmarkPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const mealTypeLabels = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
const mealTypeIcons = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🦴" };

const appetiteConfig = {
  good: { label: "Good", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  fair: { label: "Fair", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  poor: { label: "Poor", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  refused: { label: "Refused", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

const emptyForm = {
  meal_type: "dinner",
  food_name: "",
  portion_size: "",
  portion_unit: "cups",
  appetite: "good",
  notes: "",
};

const emptyTemplateForm = {
  template_name: "",
};

export default function PetNutritionLog() {
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [logs, setLogs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const { toast } = useToast();

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const loadPets = async () => {
      try {
        const data = await base44.entities.PetProfile.list("-created_date", 50);
        setPets(data);
        if (data.length > 0) setSelectedPetId(data[0].id);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadPets();
  }, []);

  const selectedPet = pets.find((p) => p.id === selectedPetId);

  useEffect(() => {
    if (!selectedPetId) return;
    const loadLogs = async () => {
      try {
        const data = await base44.entities.PetNutritionLog.filter({ pet_profile_id: selectedPetId }, "-date", 100);
        setLogs(data);
      } catch (e) { console.error(e); }
    };
    const loadTemplates = async () => {
      try {
        const data = await base44.entities.PetNutritionTemplate.filter({ pet_profile_id: selectedPetId }, "-created_date", 50);
        setTemplates(data);
      } catch (e) { console.error(e); }
    };
    loadLogs();
    loadTemplates();
  }, [selectedPetId]);

  const handleSave = async () => {
    if (!selectedPetId || !form.food_name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.PetNutritionLog.create({
        pet_profile_id: selectedPetId,
        pet_name: selectedPet?.name,
        date: today,
        meal_type: form.meal_type,
        food_name: form.food_name,
        portion_size: form.portion_size ? parseFloat(form.portion_size) : undefined,
        portion_unit: form.portion_unit,
        appetite: form.appetite,
        notes: form.notes || undefined,
      });
      setForm(emptyForm);
      const data = await base44.entities.PetNutritionLog.filter({ pet_profile_id: selectedPetId }, "-date", 100);
      setLogs(data);
      toast({ title: "Meal logged" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleApplyTemplate = (templateId) => {
    if (!templateId) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    setForm({
      meal_type: tpl.meal_type || "dinner",
      food_name: tpl.food_name || "",
      portion_size: tpl.portion_size ? String(tpl.portion_size) : "",
      portion_unit: tpl.portion_unit || "cups",
      appetite: tpl.default_appetite || "good",
      notes: tpl.notes || "",
    });
    toast({ title: `Template applied: ${tpl.template_name}`, description: "Adjust appetite if needed, then log." });
  };

  const handleSaveTemplate = async () => {
    if (!selectedPetId || !form.food_name.trim() || !templateForm.template_name.trim()) return;
    setSavingTemplate(true);
    try {
      await base44.entities.PetNutritionTemplate.create({
        template_name: templateForm.template_name,
        pet_profile_id: selectedPetId,
        pet_name: selectedPet?.name,
        meal_type: form.meal_type,
        food_name: form.food_name,
        portion_size: form.portion_size ? parseFloat(form.portion_size) : undefined,
        portion_unit: form.portion_unit,
        default_appetite: form.appetite,
        notes: form.notes || undefined,
      });
      const data = await base44.entities.PetNutritionTemplate.filter({ pet_profile_id: selectedPetId }, "-created_date", 50);
      setTemplates(data);
      setTemplateForm(emptyTemplateForm);
      setTemplateDialogOpen(false);
      toast({ title: "Template saved", description: "Use it next time for quick logging." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save template", variant: "destructive" });
    }
    setSavingTemplate(false);
  };

  const handleDeleteTemplate = async (id) => {
    try { await base44.entities.PetNutritionTemplate.delete(id); setTemplates(templates.filter((t) => t.id !== id)); } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try { await base44.entities.PetNutritionLog.delete(id); setLogs(logs.filter((l) => l.id !== id)); } catch (e) { console.error(e); }
  };

  const todayLogs = useMemo(() => logs.filter((l) => l.date === today), [logs, today]);

  const appetiteSummary = useMemo(() => {
    const recent = logs.slice(0, 14);
    const counts = { good: 0, fair: 0, poor: 0, refused: 0 };
    recent.forEach((l) => { counts[l.appetite] = (counts[l.appetite] || 0) + 1; });
    return counts;
  }, [logs]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>;
  }

  if (pets.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Apple className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Create a pet profile first</p>
        <p className="text-xs text-muted-foreground mt-1">Add a pet in the Emergency Cards tab to start logging nutrition.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-bold flex items-center gap-2">
          <Apple className="w-5 h-5 text-purple-600" /> Pet Nutrition Log
        </h2>
        <p className="text-xs text-muted-foreground">Track daily meals, portion sizes & appetite for each pet</p>
      </div>

      {/* Pet Selector */}
      <Select value={selectedPetId} onValueChange={setSelectedPetId}>
        <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select pet" /></SelectTrigger>
        <SelectContent>
          {pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.pet_type})</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Appetite Summary */}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(appetiteConfig).map(([key, cfg]) => (
          <Card key={key} className={`p-2.5 text-center ${cfg.bg} ${cfg.border} border`}>
            <p className="text-lg font-bold" style={{ color: cfg.color.replace("text-", "") }}>{appetiteSummary[key] || 0}</p>
            <p className={`text-[9px] ${cfg.color} font-medium`}>{cfg.label}</p>
          </Card>
        ))}
      </div>

      {/* Quick Template Selector */}
      {templates.length > 0 && (
        <Card className="p-3 border-purple-200 bg-purple-50/30">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-purple-600 shrink-0" />
            <Select onValueChange={handleApplyTemplate}>
              <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Quick log from saved template..." /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {mealTypeIcons[t.meal_type]} {t.template_name} — {t.food_name} ({t.portion_size} {t.portion_unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {/* Log Form */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Log Meal — {format(new Date(), "MMM d, yyyy")}</h3>
          <Button size="sm" variant="outline" className="h-7 text-xs border-purple-300 text-purple-700 hover:bg-purple-50" onClick={() => setTemplateDialogOpen(true)} disabled={!form.food_name.trim()}>
            <BookmarkPlus className="w-3.5 h-3.5 mr-1" /> Save as Template
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Meal Type</Label>
            <Select value={form.meal_type} onValueChange={(v) => setForm({ ...form, meal_type: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(mealTypeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{mealTypeIcons[v]} {l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Food Name *</Label>
            <Input placeholder="e.g., Royal Canin Adult Dry" value={form.food_name} onChange={(e) => setForm({ ...form, food_name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Portion Size</Label>
            <Input type="number" step="0.1" placeholder="e.g., 1.5" value={form.portion_size} onChange={(e) => setForm({ ...form, portion_size: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Unit</Label>
            <Select value={form.portion_unit} onValueChange={(v) => setForm({ ...form, portion_unit: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cups">Cups</SelectItem>
                <SelectItem value="grams">Grams</SelectItem>
                <SelectItem value="oz">Ounces</SelectItem>
                <SelectItem value="ml">Milliliters</SelectItem>
                <SelectItem value="can">Can</SelectItem>
                <SelectItem value="treat">Treat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Appetite</Label>
            <Select value={form.appetite} onValueChange={(v) => setForm({ ...form, appetite: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(appetiteConfig).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-xs">Notes</Label>
          <Textarea placeholder="e.g., Ate slowly, left some food, seemed hungry..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none mt-1" />
        </div>
        <Button className="mt-3 w-full bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={!form.food_name.trim() || saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          Log Meal
        </Button>
      </Card>

      {/* Saved Templates List */}
      {templates.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold mb-2 flex items-center gap-1"><Bookmark className="w-3.5 h-3.5 text-purple-600" /> Saved Meal Templates ({templates.length})</h3>
          <div className="space-y-1.5">
            {templates.map((tpl, i) => (
              <motion.div key={tpl.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                  <span>{mealTypeIcons[tpl.meal_type]}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{tpl.template_name}</span>
                    <span className="text-muted-foreground"> — {tpl.food_name}</span>
                    {tpl.portion_size && <span className="text-[10px] text-muted-foreground"> ({tpl.portion_size} {tpl.portion_unit})</span>}
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => handleApplyTemplate(tpl.id)}>Use</Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDeleteTemplate(tpl.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Meals */}
      {todayLogs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold mb-2 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-purple-600" /> Today's Meals</h3>
          <div className="space-y-2">
            {todayLogs.map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-3 flex items-center gap-3">
                  <span className="text-xl">{mealTypeIcons[log.meal_type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{log.food_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {log.portion_size && <span className="text-[10px] text-muted-foreground">{log.portion_size} {log.portion_unit}</span>}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${appetiteConfig[log.appetite].bg} ${appetiteConfig[log.appetite].color}`}>{appetiteConfig[log.appetite].label}</span>
                    </div>
                    {log.notes && <p className="text-[10px] text-muted-foreground italic mt-0.5">{log.notes}</p>}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600 shrink-0" onClick={() => handleDelete(log.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h3 className="text-xs font-semibold mb-2">Meal History</h3>
        {logs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No meals logged yet for {selectedPet?.name}.</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {logs.filter((l) => l.date !== today).map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                  <span>{mealTypeIcons[log.meal_type]}</span>
                  <span className="font-medium flex-1 truncate">{log.food_name}</span>
                  {log.portion_size && <span className="text-[10px] text-muted-foreground">{log.portion_size} {log.portion_unit}</span>}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${appetiteConfig[log.appetite].bg} ${appetiteConfig[log.appetite].color}`}>{appetiteConfig[log.appetite].label}</span>
                  <span className="text-[9px] text-muted-foreground">{format(new Date(log.date), "MMM d")}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDelete(log.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Save Template Dialog */}
      {templateDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setTemplateDialogOpen(false)}>
          <Card className="p-5 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><BookmarkPlus className="w-4 h-4 text-purple-600" /> Save as Meal Template</h3>
            <p className="text-[10px] text-muted-foreground mb-3">Save this meal combo for quick logging next time.</p>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Template Name *</Label>
                <Input placeholder="e.g., Buddy's Standard Dinner" value={templateForm.template_name} onChange={(e) => setTemplateForm({ ...templateForm, template_name: e.target.value })} className="mt-1" autoFocus />
              </div>
              <div className="p-2 rounded-lg bg-muted/30 text-[10px] text-muted-foreground">
                <p>{mealTypeIcons[form.meal_type]} {form.food_name}</p>
                {form.portion_size && <p>{form.portion_size} {form.portion_unit} · Appetite: {appetiteConfig[form.appetite].label}</p>}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={handleSaveTemplate} disabled={!templateForm.template_name.trim() || savingTemplate}>
                {savingTemplate ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookmarkPlus className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}