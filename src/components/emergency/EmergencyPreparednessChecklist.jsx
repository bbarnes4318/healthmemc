import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  Loader2, CheckCircle2, Circle, Plus, Trash2, ClipboardCheck,
  Pill, FileText, Users, Package, FileBadge, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categoryConfig = {
  medications: { label: "Medications", icon: Pill, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  records: { label: "Health Records", icon: FileText, color: "text-sky-600", bg: "bg-sky-50 border-sky-200" },
  contacts: { label: "Emergency Contacts", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  supplies: { label: "Supplies", icon: Package, color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  documents: { label: "Documents", icon: FileBadge, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
  custom: { label: "Custom", icon: Sparkles, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
};

const defaultItems = [
  { item_text: "Store a 7-day supply of all current medications in a waterproof container", category: "medications", sort_order: 1 },
  { item_text: "Keep a written list of all medications with dosages and frequencies", category: "medications", sort_order: 2 },
  { item_text: "Pack a backup of essential medical equipment (glucometer, BP cuff, inhaler)", category: "medications", sort_order: 3 },
  { item_text: "Save digital copies of recent lab results", category: "records", sort_order: 4 },
  { item_text: "Print a copy of your latest vital signs and health profile", category: "records", sort_order: 5 },
  { item_text: "Store immunization records in your go-bag", category: "records", sort_order: 6 },
  { item_text: "Keep allergy and chronic condition list accessible", category: "records", sort_order: 7 },
  { item_text: "Add at least 2 emergency contacts to your phone and health profile", category: "contacts", sort_order: 8 },
  { item_text: "Share your medical summary with a trusted neighbor or family member", category: "contacts", sort_order: 9 },
  { item_text: "Keep a list of your doctors' phone numbers written down", category: "contacts", sort_order: 10 },
  { item_text: "Assemble a first aid kit (bandages, antiseptic, gauze, tape)", category: "supplies", sort_order: 11 },
  { item_text: "Store extra batteries for medical devices", category: "supplies", sort_order: 12 },
  { item_text: "Keep a flashlight and radio in your emergency kit", category: "supplies", sort_order: 13 },
  { item_text: "Store copies of insurance cards and policy numbers", category: "documents", sort_order: 14 },
  { item_text: "Keep a copy of your advance directive or living will", category: "documents", sort_order: 15 },
  { item_text: "Save your pharmacy prescription numbers in writing", category: "documents", sort_order: 16 },
];

const emptyForm = { item_text: "", category: "custom", notes: "" };

export default function EmergencyPreparednessChecklist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    try {
      const data = await base44.entities.EmergencyChecklist.list("sort_order", 200);
      setItems(data);
      if (data.length === 0) {
        setSeeding(true);
        const created = await base44.entities.EmergencyChecklist.bulkCreate(defaultItems);
        setItems(created);
        setSeeding(false);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleItem = async (item) => {
    const completed = !item.completed;
    setItems(items.map((i) => i.id === item.id ? { ...i, completed } : i));
    try {
      await base44.entities.EmergencyChecklist.update(item.id, {
        completed,
        completed_date: completed ? new Date().toISOString().split("T")[0] : null,
      });
    } catch (e) {
      setItems(items);
      console.error(e);
    }
  };

  const handleAdd = async () => {
    if (!form.item_text.trim()) return;
    setSaving(true);
    try {
      const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order || 0)) : 0;
      const created = await base44.entities.EmergencyChecklist.create({
        ...form,
        sort_order: maxOrder + 1,
      });
      setItems([...items, created]);
      setForm(emptyForm);
      setDialogOpen(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.EmergencyChecklist.delete(id);
      setItems(items.filter((i) => i.id !== id));
    } catch (e) { console.error(e); }
  };

  const completedCount = items.filter((i) => i.completed).length;
  const progressPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const grouped = Object.keys(categoryConfig).map((cat) => ({
    category: cat,
    config: categoryConfig[cat],
    items: items.filter((i) => i.category === cat).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
  })).filter((g) => g.items.length > 0);

  if (loading || seeding) {
    return (
      <Card className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-sm">Emergency Preparedness Checklist</h3>
            <p className="text-xs text-muted-foreground">Guided steps to stay ready for any urgent situation</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Checklist Item</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Task</Label>
                <Textarea placeholder="e.g., Refill emergency medication supply" value={form.item_text} onChange={(e) => setForm({ ...form, item_text: e.target.value })} rows={2} className="resize-none" />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Notes (optional)</Label>
                <Input placeholder="Any additional details" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!form.item_text.trim() || saving} className="bg-red-600 hover:bg-red-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">{completedCount} of {items.length} completed</span>
          <span className={`text-xs font-bold ${progressPct === 100 ? "text-emerald-600" : "text-red-600"}`}>{progressPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${progressPct === 100 ? "bg-emerald-500" : "bg-red-500"}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        {progressPct === 100 && (
          <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> You're fully prepared! Great job staying ready.
          </p>
        )}
      </div>

      {/* Grouped Checklist */}
      <div className="space-y-4">
        {grouped.map((group) => {
          const Icon = group.config.icon;
          return (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${group.config.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${group.config.color}`} />
                </div>
                <h4 className="text-xs font-semibold">{group.config.label}</h4>
                <span className="text-[10px] text-muted-foreground">
                  ({group.items.filter((i) => i.completed).length}/{group.items.length})
                </span>
              </div>
              <div className="space-y-1.5 ml-1">
                <AnimatePresence>
                  {group.items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition ${
                        item.completed ? "bg-emerald-50/50 border-emerald-200" : "bg-card border-border hover:bg-muted/50"
                      }`}
                    >
                      <button onClick={() => toggleItem(item)} className="mt-0.5 shrink-0">
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground hover:text-red-500 transition" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${item.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {item.item_text}
                        </p>
                        {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                        {item.completed_date && (
                          <p className="text-[10px] text-emerald-600 mt-0.5">Completed {new Date(item.completed_date).toLocaleDateString()}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}