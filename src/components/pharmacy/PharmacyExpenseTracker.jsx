import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Receipt, Upload, Loader2, Plus, Trash2, DollarSign, Calendar, Store, FileImage, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format } from "date-fns";

export default function PharmacyExpenseTracker() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ medication_name: "", receipt_url: null, receipt_amount: "", pharmacy_name: "", scheduled_date: format(new Date(), "yyyy-MM-dd") });
  const { toast } = useToast();

  const loadLogs = async () => {
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const data = await base44.entities.MedicationLog.filter(filter, "-scheduled_date", 100);
      setLogs(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, [currentMemberId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setForm((prev) => ({ ...prev, receipt_url: result.file_url }));
    } catch (e) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.medication_name.trim() || !form.receipt_amount) return;
    setSaving(true);
    try {
      await base44.entities.MedicationLog.create({
        medication_name: form.medication_name.trim(),
        scheduled_date: form.scheduled_date,
        status: "taken",
        receipt_url: form.receipt_url || undefined,
        receipt_amount: parseFloat(form.receipt_amount),
        pharmacy_name: form.pharmacy_name.trim() || undefined,
        family_member_id: currentMemberId || undefined,
      });
      setForm({ medication_name: "", receipt_url: null, receipt_amount: "", pharmacy_name: "", scheduled_date: format(new Date(), "yyyy-MM-dd") });
      setDialogOpen(false);
      loadLogs();
      toast({ title: "Receipt saved", description: "Pharmacy expense recorded." });
    } catch (e) {
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleAttachReceipt = async (logId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.MedicationLog.update(logId, { receipt_url: result.file_url });
      loadLogs();
      toast({ title: "Receipt attached" });
    } catch (e) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const handleAddAmount = async (logId, amount) => {
    if (!amount || isNaN(parseFloat(amount))) return;
    try {
      await base44.entities.MedicationLog.update(logId, { receipt_amount: parseFloat(amount) });
      loadLogs();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.MedicationLog.delete(id);
      loadLogs();
      toast({ title: "Expense entry deleted" });
    } catch (e) { console.error(e); }
  };

  const expenseLogs = logs.filter((l) => l.receipt_url || l.receipt_amount);
  const totalSpent = expenseLogs.reduce((sum, l) => sum + (l.receipt_amount || 0), 0);
  const thisMonth = expenseLogs.filter((l) => {
    if (!l.scheduled_date) return false;
    const d = new Date(l.scheduled_date);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  });
  const monthTotal = thisMonth.reduce((sum, l) => sum + (l.receipt_amount || 0), 0);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-amber-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Pharmacy Receipts for {currentMemberName}</h3>
          <p className="text-xs text-muted-foreground">{expenseLogs.length} expense records</p>
        </div>
        <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Receipt
        </Button>
      </div>

      {/* Expense Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-muted-foreground font-medium">Total Expenses</span>
          </div>
          <p className="text-2xl font-display font-bold text-amber-700">${totalSpent.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{expenseLogs.length} receipts</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <span className="text-xs text-muted-foreground font-medium">This Month</span>
          </div>
          <p className="text-2xl font-display font-bold text-sky-700">${monthTotal.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{thisMonth.length} receipts in {format(new Date(), "MMM yyyy")}</p>
        </Card>
      </div>

      {/* Expense History */}
      {expenseLogs.length === 0 ? (
        <Card className="p-8 text-center">
          <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No pharmacy receipts yet</p>
          <p className="text-xs text-muted-foreground mt-1">Upload receipts to track your medication expenses over time</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {expenseLogs.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * i }}>
              <Card className="p-3">
                <div className="flex items-center gap-3">
                  {log.receipt_url ? (
                    <a href={log.receipt_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <img src={log.receipt_url} alt="Receipt" className="w-14 h-14 rounded-lg object-cover border" />
                    </a>
                  ) : (
                    <label className="w-14 h-14 rounded-lg bg-amber-50 border-2 border-dashed border-amber-200 flex items-center justify-center cursor-pointer hover:bg-amber-100 transition shrink-0">
                      <Upload className="w-5 h-5 text-amber-400" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAttachReceipt(log.id, e)} />
                    </label>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{log.medication_name}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {log.scheduled_date && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {format(new Date(log.scheduled_date), "MMM d, yyyy")}
                        </span>
                      )}
                      {log.pharmacy_name && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Store className="w-2.5 h-2.5" />
                          {log.pharmacy_name}
                        </span>
                      )}
                    </div>
                    {log.receipt_amount ? (
                      <p className="text-sm font-bold text-amber-700 mt-0.5">${log.receipt_amount.toFixed(2)}</p>
                    ) : (
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          placeholder="Amount"
                          className="h-6 w-20 text-xs py-0"
                          onBlur={(e) => e.target.value && handleAddAmount(log.id, e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                        />
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 shrink-0" onClick={() => handleDelete(log.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Receipt Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Pharmacy Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {form.receipt_url && (
              <img src={form.receipt_url} alt="Receipt preview" className="w-full h-40 rounded-lg object-cover border" />
            )}
            <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition text-sm">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4" />}
              {uploading ? "Uploading..." : form.receipt_url ? "Receipt uploaded ✓" : "Upload receipt photo"}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <div>
              <Label className="text-xs">Medication Name *</Label>
              <Input placeholder="e.g., Lisinopril 10mg" value={form.medication_name} onChange={(e) => setForm({ ...form, medication_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Amount ($) *</Label>
                <Input type="number" step="0.01" placeholder="e.g., 12.50" value={form.receipt_amount} onChange={(e) => setForm({ ...form, receipt_amount: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Pharmacy Name</Label>
              <Input placeholder="e.g., CVS, Walgreens" value={form.pharmacy_name} onChange={(e) => setForm({ ...form, pharmacy_name: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.medication_name.trim() || !form.receipt_amount || saving} className="bg-amber-600 hover:bg-amber-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Receipt className="w-4 h-4 mr-2" />}
              Save Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}