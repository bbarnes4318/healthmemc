import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Scale, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";

const emptyForm = {
  date: format(new Date(), "yyyy-MM-dd"),
  weight: "",
  weight_unit: "kg",
  notes: "",
};

export default function PetWeightTracker() {
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

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
        const data = await base44.entities.PetWeightLog.filter({ pet_profile_id: selectedPetId }, "date", 200);
        setLogs(data);
      } catch (e) { console.error(e); }
    };
    loadLogs();
  }, [selectedPetId]);

  const handleSave = async () => {
    if (!selectedPetId || !form.weight) return;
    setSaving(true);
    try {
      await base44.entities.PetWeightLog.create({
        pet_profile_id: selectedPetId,
        pet_name: selectedPet?.name,
        date: form.date,
        weight_kg: parseFloat(form.weight),
        weight_unit: form.weight_unit,
        notes: form.notes || undefined,
      });
      setForm({ ...emptyForm, date: format(new Date(), "yyyy-MM-dd") });
      const data = await base44.entities.PetWeightLog.filter({ pet_profile_id: selectedPetId }, "date", 200);
      setLogs(data);
      toast({ title: "Weight logged" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.PetWeightLog.delete(id); setLogs(logs.filter((l) => l.id !== id)); } catch (e) { console.error(e); }
  };

  const chartData = useMemo(() => {
    return logs.map((l) => ({
      date: format(parseISO(l.date), "MMM d, yy"),
      weight: l.weight_kg,
      unit: l.weight_unit,
      rawDate: l.date,
    }));
  }, [logs]);

  const latestWeight = logs.length > 0 ? logs[logs.length - 1] : null;
  const firstWeight = logs.length > 0 ? logs[0] : null;
  const weightChange = latestWeight && firstWeight ? latestWeight.weight_kg - firstWeight.weight_kg : 0;
  const weightChangePct = latestWeight && firstWeight && firstWeight.weight_kg > 0
    ? ((weightChange / firstWeight.weight_kg) * 100).toFixed(1)
    : 0;

  // Ideal weight range (based on pet type)
  const idealRanges = {
    dog: { min: 5, max: 40 },
    cat: { min: 3, max: 6 },
    bird: { min: 0.02, max: 1.5 },
    rabbit: { min: 1, max: 2.5 },
    other: { min: 1, max: 50 },
  };
  const idealRange = selectedPet ? (idealRanges[selectedPet.pet_type] || idealRanges.other) : idealRanges.other;

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>;
  }

  if (pets.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Scale className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Create a pet profile first</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-bold flex items-center gap-2">
          <Scale className="w-5 h-5 text-purple-600" /> Pet Weight Tracker
        </h2>
        <p className="text-xs text-muted-foreground">Log weight periodically and monitor trends over time</p>
      </div>

      <Select value={selectedPetId} onValueChange={setSelectedPetId}>
        <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select pet" /></SelectTrigger>
        <SelectContent>
          {pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.pet_type})</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Summary Cards */}
      {latestWeight && (
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <p className="text-[9px] text-muted-foreground">Current Weight</p>
            <p className="text-xl font-bold text-purple-600">{latestWeight.weight_kg} {latestWeight.weight_unit}</p>
            <p className="text-[8px] text-muted-foreground">{format(parseISO(latestWeight.date), "MMM d")}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[9px] text-muted-foreground">Total Change</p>
            <p className={`text-xl font-bold flex items-center justify-center gap-0.5 ${weightChange > 0 ? "text-amber-600" : weightChange < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
              {weightChange > 0 ? <TrendingUp className="w-4 h-4" /> : weightChange < 0 ? <TrendingDown className="w-4 h-4" /> : null}
              {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)}
            </p>
            <p className="text-[8px] text-muted-foreground">{weightChangePct}%</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[9px] text-muted-foreground">Ideal Range</p>
            <p className="text-sm font-bold text-emerald-600 mt-1">{idealRange.min}-{idealRange.max} kg</p>
            <p className="text-[8px] text-muted-foreground">{selectedPet?.pet_type}</p>
          </Card>
        </div>
      )}

      {/* Trend Chart */}
      {chartData.length > 0 ? (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-1">Weight Trend</h3>
          <p className="text-[10px] text-muted-foreground mb-3">{logs.length} entries over time</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 9, fill: "#64748b" }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={(v, name, props) => [`${v} ${props.payload.unit}`, "Weight"]}
              />
              <ReferenceLine y={idealRange.min} stroke="#22c55e" strokeDasharray="3 3" label={{ value: "Min", fontSize: 8, fill: "#22c55e" }} />
              <ReferenceLine y={idealRange.max} stroke="#22c55e" strokeDasharray="3 3" label={{ value: "Max", fontSize: 8, fill: "#22c55e" }} />
              <Line type="monotone" dataKey="weight" stroke="#9333ea" strokeWidth={2.5} dot={{ r: 4, fill: "#9333ea" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <Scale className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No weight entries yet — log your first measurement below.</p>
        </Card>
      )}

      {/* Log Form */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Log Weight</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Weight *</Label>
            <Input type="number" step="0.1" placeholder="e.g., 25.5" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Unit</Label>
            <Select value={form.weight_unit} onValueChange={(v) => setForm({ ...form, weight_unit: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="lb">lb</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-xs">Notes</Label>
          <Textarea placeholder="e.g., Vet visit weigh-in, home scale..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none mt-1" />
        </div>
        <Button className="mt-3 w-full bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={!form.weight || saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          Log Weight
        </Button>
      </Card>

      {/* History */}
      {logs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold mb-2">Weight History</h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {[...logs].reverse().map((log, i) => {
              const prevLog = logs[logs.length - 2 - i];
              const diff = prevLog ? log.weight_kg - prevLog.weight_kg : 0;
              return (
                <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                    <Scale className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="font-bold flex-1">{log.weight_kg} {log.weight_unit}</span>
                    {prevLog && (
                      <span className={`text-[9px] ${diff > 0 ? "text-amber-600" : diff < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                      </span>
                    )}
                    {log.notes && <span className="text-[9px] text-muted-foreground italic truncate max-w-32">{log.notes}</span>}
                    <span className="text-[9px] text-muted-foreground">{format(parseISO(log.date), "MMM d, yyyy")}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDelete(log.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}