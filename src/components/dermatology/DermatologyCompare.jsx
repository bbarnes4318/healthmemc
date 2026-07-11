import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  GitCompare, Loader2, Sparkles, AlertTriangle, Shield, ArrowRight, Calendar,
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

export default function DermatologyCompare() {
  const { currentMemberId } = useFamilyMember();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [imageA, setImageA] = useState(null);
  const [imageB, setImageB] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const load = async () => {
    try {
      const data = await base44.entities.DermatologyImage.list("-created_date", 200);
      const filtered = currentMemberId ? data.filter((d) => d.family_member_id === currentMemberId) : data;
      setImages(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const locationFiltered = selectedLocation === "all" ? images : images.filter((d) => d.body_location === selectedLocation);

  // Group by location for select dropdown
  const locationsWithImages = [...new Set(images.map((i) => i.body_location))];

  const runComparison = async () => {
    if (!imageA || !imageB) return;
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI dermatology assistant. Compare these two skin photos of the same body area taken at different times. Analyze and describe any visible changes between the two images. Look for changes in: size, shape/borders, color, texture, elevation, and any new features. Provide a summary of changes and whether they appear concerning. This is NOT a diagnosis — recommend seeing a dermatologist for proper evaluation.

Image A (earlier): ${imageA.image_url}
Image A date: ${format(new Date(imageA.created_date), "MMM d, yyyy")}
Image A notes: ${imageA.notes || "None"}

Image B (later): ${imageB.image_url}
Image B date: ${format(new Date(imageB.created_date), "MMM d, yyyy")}
Image B notes: ${imageB.notes || "None"}`,
        file_urls: [imageA.image_url, imageB.image_url],
        response_json_schema: {
          type: "object",
          properties: {
            size_change: { type: "string" },
            shape_change: { type: "string" },
            color_change: { type: "string" },
            texture_change: { type: "string" },
            other_changes: { type: "array", items: { type: "string" } },
            overall_assessment: { type: "string" },
            concerning: { type: "boolean" },
            recommendation: { type: "string" },
          },
        },
      });
      setAnalysis(result);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  const handleSelectA = (id) => {
    const img = images.find((i) => i.id === id);
    setImageA(img);
    setAnalysis(null);
  };

  const handleSelectB = (id) => {
    const img = images.find((i) => i.id === id);
    setImageB(img);
    setAnalysis(null);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>;
  }

  if (images.length < 2) {
    return (
      <Card className="p-12 text-center">
        <GitCompare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Need at least 2 images to compare</p>
        <p className="text-xs text-muted-foreground mt-1">Upload more photos in the Gallery tab to track changes over time.</p>
      </Card>
    );
  }

  // Sort selected images by date for display
  const sortedSelected = [imageA, imageB].filter(Boolean).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-teal-600" /> Compare Skin Changes
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Select two photos of the same area to see how your skin has changed over time.</p>

        {/* Location filter */}
        <div className="mb-4">
          <Label className="text-xs mb-1 block">Filter by body location</Label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full sm:w-56 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locationsWithImages.map((loc) => (
                <SelectItem key={loc} value={loc}>{bodyLocations.find((l) => l.value === loc)?.label || loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Image selectors */}
        <div className="grid grid-cols-2 gap-4">
          {/* Image A */}
          <div>
            <Label className="text-xs mb-1 block">Earlier Photo</Label>
            <Select value={imageA?.id || ""} onValueChange={handleSelectA}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select photo..." /></SelectTrigger>
              <SelectContent>
                {locationFiltered.map((img) => (
                  <SelectItem key={img.id} value={img.id}>
                    {bodyLocations.find((l) => l.value === img.body_location)?.label} · {format(new Date(img.created_date), "MMM d, yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {imageA && (
              <div className="mt-2 relative rounded-lg overflow-hidden">
                <img src={imageA.image_url} alt="Earlier" className="w-full aspect-square object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1">
                  {format(new Date(imageA.created_date), "MMM d, yyyy")}
                </div>
              </div>
            )}
          </div>

          {/* Image B */}
          <div>
            <Label className="text-xs mb-1 block">Later Photo</Label>
            <Select value={imageB?.id || ""} onValueChange={handleSelectB}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select photo..." /></SelectTrigger>
              <SelectContent>
                {locationFiltered.map((img) => (
                  <SelectItem key={img.id} value={img.id}>
                    {bodyLocations.find((l) => l.value === img.body_location)?.label} · {format(new Date(img.created_date), "MMM d, yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {imageB && (
              <div className="mt-2 relative rounded-lg overflow-hidden">
                <img src={imageB.image_url} alt="Later" className="w-full aspect-square object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1">
                  {format(new Date(imageB.created_date), "MMM d, yyyy")}
                </div>
              </div>
            )}
          </div>
        </div>

        {imageA && imageB && (
          <div className="mt-4">
            <Button onClick={runComparison} disabled={analyzing} className="w-full bg-teal-600 hover:bg-teal-700">
              {analyzing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing changes...</> : <><Sparkles className="w-4 h-4 mr-2" /> Run AI Comparison</>}
            </Button>
          </div>
        )}
      </Card>

      {/* AI Comparison Results */}
      {analysis && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold">AI Change Analysis</h3>
              {analysis.concerning && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Changes Detected
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {analysis.size_change && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Size</p>
                  <p className="text-sm">{analysis.size_change}</p>
                </div>
              )}
              {analysis.shape_change && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Shape & Borders</p>
                  <p className="text-sm">{analysis.shape_change}</p>
                </div>
              )}
              {analysis.color_change && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Color</p>
                  <p className="text-sm">{analysis.color_change}</p>
                </div>
              )}
              {analysis.texture_change && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Texture</p>
                  <p className="text-sm">{analysis.texture_change}</p>
                </div>
              )}
            </div>

            {analysis.other_changes?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Other Changes</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.other_changes.map((c, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">{c}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-teal-50 rounded-lg mb-3">
              <p className="text-xs font-medium text-teal-700 mb-0.5">Overall Assessment</p>
              <p className="text-sm text-teal-900">{analysis.overall_assessment}</p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Recommendation</p>
              <p className="text-sm">{analysis.recommendation}</p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">This AI comparison is for informational purposes only and is not a medical diagnosis. If you notice concerning changes, please consult a licensed dermatologist promptly.</p>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}