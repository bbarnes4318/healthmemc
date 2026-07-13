import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Camera, Loader2, CheckCircle, Activity, Image as ImageIcon,
  X, Brain, AlertTriangle, Bed, PersonStanding, Accessibility, Footprints, ChevronRight
} from "lucide-react";

const mobilityOptions = [
  { value: "bedridden", label: "Bedridden", icon: Bed, color: "bg-red-50 border-red-200 text-red-700" },
  { value: "limited_assistance", label: "Limited Assistance", icon: Accessibility, color: "bg-orange-50 border-orange-200 text-orange-700" },
  { value: "with_walker", label: "With Walker", icon: PersonStanding, color: "bg-amber-50 border-amber-200 text-amber-700" },
  { value: "independent_limited", label: "Independent (Limited)", icon: Footprints, color: "bg-sky-50 border-sky-200 text-sky-700" },
  { value: "fully_mobile", label: "Fully Mobile", icon: CheckCircle, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
];

export default function QuickDailyCheckIn() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [surgeries, setSurgeries] = useState([]);
  const [selectedSurgery, setSelectedSurgery] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("mobility");
  const [mobility, setMobility] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiReview, setAiReview] = useState(null);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const data = await base44.entities.SurgicalRecovery.filter(filter, "-log_date", 50);
      setLogs(data);
      const unique = [...new Set(data.map((d) => d.surgery_name))];
      setSurgeries(unique);
      if (unique.length > 0) setSelectedSurgery(unique[0]);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentMemberId]);

  useEffect(() => { load(); }, [load]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const alreadyCheckedIn = logs.some((l) => l.log_date === todayStr && l.mobility_level);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
      toast({ title: "Photo uploaded" });
    } catch (e) {
      console.error(e);
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleAiReview = async () => {
    if (!photoUrl) return;
    setReviewing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an experienced wound care nurse reviewing a post-surgical incision photo. Analyze the image and provide a brief, non-diagnostic assessment. Look for signs of: normal healing, redness, swelling, discharge, dehiscence (wound opening), or signs of infection. Provide your observations in a calm, professional tone. Structure your response as: 1) General Appearance, 2) Areas to Monitor, 3) Recommendations. Keep it concise. Always remind the patient to contact their surgeon if they have concerns. This is for educational purposes only and does not replace professional medical evaluation.`,
        file_urls: [photoUrl],
        response_json_schema: {
          type: "object",
          properties: {
            general_appearance: { type: "string" },
            areas_to_monitor: { type: "string" },
            recommendations: { type: "string" },
            urgency_level: { type: "string", enum: ["normal", "monitor", "contact_surgeon"] },
          },
        },
      });
      setAiReview(result);
    } catch (e) {
      console.error(e);
      toast({ title: "AI review failed", description: "Photo saved without AI analysis.", variant: "destructive" });
    }
    setReviewing(false);
  };

  const handleSubmit = async () => {
    if (!selectedSurgery) {
      toast({ title: "Select a surgery first", variant: "destructive" });
      return;
    }
    if (!mobility) {
      toast({ title: "Select your mobility level", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const surgeryRecord = logs.find((l) => l.surgery_name === selectedSurgery);
      const surgeryDate = surgeryRecord?.surgery_date;
      const daysPostOp = surgeryDate
        ? Math.floor((new Date(today) - new Date(surgeryDate)) / (1000 * 60 * 60 * 24))
        : 0;

      await base44.entities.SurgicalRecovery.create({
        surgery_name: selectedSurgery,
        surgery_date: surgeryDate || today,
        surgeon: surgeryRecord?.surgeon || "",
        hospital: surgeryRecord?.hospital || "",
        log_date: today,
        days_post_op: daysPostOp,
        mobility_level: mobility,
        photo_url: photoUrl || null,
        notes: aiReview ? `AI Incision Review: ${aiReview.general_appearance || ""}` : "",
        family_member_id: currentMemberId || null,
      });

      toast({ title: "Daily check-in saved!", description: "Your recovery progress has been logged." });
      setMobility("");
      setPhotoUrl("");
      setAiReview(null);
      setStep("mobility");
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card className="p-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
      </Card>
    );
  }

  if (surgeries.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-rose-600" />
          <h3 className="font-semibold text-sm">Quick Daily Check-In</h3>
        </div>
        <p className="text-xs text-muted-foreground">Log a surgical recovery entry first to enable daily check-ins.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-rose-200 bg-gradient-to-br from-rose-50/50 to-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center">
            <Zap className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Quick Daily Check-In</h3>
            <p className="text-[10px] text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
          </div>
        </div>
        {alreadyCheckedIn && (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Checked in today
          </Badge>
        )}
      </div>

      {surgeries.length > 1 && (
        <div className="mb-3">
          <select
            value={selectedSurgery}
            onChange={(e) => setSelectedSurgery(e.target.value)}
            className="w-full h-8 rounded-md border border-input bg-transparent px-3 text-xs"
          >
            {surgeries.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-4 text-[10px]">
        <span className={`px-2 py-0.5 rounded-full ${step === "mobility" ? "bg-rose-600 text-white" : "bg-muted text-muted-foreground"}`}>1. Mobility</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
        <span className={`px-2 py-0.5 rounded-full ${step === "photo" ? "bg-rose-600 text-white" : "bg-muted text-muted-foreground"}`}>2. Photo (optional)</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
        <span className={`px-2 py-0.5 rounded-full ${step === "review" ? "bg-rose-600 text-white" : "bg-muted text-muted-foreground"}`}>3. Review</span>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Mobility */}
        {step === "mobility" && (
          <motion.div key="mobility" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <p className="text-xs font-medium text-muted-foreground mb-2">How is your mobility today?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mobilityOptions.map((opt) => {
                const MIcon = opt.icon;
                const active = mobility === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setMobility(opt.value)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-medium transition ${active ? opt.color + " ring-1 ring-rose-400" : "border-border bg-background hover:bg-muted/50 text-muted-foreground"}`}
                  >
                    <MIcon className="w-4 h-4 shrink-0" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end mt-4">
              <Button size="sm" disabled={!mobility} onClick={() => setStep("photo")} className="bg-rose-600 hover:bg-rose-700">
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Photo upload */}
        {step === "photo" && (
          <motion.div key="photo" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <p className="text-xs font-medium text-muted-foreground mb-2">Upload an incision photo for AI review (optional)</p>
            {photoUrl ? (
              <div className="relative w-full max-w-xs">
                <img src={photoUrl} alt="Incision" className="w-full rounded-lg border" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => { setPhotoUrl(""); setAiReview(null); }}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Tap to upload incision photo</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            )}

            {photoUrl && !aiReview && (
              <Button size="sm" variant="outline" className="mt-3" onClick={handleAiReview} disabled={reviewing}>
                {reviewing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Brain className="w-3.5 h-3.5 mr-1.5" />}
                Get AI Review
              </Button>
            )}

            {/* AI Review Result */}
            {aiReview && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 rounded-lg bg-sky-50 border border-sky-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <Brain className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-semibold text-sky-800">AI Incision Review</span>
                  {aiReview.urgency_level === "contact_surgeon" && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[9px] ml-auto">
                      <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Contact Surgeon
                    </Badge>
                  )}
                </div>
                {aiReview.general_appearance && (
                  <p className="text-xs text-sky-900 mb-1.5"><span className="font-medium">Appearance:</span> {aiReview.general_appearance}</p>
                )}
                {aiReview.areas_to_monitor && (
                  <p className="text-xs text-sky-900 mb-1.5"><span className="font-medium">Monitor:</span> {aiReview.areas_to_monitor}</p>
                )}
                {aiReview.recommendations && (
                  <p className="text-xs text-sky-900"><span className="font-medium">Recommendations:</span> {aiReview.recommendations}</p>
                )}
              </motion.div>
            )}

            <div className="flex justify-between mt-4">
              <Button size="sm" variant="ghost" onClick={() => setStep("mobility")}>Back</Button>
              <Button size="sm" onClick={() => setStep("review")} className="bg-rose-600 hover:bg-rose-700">
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review & Submit */}
        {step === "review" && (
          <motion.div key="review" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <span className="text-xs text-muted-foreground">Mobility Level</span>
                <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                  {mobilityOptions.find((m) => m.value === mobility)?.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <span className="text-xs text-muted-foreground">Incision Photo</span>
                {photoUrl ? (
                  <img src={photoUrl} alt="Incision" className="w-12 h-12 rounded-md object-cover border" />
                ) : (
                  <span className="text-xs text-muted-foreground">Not uploaded</span>
                )}
              </div>
              {aiReview && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">AI Review</span>
                  <Badge className="bg-sky-100 text-sky-700 border-sky-200">
                    <Brain className="w-2.5 h-2.5 mr-0.5" /> Completed
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-4">
              <Button size="sm" variant="ghost" onClick={() => setStep("photo")}>Back</Button>
              <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-rose-600 hover:bg-rose-700">
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                Save Check-In
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}