import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Syringe, Loader2, Calendar } from "lucide-react";
import moment from "moment";

export default function MemberVaccinationSchedule({ memberId, onUpdate }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vaccine_name: "", date_administered: "", administered_by: "",
    next_booster_date: "", notes: "",
  });

  useEffect(() => {
    loadRecords();
  }, [memberId]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const filter = memberId ? { family_member_id: memberId } : {};
      const data = await base44.entities.ImmunizationLog.filter(filter, "-date_administered", 50);
      setRecords(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.vaccine_name || !form.date_administered) return;
    setSaving(true);
    try {
      await base44.entities.ImmunizationLog.create({
        ...form,
        family_member_id: memberId || undefined,
      });
      setForm({ vaccine_name: "", date_administered: "", administered_by: "", next_booster_date: "", notes: "" });
      setDialogOpen(false);
      loadRecords();
      if (onUpdate) onUpdate();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const upcomingBoosters = records.filter((r) => r.next_booster_date && new Date(r.next_booster_date) >= new Date());

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold flex items-center gap-2 text-sm">
          <Syringe className="w-4 h-4 text-emerald-600" />
          Vaccination Schedule
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Log Vaccination</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Vaccine name (e.g. Flu, COVID-19)" value={form.vaccine_name} onChange={(e) => setForm({ ...form, vaccine_name: e.target.value })} />
              <Input type="date" value={form.date_administered} onChange={(e) => setForm({ ...form, date_administered: e.target.value })} />
              <Input placeholder="Administered by (clinic/doctor)" value={form.administered_by} onChange={(e) => setForm({ ...form, administered_by: e.target.value })} />
              <Input type="date" value={form.next_booster_date} onChange={(e) => setForm({ ...form, next_booster_date: e.target.value })} />
              <p className="text-[10px] text-muted-foreground -mt-1">Next booster date (optional)</p>
              <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={handleSave} disabled={!form.vaccine_name || !form.date_administered || saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {upcomingBoosters.length > 0 && (
        <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs font-semibold text-amber-800 mb-1">Upcoming Boosters</p>
          {upcomingBoosters.map((b) => (
            <div key={b.id} className="flex items-center gap-2 text-xs text-amber-700">
              <Calendar className="w-3 h-3" />
              {b.vaccine_name} — due {moment(b.next_booster_date).format("MMM D, YYYY")}
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : records.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No vaccinations recorded</p>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <Syringe className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.vaccine_name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.date_administered ? moment(r.date_administered).format("MMM D, YYYY") : "—"}
                  {r.administered_by ? ` · ${r.administered_by}` : ""}
                  {r.dose_number ? ` · Dose ${r.dose_number}` : ""}
                </p>
              </div>
              {r.next_booster_date && (
                <span className="text-[10px] text-amber-600 font-medium shrink-0">
                  Booster: {moment(r.next_booster_date).format("MMM D, YY")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}