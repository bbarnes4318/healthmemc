import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, GitCompare, ThumbsUp, ThumbsDown, Stethoscope, Clock, AlertTriangle, DollarSign, Activity, CheckCircle, X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const specialties = [
  { value: "general", label: "General" },
  { value: "cardiology", label: "Cardiology" },
  { value: "orthopedics", label: "Orthopedics" },
  { value: "neurology", label: "Neurology" },
  { value: "oncology", label: "Oncology" },
  { value: "surgery", label: "Surgery" },
  { value: "internal_medicine", label: "Internal Medicine" },
  { value: "emergency_medicine", label: "Emergency Medicine" },
  { value: "dentistry", label: "Dentistry" },
  { value: "veterinary_medicine", label: "Veterinary Medicine" },
];

const approachLabels = {
  open: "Open Surgery",
  laparoscopic: "Laparoscopic",
  robotic: "Robotic-Assisted",
  endoscopic: "Endoscopic",
  minimally_invasive: "Minimally Invasive",
  other: "Other",
};

const riskConfig = {
  low: { label: "Low Risk", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  moderate: { label: "Moderate Risk", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  high: { label: "High Risk", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

const emptyForm = {
  plan_name: "",
  case_title: "",
  specialty: "surgery",
  author_role: "doctor",
  approach_type: "open",
  procedure_summary: "",
  expected_outcomes: "",
  recovery_time_weeks: "",
  risk_level: "moderate",
  risks: "",
  cost_estimate: "",
};

export default function TreatmentPlanComparison() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);
  const [voting, setVoting] = useState(null);
  const [filterCase, setFilterCase] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await base44.entities.TreatmentPlan.list("-created_date", 100);
      setPlans(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.plan_name.trim() || !form.case_title.trim() || !form.procedure_summary.trim()) return;
    setSaving(true);
    try {
      await base44.entities.TreatmentPlan.create({
        ...form,
        recovery_time_weeks: form.recovery_time_weeks ? parseFloat(form.recovery_time_weeks) : undefined,
        cost_estimate: form.cost_estimate ? parseFloat(form.cost_estimate) : undefined,
        author_name: (await base44.auth.me())?.full_name || "Anonymous",
      });
      setForm(emptyForm);
      setDialogOpen(false);
      load();
      toast({ title: "Treatment plan created", description: "Your surgical plan is ready for comparison." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to create plan", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleVote = async (plan, voteType) => {
    setVoting(plan.id);
    try {
      const update = voteType === "support"
        ? { support_votes: (plan.support_votes || 0) + 1 }
        : { concern_votes: (plan.concern_votes || 0) + 1 };
      await base44.entities.TreatmentPlan.update(plan.id, update);
      load();
    } catch (e) { console.error(e); }
    setVoting(null);
  };

  const togglePlanSelection = (planId) => {
    setSelectedPlanIds((prev) => {
      if (prev.includes(planId)) return prev.filter((id) => id !== planId);
      if (prev.length >= 3) return [...prev.slice(1), planId];
      return [...prev, planId];
    });
  };

  const caseTitles = [...new Set(plans.map((p) => p.case_title))];
  const filteredPlans = filterCase === "all" ? plans : plans.filter((p) => p.case_title === filterCase);
  const selectedPlans = selectedPlanIds.map((id) => plans.find((p) => p.id === id)).filter(Boolean);

  const getConsensus = (plan) => {
    const total = (plan.support_votes || 0) + (plan.concern_votes || 0);
    if (total === 0) return { label: "No votes", pct: 0, color: "text-muted-foreground" };
    const pct = Math.round((plan.support_votes / total) * 100);
    if (pct >= 70) return { label: "Strong consensus", pct, color: "text-emerald-600" };
    if (pct >= 50) return { label: "Favorable", pct, color: "text-sky-600" };
    return { label: "Divided", pct, color: "text-amber-600" };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-sky-600" /> Surgical Treatment Plan Comparison
          </h2>
          <p className="text-xs text-muted-foreground">Compare surgical approaches side-by-side · Reach clinical consensus through peer voting</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-600 hover:bg-sky-700" size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Treatment Plan</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Plan Name *</Label>
                <Input placeholder="e.g., Laparoscopic Cholecystectomy Approach" value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Case Title *</Label>
                <Input placeholder="e.g., 55yo female, recurrent gallstones" value={form.case_title} onChange={(e) => setForm({ ...form, case_title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Specialty</Label>
                  <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{specialties.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Your Role</Label>
                  <Select value={form.author_role} onValueChange={(v) => setForm({ ...form, author_role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="specialist">Specialist</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="dentist">Dentist</SelectItem>
                      <SelectItem value="veterinarian">Veterinarian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Surgical Approach *</Label>
                  <Select value={form.approach_type} onValueChange={(v) => setForm({ ...form, approach_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(approachLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Risk Level</Label>
                  <Select value={form.risk_level} onValueChange={(v) => setForm({ ...form, risk_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Procedure Summary *</Label>
                <Textarea placeholder="Describe the surgical technique, key steps, and approach..." value={form.procedure_summary} onChange={(e) => setForm({ ...form, procedure_summary: e.target.value })} rows={4} className="resize-none" />
              </div>
              <div>
                <Label className="text-xs">Expected Outcomes</Label>
                <Textarea placeholder="Expected clinical outcomes, success rates, patient benefits..." value={form.expected_outcomes} onChange={(e) => setForm({ ...form, expected_outcomes: e.target.value })} rows={3} className="resize-none" />
              </div>
              <div>
                <Label className="text-xs">Risks & Complications</Label>
                <Textarea placeholder="Potential complications, contraindications..." value={form.risks} onChange={(e) => setForm({ ...form, risks: e.target.value })} rows={2} className="resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Recovery (weeks)</Label>
                  <Input type="number" placeholder="e.g., 4" value={form.recovery_time_weeks} onChange={(e) => setForm({ ...form, recovery_time_weeks: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Cost Estimate ($)</Label>
                  <Input type="number" placeholder="e.g., 15000" value={form.cost_estimate} onChange={(e) => setForm({ ...form, cost_estimate: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.plan_name.trim() || !form.case_title.trim() || !form.procedure_summary.trim() || saving} className="bg-sky-600 hover:bg-sky-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Case Filter */}
      {caseTitles.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button onClick={() => setFilterCase("all")} className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition ${filterCase === "all" ? "bg-sky-600 border-sky-600 text-white" : "border-border hover:bg-muted text-muted-foreground"}`}>
            All Cases
          </button>
          {caseTitles.map((title) => (
            <button key={title} onClick={() => setFilterCase(title)} className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition ${filterCase === title ? "bg-sky-600 border-sky-600 text-white" : "border-border hover:bg-muted text-muted-foreground"}`}>
              {title}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>
      ) : filteredPlans.length === 0 ? (
        <Card className="p-12 text-center">
          <GitCompare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No treatment plans yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create surgical plans for a case, then select up to 3 to compare side-by-side.</p>
        </Card>
      ) : (
        <>
          {/* Plan Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPlans.map((plan, i) => {
              const isSelected = selectedPlanIds.includes(plan.id);
              const consensus = getConsensus(plan);
              const risk = riskConfig[plan.risk_level] || riskConfig.moderate;
              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className={`p-4 cursor-pointer transition-all ${isSelected ? "ring-2 ring-sky-500 border-sky-300" : "hover:shadow-md hover:border-sky-200"}`} onClick={() => togglePlanSelection(plan.id)}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium">{approachLabels[plan.approach_type]}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${risk.bg} ${risk.color} ${risk.border}`}>{risk.label}</span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-sky-600 ml-auto" />}
                    </div>
                    <h3 className="text-sm font-semibold">{plan.plan_name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plan.case_title}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      {plan.recovery_time_weeks && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{plan.recovery_time_weeks}w recovery</span>}
                      {plan.cost_estimate && <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" />${plan.cost_estimate.toLocaleString()}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-600"><ThumbsUp className="w-3 h-3" />{plan.support_votes || 0}</span>
                      <span className="flex items-center gap-0.5 text-[10px] text-red-500"><ThumbsDown className="w-3 h-3" />{plan.concern_votes || 0}</span>
                      <span className={`text-[10px] ml-auto font-medium ${consensus.color}`}>{consensus.label}</span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Side-by-Side Comparison */}
          {selectedPlans.length >= 2 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <GitCompare className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-semibold">Side-by-Side Comparison</h3>
                <span className="text-xs text-muted-foreground">({selectedPlans.length} plans selected)</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={() => setSelectedPlanIds([])}>
                  <X className="w-3 h-3 mr-1" /> Clear
                </Button>
              </div>
              <div className={`grid gap-3 ${selectedPlans.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 lg:grid-cols-3"}`}>
                {selectedPlans.map((plan) => {
                  const risk = riskConfig[plan.risk_level] || riskConfig.moderate;
                  const consensus = getConsensus(plan);
                  const totalVotes = (plan.support_votes || 0) + (plan.concern_votes || 0);
                  return (
                    <Card key={plan.id} className="p-4 flex flex-col">
                      <div className="mb-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium">{approachLabels[plan.approach_type]}</span>
                        <h4 className="text-sm font-bold mt-2">{plan.plan_name}</h4>
                        <p className="text-[10px] text-muted-foreground">{plan.case_title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">by {plan.author_name}</p>
                      </div>

                      <div className="space-y-2.5 flex-1">
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1"><Stethoscope className="w-3 h-3" /> Procedure</p>
                          <p className="text-[11px] mt-0.5">{plan.procedure_summary}</p>
                        </div>
                        {plan.expected_outcomes && (
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3" /> Expected Outcomes</p>
                            <p className="text-[11px] mt-0.5">{plan.expected_outcomes}</p>
                          </div>
                        )}
                        {plan.risks && (
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Risks</p>
                            <p className="text-[11px] mt-0.5">{plan.risks}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                          <div className="text-center">
                            <p className="text-[9px] text-muted-foreground">Recovery</p>
                            <p className="text-sm font-bold">{plan.recovery_time_weeks || "—"}<span className="text-[9px]">wk</span></p>
                          </div>
                          <div className="text-center">
                            <p className="text-[9px] text-muted-foreground">Risk</p>
                            <p className={`text-sm font-bold ${risk.color}`}>{risk.label.split(" ")[0]}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[9px] text-muted-foreground">Cost</p>
                            <p className="text-sm font-bold">{plan.cost_estimate ? `$${(plan.cost_estimate / 1000).toFixed(0)}k` : "—"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Consensus Voting */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold">Clinical Consensus</span>
                          <span className={`text-[10px] font-medium ${consensus.color}`}>{consensus.label}</span>
                        </div>
                        {totalVotes > 0 && (
                          <div className="h-2 rounded-full bg-muted overflow-hidden mb-2 flex">
                            <div className="h-full bg-emerald-500" style={{ width: `${((plan.support_votes || 0) / totalVotes) * 100}%` }} />
                            <div className="h-full bg-red-400" style={{ width: `${((plan.concern_votes || 0) / totalVotes) * 100}%` }} />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50" disabled={voting === plan.id} onClick={() => handleVote(plan, "support")}>
                            {voting === plan.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3 mr-1" />}
                            Support ({plan.support_votes || 0})
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs text-red-500 border-red-200 hover:bg-red-50" disabled={voting === plan.id} onClick={() => handleVote(plan, "concern")}>
                            <ThumbsDown className="w-3 h-3 mr-1" />
                            Concern ({plan.concern_votes || 0})
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Consensus Summary */}
              <Card className="p-4 mt-3 bg-sky-50 border-sky-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-sky-800">Consensus Summary</p>
                    <p className="text-[10px] text-sky-700 mt-0.5">
                      {(() => {
                        const ranked = [...selectedPlans].sort((a, b) => {
                          const aScore = (a.support_votes || 0) - (a.concern_votes || 0);
                          const bScore = (b.support_votes || 0) - (b.concern_votes || 0);
                          return bScore - aScore;
                        });
                        const top = ranked[0];
                        const totalVotes = selectedPlans.reduce((s, p) => s + (p.support_votes || 0) + (p.concern_votes || 0), 0);
                        if (totalVotes === 0) return "No votes cast yet. Encourage colleagues to review and vote on these plans to build consensus.";
                        return `"${top.plan_name}" has the strongest peer support (${top.support_votes || 0} support, ${top.concern_votes || 0} concerns). Consider this approach as the leading recommendation pending further clinical review.`;
                      })()}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {selectedPlans.length === 1 && (
            <Card className="p-4 mt-3 bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Select at least 1 more plan to enable side-by-side comparison.</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}