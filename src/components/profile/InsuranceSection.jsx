import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Plus, Loader2, Trash2, Upload, Lock, Calendar, Phone, ScanLine, IdCard, Download, FileDown, Mail, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { generateMedicalIdCard } from "@/lib/generateMedicalIdCard";
import { generateInsuranceSummary } from "@/lib/generateInsuranceSummary";

const planTypes = [
  { value: "hmo", label: "HMO" },
  { value: "ppo", label: "PPO" },
  { value: "epo", label: "EPO" },
  { value: "pos", label: "POS" },
  { value: "medicare", label: "Medicare" },
  { value: "medicaid", label: "Medicaid" },
  { value: "other", label: "Other" },
];

const emptyForm = {
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
  customer_service_phone: "",
  card_front_url: "",
  card_back_url: "",
  notes: "",
};

export default function InsuranceSection() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [idDialogOpen, setIdDialogOpen] = useState(false);
  const [includePhoto, setIncludePhoto] = useState(false);
  const [idPhotoUrl, setIdPhotoUrl] = useState("");
  const [uploadingIdPhoto, setUploadingIdPhoto] = useState(false);
  const [downloadingId, setDownloadingId] = useState(false);
  const [downloadingSummary, setDownloadingSummary] = useState(null);
  const [mailDialogOpen, setMailDialogOpen] = useState(false);
  const [mailingCard, setMailingCard] = useState(false);
  const [checkingCoverage, setCheckingCoverage] = useState(null);
  const [coverageResult, setCoverageResult] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const [data, u] = await Promise.all([
        base44.entities.InsuranceCard.list("-created_date", 50),
        base44.auth.me(),
      ]);
      setCards(data);
      setUser(u);
      const profiles = await base44.entities.HealthProfile.filter({ created_by_id: u.id });
      if (profiles.length > 0) setProfile(profiles[0]);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleUpload = async (e, side) => {
    const file = e.target.files[0];
    if (!file) return;
    if (side === "front") setUploadingFront(true);
    else setUploadingBack(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setForm((prev) => ({ ...prev, [`card_${side}_url`]: result.file_url }));
    } catch (err) { console.error(err); }
    if (side === "front") setUploadingFront(false);
    else setUploadingBack(false);
  };

  const handleScanCard = async () => {
    if (!form.card_front_url && !form.card_back_url) {
      toast({ title: "Upload a card image first", variant: "destructive" });
      return;
    }
    setScanning(true);
    try {
      const fileUrls = [form.card_front_url, form.card_back_url].filter(Boolean);
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: "You are an expert at reading insurance cards. Extract all visible information from these insurance card images. Return only the structured data. For plan_type, use one of: hmo, ppo, epo, pos, medicare, medicaid, other. Leave fields empty if not visible on the card.",
        file_urls: fileUrls,
        response_json_schema: {
          type: "object",
          properties: {
            provider_name: { type: "string" },
            policy_number: { type: "string" },
            group_number: { type: "string" },
            subscriber_name: { type: "string" },
            plan_name: { type: "string" },
            plan_type: { type: "string" },
            effective_date: { type: "string" },
            copay_amount: { type: "number" },
            deductible_amount: { type: "number" },
            customer_service_phone: { type: "string" },
          },
        },
      });
      setForm((prev) => ({
        ...prev,
        provider_name: response.provider_name || prev.provider_name,
        policy_number: response.policy_number || prev.policy_number,
        group_number: response.group_number || prev.group_number,
        subscriber_name: response.subscriber_name || prev.subscriber_name,
        plan_name: response.plan_name || prev.plan_name,
        plan_type: response.plan_type || prev.plan_type,
        effective_date: response.effective_date || prev.effective_date,
        copay_amount: response.copay_amount != null ? String(response.copay_amount) : prev.copay_amount,
        deductible_amount: response.deductible_amount != null ? String(response.deductible_amount) : prev.deductible_amount,
        customer_service_phone: response.customer_service_phone || prev.customer_service_phone,
      }));
      toast({ title: "Card scanned", description: "Insurance details auto-filled from your card image." });
    } catch (err) {
      console.error(err);
      toast({ title: "Scan failed", description: "Could not extract card details. Please enter manually.", variant: "destructive" });
    }
    setScanning(false);
  };

  const handleUploadIdPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingIdPhoto(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setIdPhotoUrl(result.file_url);
    } catch (err) { console.error(err); }
    setUploadingIdPhoto(false);
  };

  const handleDownloadIdCard = async () => {
    setDownloadingId(true);
    try {
      const primaryCard = cards[0] || null;
      generateMedicalIdCard({ user, profile, insuranceCard: primaryCard, includePhoto, photoUrl: idPhotoUrl });
      toast({ title: "Medical ID card downloaded" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to generate ID card", variant: "destructive" });
    }
    setDownloadingId(false);
    setIdDialogOpen(false);
  };

  const handleCheckCoverage = async (card) => {
    setCheckingCoverage(card.id);
    setCoverageResult(null);
    try {
      const [appointments, consultations] = await Promise.all([
        base44.entities.Appointment.filter({ status: "confirmed" }, "-date", 10),
        base44.entities.Consultation.filter({ status: "in_progress" }, "-created_date", 10),
      ]);
      const upcoming = appointments.filter((a) => new Date(a.date) >= new Date());
      const upcomingList = upcoming.length > 0
        ? upcoming.map((a) => `${a.title} (${a.type}, ${new Date(a.date).toLocaleDateString()})`).join("; ")
        : consultations.map((c) => `${c.specialty || c.type} consultation`).join("; ");

      if (!upcomingList) {
        setCoverageResult({ card_id: card.id, noUpcoming: true });
        setCheckingCoverage(null);
        return;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a health insurance benefits expert. A patient has the following insurance plan:\n\nProvider: ${card.provider_name}\nPlan: ${card.plan_name || "Not specified"}\nPlan Type: ${card.plan_type || "Unknown"}\nCopay: ${card.copay_amount || "Unknown"}\nDeductible: ${card.deductible_amount || "Unknown"}\n\nThe patient has these upcoming specialist appointments:\n${upcomingList}\n\nBased on typical coverage for this type of insurance plan, assess whether each appointment is likely covered. For each appointment, provide:\n1. Coverage status (likely_covered, may_require_authorization, likely_not_covered)\n2. Estimated copay or cost\n3. Any notes about pre-authorization or referrals needed\n\nBe specific and practical. Add a disclaimer that this is an estimate and the patient should verify with their insurance provider.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            appointments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  appointment: { type: "string" },
                  coverage_status: { type: "string", enum: ["likely_covered", "may_require_authorization", "likely_not_covered"] },
                  estimated_cost: { type: "string" },
                  notes: { type: "string" },
                },
              },
            },
            summary: { type: "string" },
            disclaimer: { type: "string" },
          },
        },
      });
      setCoverageResult({ card_id: card.id, ...response });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to check coverage", variant: "destructive" });
    }
    setCheckingCoverage(null);
  };

  const handleDownloadSummary = async (card) => {
    setDownloadingSummary(card.id);
    try {
      generateInsuranceSummary({ card, user });
      toast({ title: "Insurance summary downloaded" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to generate summary", variant: "destructive" });
    }
    setDownloadingSummary(null);
  };

  const handleMailPhysicalCard = async () => {
    const isFreeTier = profile?.membership_tier && ["family", "chronic_care", "premium"].includes(profile.membership_tier);

    if (isFreeTier) {
      setMailingCard(true);
      try {
        await base44.entities.InsuranceCard.update(cards[0].id, {
          notes: (cards[0].notes ? cards[0].notes + "\n" : "") + `[${new Date().toLocaleDateString()}] Physical card mailing requested (free with ${profile.membership_tier} plan).`,
        });
        toast({ title: "Physical card request submitted", description: "Your physical ID card will be mailed within 5-7 business days." });
        setMailDialogOpen(false);
      } catch (err) {
        toast({ title: "Failed to submit request", variant: "destructive" });
      }
      setMailingCard(false);
    } else {
      setMailingCard(true);
      try {
        const response = await base44.functions.invoke("create-checkout", {
          item_name: "Physical Medical ID Card",
          price: "19.99",
        });
        if (response.data?.redirectUrl) {
          window.location.href = response.data.redirectUrl;
        } else {
          toast({ title: "Failed to start checkout", variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Failed to start checkout", variant: "destructive" });
      }
      setMailingCard(false);
    }
  };

  const handleSave = async () => {
    if (!form.provider_name.trim() || !form.policy_number.trim()) return;
    setSaving(true);
    try {
      const data = {
        ...form,
        copay_amount: form.copay_amount ? parseFloat(form.copay_amount) : undefined,
        deductible_amount: form.deductible_amount ? parseFloat(form.deductible_amount) : undefined,
      };
      await base44.entities.InsuranceCard.create(data);
      setForm(emptyForm);
      setDialogOpen(false);
      loadCards();
      toast({ title: "Insurance card saved", description: "Your insurance information has been stored securely." });
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.InsuranceCard.delete(id);
      setCards(cards.filter((c) => c.id !== id));
      toast({ title: "Insurance card deleted" });
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Your insurance information is stored securely and privately.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={idDialogOpen} onOpenChange={setIdDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <IdCard className="w-4 h-4 mr-1.5" /> Medical ID Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Download Medical ID Card</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-xs text-muted-foreground">
                  Generates a printable PDF with your patient info, insurance details, and emergency contact. Photo ID is optional.
                </p>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Include photo ID</p>
                    <p className="text-xs text-muted-foreground">Optional — adds a photo to the card</p>
                  </div>
                  <input type="checkbox" checked={includePhoto} onChange={(e) => setIncludePhoto(e.target.checked)} className="w-4 h-4" />
                </div>
                {includePhoto && (
                  <div>
                    <Label className="text-xs">Upload Photo</Label>
                    <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition text-sm">
                      {uploadingIdPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : idPhotoUrl ? <img src={idPhotoUrl} alt="ID Photo" className="max-h-16 object-contain" /> : <><Upload className="w-4 h-4" /> Upload photo</>}
                      <input type="file" accept="image/*" className="hidden" onChange={handleUploadIdPhoto} />
                    </label>
                  </div>
                )}
                <Button onClick={handleDownloadIdCard} disabled={downloadingId} className="w-full bg-sky-600 hover:bg-sky-700">
                  {downloadingId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Download PDF
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={mailDialogOpen} onOpenChange={setMailDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={cards.length === 0}>
                <Mail className="w-4 h-4 mr-1.5" /> Mail Physical Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Mail Physical ID Card</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Physical ID Card</p>
                  <p className="text-2xl font-bold text-sky-600 mt-1">$19.99</p>
                  <p className="text-xs text-muted-foreground mt-1">Durable printed card mailed to your address in 5-7 business days.</p>
                </div>
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
                  <p className="text-xs text-sky-700">
                    <strong>Membership benefit:</strong> Physical ID cards are included at no extra cost with Family, Chronic Care, and Premium membership plans.
                  </p>
                </div>
                {profile?.membership_tier && ["family", "chronic_care", "premium"].includes(profile.membership_tier) ? (
                  <Button onClick={handleMailPhysicalCard} disabled={mailingCard} className="w-full bg-sky-600 hover:bg-sky-700">
                    {mailingCard ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    Mail My Card (Free with {profile.membership_tier.replace(/_/g, " ")} plan)
                  </Button>
                ) : (
                  <Button onClick={handleMailPhysicalCard} disabled={mailingCard} className="w-full bg-sky-600 hover:bg-sky-700">
                    {mailingCard ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    Pay $19.99 & Mail Card
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-600 hover:bg-sky-700" size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Add Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Insurance Card</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Provider Name *</Label>
                  <Input placeholder="e.g., Blue Cross" value={form.provider_name} onChange={(e) => setForm({ ...form, provider_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Policy Number *</Label>
                  <Input placeholder="Policy #" value={form.policy_number} onChange={(e) => setForm({ ...form, policy_number: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Group Number</Label>
                  <Input placeholder="Group #" value={form.group_number} onChange={(e) => setForm({ ...form, group_number: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Subscriber Name</Label>
                  <Input placeholder="Full name" value={form.subscriber_name} onChange={(e) => setForm({ ...form, subscriber_name: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Plan Name</Label>
                  <Input placeholder="e.g., Gold PPO" value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Plan Type</Label>
                  <Select value={form.plan_type} onValueChange={(v) => setForm({ ...form, plan_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {planTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Effective Date</Label>
                  <Input type="date" value={form.effective_date} onChange={(e) => setForm({ ...form, effective_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Termination Date</Label>
                  <Input type="date" value={form.termination_date} onChange={(e) => setForm({ ...form, termination_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Copay ($)</Label>
                  <Input type="number" placeholder="25" value={form.copay_amount} onChange={(e) => setForm({ ...form, copay_amount: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Deductible ($)</Label>
                  <Input type="number" placeholder="1500" value={form.deductible_amount} onChange={(e) => setForm({ ...form, deductible_amount: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Customer Service Phone</Label>
                <Input placeholder="1-800-..." value={form.customer_service_phone} onChange={(e) => setForm({ ...form, customer_service_phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Card Front Image</Label>
                  <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition text-sm">
                    {uploadingFront ? <Loader2 className="w-4 h-4 animate-spin" /> : form.card_front_url ? <img src={form.card_front_url} alt="Front" className="max-h-16 object-contain" /> : <><Upload className="w-4 h-4" /> Upload front</>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "front")} />
                  </label>
                </div>
                <div>
                  <Label className="text-xs">Card Back Image</Label>
                  <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition text-sm">
                    {uploadingBack ? <Loader2 className="w-4 h-4 animate-spin" /> : form.card_back_url ? <img src={form.card_back_url} alt="Back" className="max-h-16 object-contain" /> : <><Upload className="w-4 h-4" /> Upload back</>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "back")} />
                  </label>
                </div>
              </div>
              {(form.card_front_url || form.card_back_url) && (
                <Button
                  variant="outline"
                  onClick={handleScanCard}
                  disabled={scanning}
                  className="w-full border-sky-300 text-sky-700 hover:bg-sky-50"
                >
                  {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScanLine className="w-4 h-4 mr-2" />}
                  {scanning ? "Scanning card..." : "Auto-Extract Details from Card"}
                </Button>
              )}
              <Textarea placeholder="Additional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
              <Button onClick={handleSave} disabled={!form.provider_name.trim() || !form.policy_number.trim() || saving} className="w-full bg-sky-600 hover:bg-sky-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                Save Securely
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {cards.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No insurance cards saved yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your insurance provider info and card images for quick access.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <Card key={card.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{card.provider_name}</h3>
                    {card.plan_name && <p className="text-xs text-muted-foreground">{card.plan_name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {card.plan_type && (
                    <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium uppercase">
                      {planTypes.find((t) => t.value === card.plan_type)?.label || card.plan_type}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                    onClick={() => handleCheckCoverage(card)}
                    disabled={checkingCoverage === card.id}
                  >
                    {checkingCoverage === card.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span className="hidden sm:inline ml-1">Coverage</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                    onClick={() => handleDownloadSummary(card)}
                    disabled={downloadingSummary === card.id}
                  >
                    {downloadingSummary === card.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    <span className="hidden sm:inline ml-1">Summary</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(card.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Policy Number</p>
                  <p className="font-medium">{card.policy_number}</p>
                </div>
                {card.group_number && (
                  <div>
                    <p className="text-xs text-muted-foreground">Group Number</p>
                    <p className="font-medium">{card.group_number}</p>
                  </div>
                )}
                {card.subscriber_name && (
                  <div>
                    <p className="text-xs text-muted-foreground">Subscriber</p>
                    <p className="font-medium">{card.subscriber_name}</p>
                  </div>
                )}
                {card.copay_amount != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Copay</p>
                    <p className="font-medium">${card.copay_amount}</p>
                  </div>
                )}
                {card.deductible_amount != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Deductible</p>
                    <p className="font-medium">${card.deductible_amount}</p>
                  </div>
                )}
                {card.customer_service_phone && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                    <p className="font-medium">{card.customer_service_phone}</p>
                  </div>
                )}
                {card.effective_date && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Effective</p>
                    <p className="font-medium">{new Date(card.effective_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {(card.card_front_url || card.card_back_url) && (
                <div className="flex gap-3 mt-3">
                  {card.card_front_url && (
                    <a href={card.card_front_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <img src={card.card_front_url} alt="Card front" className="w-full h-24 object-cover rounded-lg border hover:opacity-80 transition" />
                      <p className="text-xs text-center text-muted-foreground mt-1">Front</p>
                    </a>
                  )}
                  {card.card_back_url && (
                    <a href={card.card_back_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <img src={card.card_back_url} alt="Card back" className="w-full h-24 object-cover rounded-lg border hover:opacity-80 transition" />
                      <p className="text-xs text-center text-muted-foreground mt-1">Back</p>
                    </a>
                  )}
                </div>
              )}

              {card.notes && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">{card.notes}</p>}

              {coverageResult?.card_id === card.id && coverageResult.noUpcoming && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                  No confirmed upcoming appointments to check coverage for.
                </div>
              )}

              {coverageResult?.card_id === card.id && !coverageResult.noUpcoming && (
                <div className="mt-3 p-4 bg-violet-50 border border-violet-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-violet-600" />
                    <p className="text-sm font-semibold text-violet-900">Benefit Coverage Check</p>
                  </div>
                  {coverageResult.summary && <p className="text-xs text-violet-800">{coverageResult.summary}</p>}
                  {coverageResult.appointments?.map((apt, i) => (
                    <div key={i} className="p-3 bg-white rounded-lg border border-violet-100 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium">{apt.appointment}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                          apt.coverage_status === "likely_covered" ? "bg-emerald-100 text-emerald-700" :
                          apt.coverage_status === "may_require_authorization" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {apt.coverage_status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      {apt.estimated_cost && <p className="text-xs text-muted-foreground">Est. cost: {apt.estimated_cost}</p>}
                      {apt.notes && <p className="text-xs text-muted-foreground italic">{apt.notes}</p>}
                    </div>
                  ))}
                  {coverageResult.disclaimer && (
                    <p className="text-[10px] text-muted-foreground italic">{coverageResult.disclaimer}</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}