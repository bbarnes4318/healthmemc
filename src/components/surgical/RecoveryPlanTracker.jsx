import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, Plus, ClipboardList, Target, TrendingUp, Calendar,
  CheckCircle2, Circle, AlertCircle, Activity, Edit3, X, Stethoscope
} from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format, differenceInDays } from "date-fns";
import { motion } from "framer-motion";

const milestoneStatusConfig = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-600", icon: Circle },
  on_track: { label: "On Track", color: "bg-sky-100 text-sky-700", icon: Activity },
  achieved: { label: "Achieved", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  delayed: { label: "Delayed", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
};

const mobilityOrder = ["bedridden", "limited_assistance", "with_walker", "independent_limited", "fully_mobile"];

export default function RecoveryPlanTracker() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [form, setForm] = useState({
    surgery_name: "", surgeon: "", hospital: "", surgery_date: "",
    expected_recovery_weeks: 6, incision_care_instructions: "", activity_restrictions: "",
    weight_bearing_status: "", follow_up_date: "", pt_prescription: "", notes: "",
  });
  const [milestones, setMilestones] = useState([]);
  const [newMilestone, setNewMilestone] = useState({ name: "", target_day: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const [planData, logData] = await Promise.all([
        base44.entities.RecoveryPlan.filter(filter, "-surgery_date", 50),
        base44.entities.SurgicalRecovery.filter(filter, "-log_date", 200),
      ]);
      setPlans(planData);
      setLogs(logData);
      if (planData.length > 0 && !selectedPlanId) setSelectedPlanId(planData[0].id);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentMemberId]);

  useEffect(() => { load(); }, [load]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const planLogs = selectedPlan ? logs.filter((l) => l.surgery_name === selectedPlan.surgery_name) : [];
  const daysPostOp = selectedPlan?.surgery_date ? differenceInDays(new Date(), new Date(selectedPlan.surgery_date)) : 0;

  const startNewPlan = () => {
    setEditing(true);
    setSelectedPlanId(null);
    setForm({ surgery_name: "", surgeon: "", hospital: "", surgery_date: "", expected_recovery_weeks: 6, incision_care_instructions: "", activity_restrictions: "", weight_bearing_status: "", follow_up_date: "", pt_prescription: "", notes: "" });
    setMilestones([]);
  };

  const editPlan = (plan) => {
    setSelectedPlanId(plan.id);
    setForm({
      surgery_name: plan.surgery_name || "", surgeon: plan.surgeon || "", hospital: plan.hospital || "",
      surgery_date: plan.surgery_date || "", expected_recovery_weeks: plan.expected_recovery_weeks || 6,
      incision_care_instructions: plan.incision_care_instructions || "",
      activity_restrictions: plan.activity_restrictions || "",
      weight_bearing_status: plan.weight_bearing_status || "",
      follow_up_date: plan.follow_up_date || "", pt_prescription: plan.pt_prescription || "",
      notes: plan.notes || "",
    });
    setMilestones(plan.milestones || []);
    setEditing(true);
  };

  const addMilestone = () => {
    if (!newMilestone.name || !newMilestone.target_day) return;
    setMilestones([...milestones, { name: newMilestone.name, target_day: parseInt(newMilestone.target_day), achieved_day: null, status: "pending" }]);
    setNewMilestone({ name: "", target_day: "" });
  };

  const updateMilestoneStatus = (idx, status, achievedDay) => {
    const updated = [...milestones];
    updated[idx] = { ...updated[idx], status, achieved_day: status === "achieved" ? (achievedDay || daysPostOp) : null };
    setMilestones(updated);
  };

  const handleSave = async () => {
    if (!form.surgery_name || !form.surgery_date) {
      toast({ title: "Surgery name and date are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        expected_recovery_weeks: parseInt(form.expected_recovery_weeks) || 6,
        milestones,
        family_member_id: currentMemberId || null,
      };
      if (selectedPlanId) {
        await base44.entities.RecoveryPlan.update(selectedPlanId, payload);
        toast({ title: "Recovery plan updated" });
      } else {
        const created = await base44.entities.RecoveryPlan.create(payload);
        setSelectedPlanId(created.id);
        toast({ title: "Recovery plan created" });
      }
      setEditing(false);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return <Card className="p-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-rose-600" /></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Plan selector */}
      {!editing && (
        <div className="flex items-center gap-2 flex-wrap">
          {plans.length > 0 && (
            <select
              value={selectedPlanId || ""}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm flex-1 min-w-[200px]"
            >
              {plans.map((p) => <option key={p.id} value={p.id}>{p.surgery_name} — {p.surgery_date ? format(new Date(p.surgery_date), "MMM d, yyyy") : "No date"}</option>)}
            </select>
          )}
          {selectedPlan && (
            <Button variant="outline" size="sm" onClick={() => editPlan(selectedPlan)}>
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit Plan
            </Button>
          )}
          <Button size="sm" onClick={startNewPlan} className="bg-rose-600 hover:bg-rose-700">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Plan
          </Button>
        </div>
      )}

      {/* Edit/Create form */}
      {editing ? (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-rose-600" />
              <h3 className="font-semibold text-sm">{selectedPlanId ? "Edit Recovery Plan" : "Surgeon's Recovery Plan"}</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Surgery Name *</label>
              <Input value={form.surgery_name} onChange={(e) => setForm({ ...form, surgery_name: e.target.value })} placeholder="e.g. Right Knee Replacement" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Surgery Date *</label>
              <Input type="date" value={form.surgery_date} onChange={(e) => setForm({ ...form, surgery_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Surgeon</label>
              <Input value={form.surgeon} onChange={(e) => setForm({ ...form, surgeon: e.target.value })} placeholder="Dr. Smith" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Hospital</label>
              <Input value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} placeholder="City Medical Center" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Expected Recovery (weeks)</label>
              <Input type="number" value={form.expected_recovery_weeks} onChange={(e) => setForm({ ...form, expected_recovery_weeks: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Follow-up Date</label>
              <Input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Weight Bearing Status</label>
              <Input value={form.weight_bearing_status} onChange={(e) => setForm({ ...form, weight_bearing_status: e.target.value })} placeholder="e.g. Non-weight bearing x 2 weeks, then partial" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Incision Care Instructions</label>
              <Textarea value={form.incision_care_instructions} onChange={(e) => setForm({ ...form, incision_care_instructions: e.target.value })} rows={2} placeholder="Keep dry, change dressing every 48hrs..." />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Activity Restrictions</label>
              <Textarea value={form.activity_restrictions} onChange={(e) => setForm({ ...form, activity_restrictions: e.target.value })} rows={2} placeholder="No bending past 90°, no driving for 4 weeks..." />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">PT Prescription</label>
              <Textarea value={form.pt_prescription} onChange={(e) => setForm({ ...form, pt_prescription: e.target.value })} rows={2} placeholder="PT 2x/week for 6 weeks, focus on ROM and strengthening" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>

          {/* Milestones editor */}
          <div className="mt-4">
            <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Recovery Milestones (from surgeon's plan)
            </label>
            <div className="space-y-2 mb-2">
              {milestones.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                  <span className="text-sm flex-1">{m.name}</span>
                  <span className="text-xs text-muted-foreground">Day {m.target_day}</span>
                  <select
                    value={m.status}
                    onChange={(e) => updateMilestoneStatus(idx, e.target.value)}
                    className="h-7 rounded border bg-background text-xs px-1"
                  >
                    {Object.entries(milestoneStatusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newMilestone.name} onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })} placeholder="Milestone (e.g. Walk without aid)" className="flex-1" />
              <Input type="number" value={newMilestone.target_day} onChange={(e) => setNewMilestone({ ...newMilestone, target_day: e.target.value })} placeholder="Day" className="w-24" />
              <Button variant="outline" size="sm" onClick={addMilestone}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <Button onClick={handleSave} disabled={saving} className="bg-rose-600 hover:bg-rose-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {selectedPlanId ? "Update Plan" : "Create Plan"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </Card>
      ) : plans.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No recovery plan set up yet</p>
          <Button onClick={startNewPlan} className="bg-rose-600 hover:bg-rose-700">
            <Plus className="w-4 h-4 mr-2" /> Create Surgeon's Recovery Plan
          </Button>
        </Card>
      ) : selectedPlan ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Plan overview */}
          <Card className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{selectedPlan.surgery_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedPlan.surgeon && `${selectedPlan.surgeon} · `}
                  {selectedPlan.surgery_date && format(new Date(selectedPlan.surgery_date), "MMM d, yyyy")}
                  {selectedPlan.hospital && ` · ${selectedPlan.hospital}`}
                </p>
              </div>
              <Badge className="bg-rose-100 text-rose-700">Day {daysPostOp} post-op</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase">Recovery Time</p>
                <p className="text-sm font-semibold">{selectedPlan.expected_recovery_weeks || 6} weeks</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase">Follow-up</p>
                <p className="text-sm font-semibold">{selectedPlan.follow_up_date ? format(new Date(selectedPlan.follow_up_date), "MMM d") : "Not set"}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase">Milestones</p>
                <p className="text-sm font-semibold">{(selectedPlan.milestones || []).filter((m) => m.status === "achieved").length}/{selectedPlan.milestones?.length || 0} done</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase">Progress</p>
                <p className="text-sm font-semibold">{Math.min(100, Math.round((daysPostOp / ((selectedPlan.expected_recovery_weeks || 6) * 7)) * 100))}%</p>
              </div>
            </div>
          </Card>

          {/* Milestones vs actual */}
          {selectedPlan.milestones?.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-rose-600" />
                <h3 className="font-semibold text-sm">Milestones vs. Actual Progress</h3>
              </div>
              <div className="space-y-3">
                {selectedPlan.milestones
                  .sort((a, b) => (a.target_day || 0) - (b.target_day || 0))
                  .map((m, idx) => {
                    const cfg = milestoneStatusConfig[m.status] || milestoneStatusConfig.pending;
                    const MIcon = cfg.icon;
                    const isPast = daysPostOp > (m.target_day || 0) && m.status !== "achieved";
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
                          <MIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{m.name}</p>
                            <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Target: Day {m.target_day}</span>
                            {m.achieved_day != null && <span className="text-emerald-600 font-medium">Achieved: Day {m.achieved_day}</span>}
                            {isPast && <span className="text-amber-600 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />Overdue</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          {/* Mobility progress */}
          {planLogs.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-rose-600" />
                <h3 className="font-semibold text-sm">Mobility Progress</h3>
              </div>
              <div className="space-y-2">
                {[...planLogs].reverse().slice(0, 10).map((log) => {
                  const mobilityIdx = mobilityOrder.indexOf(log.mobility_level);
                  const isProgress = true;
                  return (
                    <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                      <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                        <Activity className="w-3.5 h-3.5 text-rose-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium capitalize">{(log.mobility_level || "unknown").replace(/_/g, " ")}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {log.log_date ? format(new Date(log.log_date), "MMM d") : ""} · Day {log.days_post_op}
                          {log.activity_type && ` · ${log.activity_type.replace(/_/g, " ")}`}
                        </p>
                      </div>
                      {log.pain_level != null && (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Pain</p>
                          <p className={`text-sm font-bold ${log.pain_level <= 3 ? "text-emerald-600" : log.pain_level <= 6 ? "text-amber-600" : "text-red-600"}`}>{log.pain_level}/10</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedPlan.incision_care_instructions && (
              <Card className="p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Incision Care</h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedPlan.incision_care_instructions}</p>
              </Card>
            )}
            {selectedPlan.activity_restrictions && (
              <Card className="p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Activity Restrictions</h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedPlan.activity_restrictions}</p>
              </Card>
            )}
            {selectedPlan.weight_bearing_status && (
              <Card className="p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Weight Bearing</h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedPlan.weight_bearing_status}</p>
              </Card>
            )}
            {selectedPlan.pt_prescription && (
              <Card className="p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">PT Prescription</h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedPlan.pt_prescription}</p>
              </Card>
            )}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}