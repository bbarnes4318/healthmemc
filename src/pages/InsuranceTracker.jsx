import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  Shield, Plus, Loader2, Trash2, Upload, DollarSign, FileText,
  TrendingUp, Clock, CheckCircle2, XCircle, CreditCard, Pencil, ChevronRight
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { motion } from "framer-motion";

const planTypes = [
  { value: "hmo", label: "HMO" },
  { value: "ppo", label: "PPO" },
  { value: "epo", label: "EPO" },
  { value: "pos", label: "POS" },
  { value: "medicare", label: "Medicare" },
  { value: "medicaid", label: "Medicaid" },
  { value: "other", label: "Other" },
];

const claimStatuses = {
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700", icon: Clock },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  partially_paid: { label: "Partially Paid", color: "bg-violet-100 text-violet-700", icon: DollarSign },
  paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  denied: { label: "Denied", color: "bg-red-100 text-red-700", icon: XCircle },
};

const providerTypes = [
  { value: "primary_care", label: "Primary Care" },
  { value: "specialist", label: "Specialist" },
  { value: "emergency_room", label: "Emergency Room" },
  { value: "urgent_care", label: "Urgent Care" },
  { value: "lab_work", label: "Lab Work" },
  { value: "imaging", label: "Imaging" },
  { value: "surgery", label: "Surgery" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "mental_health", label: "Mental Health" },
  { value: "other", label: "Other" },
];

const emptyPolicy = {
  provider_name: "",
  policy_number: "",
  group_number: "",
  subscriber_name: "",
  plan_name: "",
  plan_type: "ppo",
  effective_date: "",
  termination_date: "",
  copay_amount: "",
  deductible_amount: "",
  deductible_met: 0,
  coinsurance_percentage: "",
  out_of_pocket_max: "",
  customer_service_phone: "",
  notes: "",
};

const emptyClaim = {
  claim_number: "",
  provider_name: "",
  service_date: format(new Date(), "yyyy-MM-dd"),
  service_description: "",
  provider_type: "primary_care",
  billed_amount: "",
  insurance_paid: "",
  patient_responsibility: "",
  status: "submitted",
  submitted_date: format(new Date(), "yyyy-MM-dd"),
  resolution_date: "",
  denial_reason: "",
  notes: "",
};

export default function InsuranceTracker() {
  const { currentMemberId } = useFamilyMember();
  const [cards, setCards] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("policies");
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [policyForm, setPolicyForm] = useState(emptyPolicy);
  const [claimForm, setClaimForm] = useState(emptyClaim);
  const [editingCardId, setEditingCardId] = useState(null);
  const [deductibleEditId, setDeductileEditId] = useState(null);
  const [deductibleValue, setDeductibleValue] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [cardData, claimData] = await Promise.all([
        base44.entities.InsuranceCard.list("-created_date", 100),
        base44.entities.InsuranceClaim.list("-service_date", 100),
      ]);
      setCards(cardData);
      setClaims(claimData);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleUploadCardImage = async (file, field) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPolicyForm((prev) => ({ ...prev, [field]: file_url }));
      toast({ title: "Card image uploaded" });
    } catch (e) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const handleSavePolicy = async () => {
    if (!policyForm.provider_name.trim() || !policyForm.policy_number.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...policyForm,
        copay_amount: policyForm.copay_amount ? parseFloat(policyForm.copay_amount) : undefined,
        deductible_amount: policyForm.deductible_amount ? parseFloat(policyForm.deductible_amount) : undefined,
        deductible_met: policyForm.deductible_met ? parseFloat(policyForm.deductible_met) : 0,
        coinsurance_percentage: policyForm.coinsurance_percentage ? parseFloat(policyForm.coinsurance_percentage) : undefined,
        out_of_pocket_max: policyForm.out_of_pocket_max ? parseFloat(policyForm.out_of_pocket_max) : undefined,
      };
      if (editingCardId) {
        await base44.entities.InsuranceCard.update(editingCardId, payload);
        toast({ title: "Policy updated" });
      } else {
        await base44.entities.InsuranceCard.create(payload);
        toast({ title: "Policy added" });
      }
      setPolicyForm(emptyPolicy);
      setEditingCardId(null);
      setPolicyDialogOpen(false);
      loadData();
    } catch (e) {
      toast({ title: "Failed to save policy", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleSaveClaim = async () => {
    if (!claimForm.service_description.trim() || !claimForm.service_date) return;
    setSaving(true);
    try {
      const payload = {
        ...claimForm,
        billed_amount: claimForm.billed_amount ? parseFloat(claimForm.billed_amount) : undefined,
        insurance_paid: claimForm.insurance_paid ? parseFloat(claimForm.insurance_paid) : undefined,
        patient_responsibility: claimForm.patient_responsibility ? parseFloat(claimForm.patient_responsibility) : undefined,
      };
      await base44.entities.InsuranceClaim.create(payload);
      setClaimForm(emptyClaim);
      setClaimDialogOpen(false);
      loadData();
      toast({ title: "Claim logged" });
    } catch (e) {
      toast({ title: "Failed to save claim", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDeleteCard = async (id) => {
    await base44.entities.InsuranceCard.delete(id);
    setCards(cards.filter((c) => c.id !== id));
    toast({ title: "Policy deleted" });
  };

  const handleDeleteClaim = async (id) => {
    await base44.entities.InsuranceClaim.delete(id);
    setClaims(claims.filter((c) => c.id !== id));
    toast({ title: "Claim deleted" });
  };

  const updateClaimStatus = async (id, status) => {
    await base44.entities.InsuranceClaim.update(id, {
      status,
      resolution_date: ["paid", "denied", "approved"].includes(status) ? format(new Date(), "yyyy-MM-dd") : undefined,
    });
    loadData();
    toast({ title: "Claim status updated" });
  };

  const updateDeductible = async (cardId) => {
    await base44.entities.InsuranceCard.update(cardId, { deductible_met: parseFloat(deductibleValue) || 0 });
    setDeductileEditId(null);
    loadData();
    toast({ title: "Deductible progress updated" });
  };

  const startEditPolicy = (card) => {
    setPolicyForm({
      ...emptyPolicy,
      ...card,
      copay_amount: card.copay_amount?.toString() || "",
      deductible_amount: card.deductible_amount?.toString() || "",
      deductible_met: card.deductible_met?.toString() || "0",
      coinsurance_percentage: card.coinsurance_percentage?.toString() || "",
      out_of_pocket_max: card.out_of_pocket_max?.toString() || "",
    });
    setEditingCardId(card.id);
    setPolicyDialogOpen(true);
  };

  // Summary stats
  const totalDeductible = cards.reduce((s, c) => s + (c.deductible_amount || 0), 0);
  const totalMet = cards.reduce((s, c) => s + (c.deductible_met || 0), 0);
  const pendingClaims = claims.filter((c) => ["submitted", "pending"].includes(c.status));
  const pendingAmount = pendingClaims.reduce((s, c) => s + (c.patient_responsibility || c.billed_amount || 0), 0);
  const totalPatientResp = claims.filter((c) => ["paid", "partially_paid"].includes(c.status)).reduce((s, c) => s + (c.patient_responsibility || 0), 0);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Insurance Tracker</h1>
          <p className="text-sm text-muted-foreground">Manage policies, track deductibles & monitor claims</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <p className="text-[10px] text-muted-foreground font-medium">Deductible Progress</p>
          </div>
          <p className="text-lg font-bold text-blue-700">${totalMet.toFixed(0)} / ${totalDeductible.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground">{totalDeductible > 0 ? `${((totalMet / totalDeductible) * 100).toFixed(0)}% met` : "No deductible set"}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-[10px] text-muted-foreground font-medium">Pending Claims</p>
          </div>
          <p className="text-lg font-bold text-amber-700">{pendingClaims.length}</p>
          <p className="text-[10px] text-muted-foreground">${pendingAmount.toFixed(0)} est. responsibility</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <p className="text-[10px] text-muted-foreground font-medium">Total Out-of-Pocket</p>
          </div>
          <p className="text-lg font-bold text-emerald-700">${totalPatientResp.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground">From resolved claims</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-violet-600" />
            <p className="text-[10px] text-muted-foreground font-medium">Active Policies</p>
          </div>
          <p className="text-lg font-bold text-violet-700">{cards.length}</p>
          <p className="text-[10px] text-muted-foreground">{cards.filter((c) => !c.termination_date || new Date(c.termination_date) > new Date()).length} in force</p>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 max-w-md mb-4">
          <TabsTrigger value="policies"><CreditCard className="w-3.5 h-3.5 mr-1.5" />Policies</TabsTrigger>
          <TabsTrigger value="deductibles"><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Deductibles</TabsTrigger>
          <TabsTrigger value="claims"><FileText className="w-3.5 h-3.5 mr-1.5" />Claims</TabsTrigger>
        </TabsList>

        {/* POLICIES TAB */}
        <TabsContent value="policies">
          <div className="flex justify-end mb-3">
            <Dialog open={policyDialogOpen} onOpenChange={(open) => { setPolicyDialogOpen(open); if (!open) { setPolicyForm(emptyPolicy); setEditingCardId(null); } }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-1.5" />Add Policy</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCardId ? "Edit Policy" : "Add Insurance Policy"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Provider Name *</Label>
                      <Input placeholder="Blue Cross Blue Shield" value={policyForm.provider_name} onChange={(e) => setPolicyForm({ ...policyForm, provider_name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Policy Number *</Label>
                      <Input placeholder="ABC123456" value={policyForm.policy_number} onChange={(e) => setPolicyForm({ ...policyForm, policy_number: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Group Number</Label>
                      <Input placeholder="GRP-789" value={policyForm.group_number} onChange={(e) => setPolicyForm({ ...policyForm, group_number: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Subscriber Name</Label>
                      <Input placeholder="John Doe" value={policyForm.subscriber_name} onChange={(e) => setPolicyForm({ ...policyForm, subscriber_name: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Plan Name</Label>
                      <Input placeholder="Gold PPO 500" value={policyForm.plan_name} onChange={(e) => setPolicyForm({ ...policyForm, plan_name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Plan Type</Label>
                      <Select value={policyForm.plan_type} onValueChange={(v) => setPolicyForm({ ...policyForm, plan_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{planTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Effective Date</Label>
                      <Input type="date" value={policyForm.effective_date} onChange={(e) => setPolicyForm({ ...policyForm, effective_date: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Termination Date</Label>
                      <Input type="date" value={policyForm.termination_date} onChange={(e) => setPolicyForm({ ...policyForm, termination_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Copay ($)</Label>
                      <Input type="number" placeholder="25" value={policyForm.copay_amount} onChange={(e) => setPolicyForm({ ...policyForm, copay_amount: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Deductible ($)</Label>
                      <Input type="number" placeholder="1500" value={policyForm.deductible_amount} onChange={(e) => setPolicyForm({ ...policyForm, deductible_amount: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Met So Far ($)</Label>
                      <Input type="number" placeholder="0" value={policyForm.deductible_met} onChange={(e) => setPolicyForm({ ...policyForm, deductible_met: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Coinsurance (%)</Label>
                      <Input type="number" placeholder="20" value={policyForm.coinsurance_percentage} onChange={(e) => setPolicyForm({ ...policyForm, coinsurance_percentage: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Out-of-Pocket Max ($)</Label>
                      <Input type="number" placeholder="5000" value={policyForm.out_of_pocket_max} onChange={(e) => setPolicyForm({ ...policyForm, out_of_pocket_max: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Customer Service Phone</Label>
                    <Input placeholder="1-800-555-0100" value={policyForm.customer_service_phone} onChange={(e) => setPolicyForm({ ...policyForm, customer_service_phone: e.target.value })} />
                  </div>

                  {/* Card Image Uploads */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Card Front Photo</Label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center gap-1.5 h-9 border border-dashed border-input rounded-md hover:bg-muted text-xs text-muted-foreground">
                            <Upload className="w-3.5 h-3.5" /> {policyForm.card_front_url ? "Front uploaded ✓" : "Upload front"}
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleUploadCardImage(e.target.files[0], "card_front_url")} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Card Back Photo</Label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center gap-1.5 h-9 border border-dashed border-input rounded-md hover:bg-muted text-xs text-muted-foreground">
                            <Upload className="w-3.5 h-3.5" /> {policyForm.card_back_url ? "Back uploaded ✓" : "Upload back"}
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleUploadCardImage(e.target.files[0], "card_back_url")} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea placeholder="Any additional policy details..." value={policyForm.notes} onChange={(e) => setPolicyForm({ ...policyForm, notes: e.target.value })} rows={2} className="resize-none" />
                  </div>

                  <Button onClick={handleSavePolicy} disabled={!policyForm.provider_name.trim() || !policyForm.policy_number.trim() || saving} className="w-full bg-blue-600 hover:bg-blue-700">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                    {editingCardId ? "Update Policy" : "Save Policy"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : cards.length === 0 ? (
            <Card className="p-12 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No insurance policies yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add your policy details to track deductibles and claims.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map((card, i) => (
                <motion.div key={card.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                  <Card className="p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/3" />
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{card.provider_name}</p>
                          {card.plan_name && <p className="text-xs text-muted-foreground">{card.plan_name}</p>}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase">{planTypes.find((t) => t.value === card.plan_type)?.label || card.plan_type}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Policy #:</span> <span className="font-medium">{card.policy_number}</span></div>
                      {card.group_number && <div><span className="text-muted-foreground">Group:</span> <span className="font-medium">{card.group_number}</span></div>}
                      {card.copay_amount != null && <div><span className="text-muted-foreground">Copay:</span> <span className="font-medium">${card.copay_amount}</span></div>}
                      {card.coinsurance_percentage != null && <div><span className="text-muted-foreground">Coinsurance:</span> <span className="font-medium">{card.coinsurance_percentage}%</span></div>}
                      {card.effective_date && <div><span className="text-muted-foreground">Effective:</span> <span className="font-medium">{format(new Date(card.effective_date), "MMM d, yyyy")}</span></div>}
                      {card.termination_date && <div><span className="text-muted-foreground">Expires:</span> <span className="font-medium">{format(new Date(card.termination_date), "MMM d, yyyy")}</span></div>}
                    </div>

                    {card.customer_service_phone && (
                      <div className="mt-2 text-xs"><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{card.customer_service_phone}</span></div>
                    )}

                    {(card.card_front_url || card.card_back_url) && (
                      <div className="flex gap-2 mt-3">
                        {card.card_front_url && <img src={card.card_front_url} alt="Card front" className="h-16 rounded-md object-cover border" />}
                        {card.card_back_url && <img src={card.card_back_url} alt="Card back" className="h-16 rounded-md object-cover border" />}
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-4 pt-3 border-t">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => startEditPolicy(card)}>
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700" onClick={() => handleDeleteCard(card.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* DEDUCTIBLES TAB */}
        <TabsContent value="deductibles">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : cards.filter((c) => c.deductible_amount).length === 0 ? (
            <Card className="p-12 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No deductible information yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add a policy with a deductible amount to track your progress.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {cards.filter((c) => c.deductible_amount).map((card) => {
                const met = card.deductible_met || 0;
                const total = card.deductible_amount || 1;
                const pct = Math.min((met / total) * 100, 100);
                const remaining = Math.max(total - met, 0);
                const oopMax = card.out_of_pocket_max || 0;
                const oopPct = oopMax > 0 ? Math.min((met / oopMax) * 100, 100) : 0;

                return (
                  <Card key={card.id} className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{card.provider_name}</p>
                          <p className="text-xs text-muted-foreground">{card.plan_name || card.policy_number}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{pct.toFixed(0)}% met</Badge>
                    </div>

                    {/* Deductible Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Annual Deductible</span>
                        <span className="text-xs font-bold">${met.toFixed(0)} / ${total.toFixed(0)}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : pct >= 75 ? "bg-amber-500" : "bg-blue-500"}`}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {remaining > 0 ? `$${remaining.toFixed(0)} remaining until deductible is met` : "Deductible fully met! 🎉"}
                      </p>
                    </div>

                    {/* Out-of-Pocket Max Progress */}
                    {oopMax > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">Out-of-Pocket Max</span>
                          <span className="text-xs font-bold">${met.toFixed(0)} / ${oopMax.toFixed(0)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${oopPct}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full rounded-full ${oopPct >= 100 ? "bg-red-500" : "bg-violet-500"}`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Update Deductible */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {deductibleEditId === card.id ? (
                        <>
                          <Input
                            type="number"
                            placeholder={met.toString()}
                            value={deductibleValue}
                            onChange={(e) => setDeductibleValue(e.target.value)}
                            className="h-8 w-32 text-xs"
                          />
                          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-xs" onClick={() => updateDeductible(card.id)}>Save</Button>
                          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setDeductileEditId(null)}>Cancel</Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setDeductileEditId(card.id); setDeductibleValue(met.toString()); }}>
                          <DollarSign className="w-3 h-3 mr-1" /> Update Amount Met
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* CLAIMS TAB */}
        <TabsContent value="claims">
          <div className="flex justify-end mb-3">
            <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-1.5" />Log Claim</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Log Medical Claim</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Service Date *</Label>
                      <Input type="date" value={claimForm.service_date} onChange={(e) => setClaimForm({ ...claimForm, service_date: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Provider Type</Label>
                      <Select value={claimForm.provider_type} onValueChange={(v) => setClaimForm({ ...claimForm, provider_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{providerTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Service Description *</Label>
                    <Input placeholder="Annual physical, MRI lumbar spine, etc." value={claimForm.service_description} onChange={(e) => setClaimForm({ ...claimForm, service_description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Claim Number</Label>
                      <Input placeholder="CLM-2024-001" value={claimForm.claim_number} onChange={(e) => setClaimForm({ ...claimForm, claim_number: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Insurance Provider</Label>
                      <Input placeholder="Blue Cross" value={claimForm.provider_name} onChange={(e) => setClaimForm({ ...claimForm, provider_name: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Billed ($)</Label>
                      <Input type="number" placeholder="500" value={claimForm.billed_amount} onChange={(e) => setClaimForm({ ...claimForm, billed_amount: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Insurance Paid ($)</Label>
                      <Input type="number" placeholder="400" value={claimForm.insurance_paid} onChange={(e) => setClaimForm({ ...claimForm, insurance_paid: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Your Cost ($)</Label>
                      <Input type="number" placeholder="100" value={claimForm.patient_responsibility} onChange={(e) => setClaimForm({ ...claimForm, patient_responsibility: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Status</Label>
                      <Select value={claimForm.status} onValueChange={(v) => setClaimForm({ ...claimForm, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(claimStatuses).map(([key, s]) => <SelectItem key={key} value={key}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Submitted Date</Label>
                      <Input type="date" value={claimForm.submitted_date} onChange={(e) => setClaimForm({ ...claimForm, submitted_date: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea placeholder="Additional claim details..." value={claimForm.notes} onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })} rows={2} className="resize-none" />
                  </div>
                  <Button onClick={handleSaveClaim} disabled={!claimForm.service_description.trim() || !claimForm.service_date || saving} className="w-full bg-blue-600 hover:bg-blue-700">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                    Save Claim
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : claims.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No claims logged yet</p>
              <p className="text-xs text-muted-foreground mt-1">Track your medical claims to monitor their status and your costs.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {claims.map((claim, i) => {
                const StatusIcon = claimStatuses[claim.status]?.icon || Clock;
                const daysSince = differenceInDays(new Date(), new Date(claim.submitted_date || claim.service_date));
                return (
                  <motion.div key={claim.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                    <Card className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <StatusIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{claim.service_description}</p>
                            <Badge className={`text-[10px] ${claimStatuses[claim.status]?.color}`} variant="none">
                              {claimStatuses[claim.status]?.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{format(new Date(claim.service_date), "MMM d, yyyy")}</span>
                            {claim.provider_type && <span>• {providerTypes.find((t) => t.value === claim.provider_type)?.label}</span>}
                            {claim.claim_number && <span>• #{claim.claim_number}</span>}
                            {["submitted", "pending"].includes(claim.status) && <span>• {daysSince}d ago</span>}
                          </div>
                          {(claim.billed_amount != null || claim.patient_responsibility != null) && (
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              {claim.billed_amount != null && <span><span className="text-muted-foreground">Billed:</span> <span className="font-medium">${claim.billed_amount}</span></span>}
                              {claim.insurance_paid != null && <span><span className="text-muted-foreground">Insurance:</span> <span className="font-medium text-emerald-600">${claim.insurance_paid}</span></span>}
                              {claim.patient_responsibility != null && <span><span className="text-muted-foreground">Your cost:</span> <span className="font-bold text-red-600">${claim.patient_responsibility}</span></span>}
                            </div>
                          )}
                          {claim.denial_reason && <p className="text-xs text-red-600 mt-1">Denied: {claim.denial_reason}</p>}
                          {claim.notes && <p className="text-xs text-muted-foreground mt-1">{claim.notes}</p>}

                          {/* Quick status update */}
                          <div className="flex items-center gap-1 mt-2">
                            <Select value={claim.status} onValueChange={(v) => updateClaimStatus(claim.id, v)}>
                              <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(claimStatuses).map(([key, s]) => <SelectItem key={key} value={key}>{s.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDeleteClaim(claim.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}