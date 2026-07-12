import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Target, Loader2, Save } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { useToast } from "@/components/ui/use-toast";

export default function NutritionGoalSetter() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [goalId, setGoalId] = useState(null);
  const [form, setForm] = useState({ calorie_goal: "2000", protein_goal: "50", fat_goal: "70", carbs_goal: "250" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadGoal = async () => {
    try {
      const goals = await base44.entities.NutritionGoal.list("-created_date", 50);
      const match = currentMemberId
        ? goals.find((g) => g.family_member_id === currentMemberId)
        : goals.find((g) => !g.family_member_id);
      if (match) {
        setGoalId(match.id);
        setForm({
          calorie_goal: String(match.calorie_goal || 2000),
          protein_goal: String(match.protein_goal || 50),
          fat_goal: String(match.fat_goal || 70),
          carbs_goal: String(match.carbs_goal || 250),
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadGoal(); }, [currentMemberId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        calorie_goal: parseInt(form.calorie_goal) || 2000,
        protein_goal: parseFloat(form.protein_goal) || 50,
        fat_goal: parseFloat(form.fat_goal) || 70,
        carbs_goal: parseFloat(form.carbs_goal) || 250,
        family_member_id: currentMemberId || undefined,
      };
      if (goalId) {
        await base44.entities.NutritionGoal.update(goalId, payload);
      } else {
        const created = await base44.entities.NutritionGoal.create(payload);
        setGoalId(created.id);
      }
      toast({ title: "Daily goals saved", description: `Targets updated for ${currentMemberName}.` });
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save goals", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Target className="w-3.5 h-3.5 mr-1.5" /> Set Goals
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Daily Nutrition Goals</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">Set targets for {currentMemberName}</p>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Calorie Goal (kcal)</Label>
            <Input type="number" value={form.calorie_goal} onChange={(e) => setForm({ ...form, calorie_goal: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Protein (g)</Label>
              <Input type="number" value={form.protein_goal} onChange={(e) => setForm({ ...form, protein_goal: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Fat (g)</Label>
              <Input type="number" value={form.fat_goal} onChange={(e) => setForm({ ...form, fat_goal: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Carbs (g)</Label>
              <Input type="number" value={form.carbs_goal} onChange={(e) => setForm({ ...form, carbs_goal: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Goals
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}