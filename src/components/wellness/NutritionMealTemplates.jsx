import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Bookmark, Plus, Trash2, Loader2, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const mealTypes = [
  { value: "breakfast", label: "Breakfast", icon: "🌅", color: "bg-amber-100 text-amber-700" },
  { value: "lunch", label: "Lunch", icon: "☀️", color: "bg-sky-100 text-sky-700" },
  { value: "dinner", label: "Dinner", icon: "🌙", color: "bg-indigo-100 text-indigo-700" },
  { value: "snack", label: "Snack", icon: "🍎", color: "bg-emerald-100 text-emerald-700" },
];

const emptyTemplate = { template_name: "", meal_type: "breakfast", food_name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "", notes: "" };

export default function NutritionMealTemplates({ onMealAdded }) {
  const { currentMemberId } = useFamilyMember();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyTemplate);
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");

  const load = async () => {
    try {
      const data = await base44.entities.NutritionMealTemplate.list("-created_date", 50);
      const filtered = currentMemberId ? data.filter((t) => t.family_member_id === currentMemberId || !t.family_member_id) : data;
      setTemplates(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const handleSaveTemplate = async () => {
    if (!form.template_name.trim() || !form.food_name.trim() || !form.calories) return;
    setSaving(true);
    try {
      await base44.entities.NutritionMealTemplate.create({
        ...form,
        calories: parseInt(form.calories) || 0,
        protein_g: form.protein_g ? parseFloat(form.protein_g) : undefined,
        carbs_g: form.carbs_g ? parseFloat(form.carbs_g) : undefined,
        fat_g: form.fat_g ? parseFloat(form.fat_g) : undefined,
        family_member_id: currentMemberId || undefined,
      });
      setForm(emptyTemplate);
      setDialogOpen(false);
      load();
      toast({ title: "Template saved", description: "Your meal template is ready for quick logging." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleQuickAdd = async (template) => {
    setAdding(template.id);
    try {
      await base44.entities.NutritionLog.create({
        meal_type: template.meal_type,
        food_name: template.food_name,
        calories: template.calories,
        protein_g: template.protein_g,
        carbs_g: template.carbs_g,
        fat_g: template.fat_g,
        notes: template.notes,
        date: today,
        family_member_id: currentMemberId || undefined,
      });
      toast({ title: "Added to today", description: `${template.food_name} added to your nutrition log.` });
      if (onMealAdded) onMealAdded();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to add", variant: "destructive" });
    }
    setAdding(null);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.NutritionMealTemplate.delete(id); load(); } catch (e) { console.error(e); }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-xs font-semibold flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 text-emerald-600" /> Meal Templates
          </h4>
          <p className="text-[10px] text-muted-foreground">Save favorite meals and add them with one click</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-[10px]"><Plus className="w-3 h-3 mr-1" />Save Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Save Meal Template</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Template Name *</Label>
                <Input placeholder="e.g., Morning Smoothie Bowl" value={form.template_name} onChange={(e) => setForm({ ...form, template_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Meal Type</Label>
                <Select value={form.meal_type} onValueChange={(v) => setForm({ ...form, meal_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((m) => <SelectItem key={m.value} value={m.value}>{m.icon} {m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Food Name *</Label>
                <Input placeholder="e.g., Greek yogurt, granola, berries" value={form.food_name} onChange={(e) => setForm({ ...form, food_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Calories *</Label>
                <Input type="number" placeholder="e.g., 350" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Protein (g)</Label>
                  <Input type="number" placeholder="0" value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Carbs (g)</Label>
                  <Input type="number" placeholder="0" value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Fat (g)</Label>
                  <Input type="number" placeholder="0" value={form.fat_g} onChange={(e) => setForm({ ...form, fat_g: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Input placeholder="Any notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveTemplate} disabled={!form.template_name.trim() || !form.food_name.trim() || !form.calories || saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bookmark className="w-4 h-4 mr-2" />}
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-4">
          <Bookmark className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">No saved templates yet</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Save your favorite balanced meals for one-click logging.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {templates.map((tpl, i) => {
            const mt = mealTypes.find((m) => m.value === tpl.meal_type) || mealTypes[3];
            return (
              <motion.div key={tpl.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${mt.color} flex items-center justify-center text-base shrink-0`}>
                    {mt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{tpl.template_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{tpl.food_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {tpl.calories} cal
                      {tpl.protein_g ? ` · ${tpl.protein_g}g P` : ""}
                      {tpl.carbs_g ? ` · ${tpl.carbs_g}g C` : ""}
                      {tpl.fat_g ? ` · ${tpl.fat_g}g F` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button size="sm" className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700" disabled={adding === tpl.id} onClick={() => handleQuickAdd(tpl)}>
                      {adding === tpl.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 mr-0.5" />}
                      Add
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-red-400 hover:text-red-600 px-2" onClick={() => handleDelete(tpl.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}