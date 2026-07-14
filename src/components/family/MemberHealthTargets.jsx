import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, Loader2 } from "lucide-react";

const categoryLabels = {
  hydration: "Hydration", mindfulness: "Mindfulness", fitness: "Fitness",
  nutrition: "Nutrition", sleep: "Sleep", pain_management: "Pain Management", custom: "Custom",
};

export default function MemberHealthTargets({ memberId, onUpdate }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    goal_name: "", category: "fitness", target_value: "", unit: "", frequency: "daily",
  });

  useEffect(() => {
    loadGoals();
  }, [memberId]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const filter = memberId ? { family_member_id: memberId, is_active: true } : { is_active: true };
      const data = await base44.entities.CustomWellnessGoal.filter(filter, "-created_date", 30);
      setGoals(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.goal_name || !form.target_value || !form.unit) return;
    setSaving(true);
    try {
      await base44.entities.CustomWellnessGoal.create({
        ...form,
        target_value: parseFloat(form.target_value),
        family_member_id: memberId || undefined,
      });
      setForm({ goal_name: "", category: "fitness", target_value: "", unit: "", frequency: "daily" });
      setDialogOpen(false);
      loadGoals();
      if (onUpdate) onUpdate();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleToggle = async (goal) => {
    await base44.entities.CustomWellnessGoal.update(goal.id, { is_active: !goal.is_active });
    loadGoals();
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold flex items-center gap-2 text-sm">
          <Target className="w-4 h-4 text-violet-600" />
          Health Targets
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Set Health Target</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Goal name (e.g. Daily Steps)" value={form.goal_name} onChange={(e) => setForm({ ...form, goal_name: e.target.value })} />
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input type="number" placeholder="Target" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} />
                <Input placeholder="Unit (e.g. steps)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSave} disabled={!form.goal_name || !form.target_value || !form.unit || saving} className="w-full bg-violet-600 hover:bg-violet-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save Target
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : goals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No health targets set</p>
      ) : (
        <div className="space-y-2">
          {goals.map((g) => (
            <div key={g.id} className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{g.goal_name}</p>
                <p className="text-xs text-muted-foreground">
                  Target: {g.target_value} {g.unit} · {g.frequency}
                  {g.category !== "custom" ? ` · ${categoryLabels[g.category]}` : ""}
                </p>
              </div>
              <button
                onClick={() => handleToggle(g)}
                className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                  g.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {g.is_active ? "Active" : "Paused"}
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}