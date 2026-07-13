import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Pill, Trash2, ShoppingBag, Phone, CheckCircle, Clock, AlertTriangle, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { format, differenceInDays } from "date-fns";

const petTypeIcons = { dog: "🐕", cat: "🐈", bird: "🦜", rabbit: "🐰", other: "🐾" };

const statusConfig = {
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
  approved: { label: "Approved", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200", icon: CheckCircle },
  filled: { label: "Filled", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icon: Package },
  delivered: { label: "Delivered", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: AlertTriangle },
};

const emptyForm = {
  pet_name: "",
  medication_name: "",
  dosage: "",
  quantity_requested: "",
  prescribing_vet: "",
  vet_phone: "",
  pharmacy_name: "",
  notes: "",
};

export default function PetPharmacy() {
  const [orders, setOrders] = useState([]);
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [orderData, medData] = await Promise.all([
        base44.entities.PetPharmacyOrder.list("-order_date", 200),
        base44.entities.PetMedication.list("-created_date", 200),
      ]);
      setOrders(orderData);
      setMeds(medData);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const lowSupplyMeds = useMemo(() => {
    return meds.filter((m) => m.active !== false && m.supply_remaining != null && m.supply_remaining <= 7);
  }, [meds]);

  const handleSave = async () => {
    if (!form.pet_name.trim() || !form.medication_name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.PetPharmacyOrder.create({
        ...form,
        quantity_requested: form.quantity_requested ? parseInt(form.quantity_requested) : undefined,
        order_date: format(new Date(), "yyyy-MM-dd"),
        status: "pending",
        refill_requested: true,
      });
      setForm(emptyForm);
      setDialogOpen(false);
      load();
      toast({ title: "Refill requested", description: "Your vet will be notified to approve this prescription." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to submit", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === "delivered") updates.refill_requested = false;
      await base44.entities.PetPharmacyOrder.update(orderId, updates);
      load();
      toast({ title: `Order ${statusConfig[newStatus].label.toLowerCase()}` });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try { await base44.entities.PetPharmacyOrder.delete(id); load(); } catch (e) { console.error(e); }
  };

  const handleRefillFromMed = (med) => {
    setForm({
      ...emptyForm,
      pet_name: med.pet_name || "",
      medication_name: med.medication_name || "",
      dosage: med.dosage || "",
      prescribing_vet: med.prescribing_vet || "",
      quantity_requested: "30",
    });
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-600" /> Pet Pharmacy
          </h2>
          <p className="text-xs text-muted-foreground">Request medication refills & track prescription orders</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Request Refill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Request Medication Refill</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Pet Name *</Label>
                  <Input placeholder="e.g., Buddy" value={form.pet_name} onChange={(e) => setForm({ ...form, pet_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Quantity</Label>
                  <Input type="number" placeholder="e.g., 30" value={form.quantity_requested} onChange={(e) => setForm({ ...form, quantity_requested: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Medication Name *</Label>
                <Input placeholder="e.g., Apoquel" value={form.medication_name} onChange={(e) => setForm({ ...form, medication_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Dosage</Label>
                <Input placeholder="e.g., 16mg" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Prescribing Vet</Label>
                  <Input placeholder="e.g., Dr. Smith" value={form.prescribing_vet} onChange={(e) => setForm({ ...form, prescribing_vet: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Vet Phone</Label>
                  <Input placeholder="e.g., (555) 123-4567" value={form.vet_phone} onChange={(e) => setForm({ ...form, vet_phone: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Pharmacy Name</Label>
                <Input placeholder="e.g., City Pet Pharmacy" value={form.pharmacy_name} onChange={(e) => setForm({ ...form, pharmacy_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea placeholder="e.g., Running low, need ASAP" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
              </div>
            </div>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.pet_name.trim() || !form.medication_name.trim() || saving} className="bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingBag className="w-4 h-4 mr-2" />}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Low Supply Alerts */}
      {lowSupplyMeds.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> Low Supply Alerts ({lowSupplyMeds.length})
          </h3>
          <div className="space-y-2">
            {lowSupplyMeds.map((med, i) => (
              <motion.div key={med.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-3 border-red-200 bg-red-50/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{med.medication_name} — {med.dosage}</p>
                      <p className="text-[10px] text-muted-foreground">{med.pet_name} · {med.supply_remaining} doses left</p>
                    </div>
                    <Button size="sm" className="h-8 bg-red-600 hover:bg-red-700" onClick={() => handleRefillFromMed(med)}>
                      <ShoppingBag className="w-3.5 h-3.5 mr-1" /> Request Refill
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Active Orders */}
      <div>
        <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-purple-600" /> Prescription Orders ({orders.length})</h3>
        {orders.length === 0 ? (
          <Card className="p-8 text-center">
            <ShoppingBag className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No pharmacy orders yet</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Request a refill to get started.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {orders.map((order, i) => {
              const cfg = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className={`p-3.5 border ${cfg.border} ${cfg.bg}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{order.medication_name}</p>
                          {order.dosage && <span className="text-[10px] text-muted-foreground">{order.dosage}</span>}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-medium`}>{cfg.label}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{order.pet_name}</p>
                        <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground">
                          {order.order_date && <span>Ordered: {format(new Date(order.order_date), "MMM d")}</span>}
                          {order.quantity_requested && <span>Qty: {order.quantity_requested}</span>}
                          {order.pharmacy_name && <span>📍 {order.pharmacy_name}</span>}
                          {order.cost != null && <span>${order.cost}</span>}
                        </div>
                        {order.prescribing_vet && (
                          <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" /> {order.prescribing_vet}{order.vet_phone ? ` · ${order.vet_phone}` : ""}
                          </p>
                        )}
                        {order.notes && <p className="text-[9px] text-muted-foreground italic mt-0.5">{order.notes}</p>}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
                          <SelectTrigger className="h-7 w-24 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDelete(order.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}