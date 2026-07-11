import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Upload, Loader2, Trash2, Camera, Plus, ImageIcon, AlertTriangle, Shield, Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format } from "date-fns";

const bodyLocations = [
  { value: "face", label: "Face" }, { value: "scalp", label: "Scalp" }, { value: "neck", label: "Neck" },
  { value: "chest", label: "Chest" }, { value: "back", label: "Back" }, { value: "abdomen", label: "Abdomen" },
  { value: "left_arm", label: "Left Arm" }, { value: "right_arm", label: "Right Arm" },
  { value: "left_hand", label: "Left Hand" }, { value: "right_hand", label: "Right Hand" },
  { value: "left_leg", label: "Left Leg" }, { value: "right_leg", label: "Right Leg" },
  { value: "left_foot", label: "Left Foot" }, { value: "right_foot", label: "Right Foot" },
  { value: "groin", label: "Groin" }, { value: "buttocks", label: "Buttocks" }, { value: "other", label: "Other" },
];

const concernTypes = [
  { value: "mole", label: "Mole" }, { value: "rash", label: "Rash" }, { value: "lesion", label: "Lesion" },
  { value: "acne", label: "Acne" }, { value: "wound", label: "Wound" }, { value: "discoloration", label: "Discoloration" },
  { value: "growth", label: "Growth" }, { value: "other", label: "Other" },
];

const riskColors = {
  low: { bg: "bg-green-100", text: "text-green-700", label: "Low Risk" },
  moderate: { bg: "bg-amber-100", text: "text-amber-700", label: "Moderate Risk" },
  high: { bg: "bg-red-100", text: "text-red-700", label: "High Risk" },
};

export default function DermatologyGallery({ onSelectCompare, compareList, onToggleCompare }) {
  const { currentMemberId } = useFamilyMember();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ body_location: "face", concern_type: "mole", notes: "", size_mm: "", tracked: true });
  const [fileUrl, setFileUrl] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const load = async () => {
    try {
      const data = await base44.entities.DermatologyImage.list("-created_date", 200);
      const filtered = currentMemberId ? data.filter((d) => d.family_member_id === currentMemberId) : data;
      setImages(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setAiAnalysis(null);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(result.file_url);
      // Auto-analyze with AI
      setAnalyzing(true);
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI dermatology assistant. Analyze this skin image and provide a preliminary assessment. Describe what you observe (mole, rash, lesion, etc.), note any concerning features (asymmetry, border irregularity, color variation, diameter changes), and provide a general risk level (low, moderate, or high). This is NOT a diagnosis — recommend seeing a dermatologist for proper evaluation. Be concise and clear.`,
        file_urls: [result.file_url],
        response_json_schema: {
          type: "object",
          properties: {
            observation: { type: "string" },
            concerning_features: { type: "array", items: { type: "string" } },
            risk_level: { type: "string", enum: ["low", "moderate", "high"] },
            recommendation: { type: "string" },
          },
        },
      });
      setAiAnalysis(analysis);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.DermatologyImage.create({
        image_url: fileUrl,
        body_location: form.body_location,
        concern_type: form.concern_type,
        notes: form.notes || undefined,
        size_mm: form.size_mm ? parseFloat(form.size_mm) : undefined,
        tracked: form.tracked,
        ai_analysis: aiAnalysis ? JSON.stringify(aiAnalysis) : undefined,
        ai_risk_level: aiAnalysis?.risk_level || "low",
        family_member_id: currentMemberId || undefined,
      });
      setForm({ body_location: "face", concern_type: "mole", notes: "", size_mm: "", tracked: true });
      setFileUrl(null);
      setAiAnalysis(null);
      setDialogOpen(false);
      load();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.DermatologyImage.delete(id); load(); } catch (e) { console.error(e); }
  };

  const resetDialog = () => {
    setFileUrl(null);
    setAiAnalysis(null);
    setForm({ body_location: "face", concern_type: "mole", notes: "", size_mm: "", tracked: true });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{images.length} image{images.length !== 1 ? "s" : ""} in your secure gallery</p>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetDialog(); }}>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Upload Photo
          </Button>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Skin Photo</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {!fileUrl ? (
                <label className="flex flex-col items-center gap-2 px-4 py-8 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted transition">
                  {uploading ? <Loader2 className="w-8 h-8 text-teal-600 animate-spin" /> : <Camera className="w-8 h-8 text-muted-foreground" />}
                  <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to take or select a photo"}</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
                </label>
              ) : (
                <>
                  <img src={fileUrl} alt="Skin photo" className="w-full rounded-lg max-h-60 object-cover" />
                  {analyzing ? (
                    <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg">
                      <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                      <span className="text-xs text-teal-700">AI analyzing image...</span>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-semibold">AI Assessment</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${riskColors[aiAnalysis.risk_level]?.bg} ${riskColors[aiAnalysis.risk_level]?.text}`}>
                          {riskColors[aiAnalysis.risk_level]?.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{aiAnalysis.observation}</p>
                      {aiAnalysis.concerning_features?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {aiAnalysis.concerning_features.map((f, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{f}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground italic">{aiAnalysis.recommendation}</p>
                    </div>
                  ) : null}
                  <div>
                    <Label className="text-xs">Body Location *</Label>
                    <Select value={form.body_location} onValueChange={(v) => setForm({ ...form, body_location: v })}>
                      <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {bodyLocations.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Concern Type</Label>
                    <Select value={form.concern_type} onValueChange={(v) => setForm({ ...form, concern_type: v })}>
                      <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {concernTypes.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Size (mm)</Label>
                      <Input type="number" placeholder="e.g., 5" value={form.size_mm} onChange={(e) => setForm({ ...form, size_mm: e.target.value })} className="h-9" />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={form.tracked} onChange={(e) => setForm({ ...form, tracked: e.target.checked })} className="w-4 h-4" />
                        Track changes over time
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea placeholder="Any symptoms, itchiness, pain, or changes noticed..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                    <Shield className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-amber-800">AI analysis is for informational purposes only and is not a medical diagnosis. Always consult a licensed dermatologist.</p>
                  </div>
                </>
              )}
            </div>
            {fileUrl && !analyzing && (
              <DialogFooter className="gap-2 mt-4">
                <Button variant="ghost" onClick={resetDialog}>Reset</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save to Gallery
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {images.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No skin photos yet</p>
          <p className="text-xs text-muted-foreground mt-1">Upload photos to track moles, rashes, and skin changes over time.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, i) => {
            const risk = riskColors[img.ai_risk_level] || riskColors.low;
            const isInCompare = compareList?.includes(img.id);
            return (
              <motion.div key={img.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                <Card className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${isInCompare ? "ring-2 ring-teal-500" : ""}`}>
                  <div className="relative aspect-square">
                    <img src={img.image_url} alt="Skin" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${risk.bg} ${risk.text} font-medium`}>{risk.label}</span>
                    </div>
                    {img.tracked && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-600 text-white">Tracking</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{bodyLocations.find((l) => l.value === img.body_location)?.label || img.body_location}</span>
                      <span className="text-[10px] text-muted-foreground">{concernTypes.find((c) => c.value === img.concern_type)?.label || ""}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(img.created_date), "MMM d, yyyy")}</p>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant={isInCompare ? "default" : "outline"}
                        className={`h-6 text-[10px] flex-1 ${isInCompare ? "bg-teal-600 hover:bg-teal-700" : ""}`}
                        onClick={() => onToggleCompare?.(img.id)}
                      >
                        {isInCompare ? "Selected" : "Compare"}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDelete(img.id)}>
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
  );
}