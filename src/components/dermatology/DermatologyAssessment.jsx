import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, AlertTriangle, Shield, TrendingUp, TrendingDown, Activity, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format, differenceInDays } from "date-fns";

const bodyLocations = [
  { value: "face", label: "Face" }, { value: "scalp", label: "Scalp" }, { value: "neck", label: "Neck" },
  { value: "chest", label: "Chest" }, { value: "back", label: "Back" }, { value: "abdomen", label: "Abdomen" },
  { value: "left_arm", label: "Left Arm" }, { value: "right_arm", label: "Right Arm" },
  { value: "left_hand", label: "Left Hand" }, { value: "right_hand", label: "Right Hand" },
  { value: "left_leg", label: "Left Leg" }, { value: "right_leg", label: "Right Leg" },
  { value: "left_foot", label: "Left Foot" }, { value: "right_foot", label: "Right Foot" },
  { value: "groin", label: "Groin" }, { value: "buttocks", label: "Buttocks" }, { value: "other", label: "Other" },
];

const riskConfig = {
  low: { bg: "bg-green-100", text: "text-green-700", label: "Low Risk", icon: TrendingDown },
  moderate: { bg: "bg-amber-100", text: "text-amber-700", label: "Moderate Risk", icon: Activity },
  high: { bg: "bg-red-100", text: "text-red-700", label: "High Risk", icon: AlertTriangle },
};

export default function DermatologyAssessment() {
  const { currentMemberId } = useFamilyMember();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [analyzing, setAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState(null);

  const load = async () => {
    try {
      const data = await base44.entities.DermatologyImage.list("-created_date", 500);
      const filtered = currentMemberId ? data.filter((d) => d.family_member_id === currentMemberId) : data;
      setImages(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const trackedByLocation = useMemo(() => {
    const tracked = images.filter((i) => i.tracked);
    const byLoc = {};
    tracked.forEach((img) => {
      if (!byLoc[img.body_location]) byLoc[img.body_location] = [];
      byLoc[img.body_location].push(img);
    });
    // Sort each group by date
    Object.keys(byLoc).forEach((k) => byLoc[k].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    return byLoc;
  }, [images]);

  const locationsWithTracking = Object.keys(trackedByLocation).filter((k) => trackedByLocation[k].length >= 1);

  const selectedImages = selectedLocation === "all" ? [] : (trackedByLocation[selectedLocation] || []);

  const runAssessment = async () => {
    if (selectedImages.length < 1) return;
    setAnalyzing(true);
    setAssessment(null);
    try {
      const imageList = selectedImages.map((img, i) => 
        `Photo ${i + 1} (${format(new Date(img.created_date), "MMM d, yyyy")}): ${img.image_url} | Notes: ${img.notes || "None"} | Previous AI risk: ${img.ai_risk_level || "unknown"}`
      ).join("\n");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI dermatology assistant specialized in tracking healing progress over time. Analyze this series of skin photos from the same body location (${bodyLocations.find((l) => l.value === selectedLocation)?.label || selectedLocation}), taken over time. 

Your task:
1. Assess the overall healing trajectory (improving, stable, or worsening)
2. Identify specific changes between photos (size, color, texture, borders, elevation)
3. Flag any concerning changes that may require urgent dermatologist attention
4. Provide a healing progress score (0-100, where 100 = fully healed)
5. List specific milestones or improvements observed

Photos to analyze:
${imageList}

This is NOT a medical diagnosis. Always recommend professional evaluation.`,
        file_urls: selectedImages.map((img) => img.image_url),
        response_json_schema: {
          type: "object",
          properties: {
            healing_trajectory: { type: "string", enum: ["improving", "stable", "worsening", "mixed"] },
            healing_progress_score: { type: "number" },
            timeline_summary: { type: "string" },
            changes_detected: { type: "array", items: { type: "string" } },
            concerning_changes: { type: "array", items: { type: "string" } },
            milestones: { type: "array", items: { type: "string" } },
            current_risk_level: { type: "string", enum: ["low", "moderate", "high"] },
            recommendation: { type: "string" },
            follow_up_needed: { type: "boolean" },
          },
        },
      });
      setAssessment(result);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>;
  }

  if (images.filter((i) => i.tracked).length === 0) {
    return (
      <Card className="p-12 text-center">
        <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">No tracked photos yet</p>
        <p className="text-xs text-muted-foreground mt-1">Upload photos and mark them as "Track changes over time" to use the AI healing assessment.</p>
      </Card>
    );
  }

  const trajectoryConfig = {
    improving: { icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", label: "Improving" },
    stable: { icon: Activity, color: "text-sky-600", bg: "bg-sky-50", label: "Stable" },
    worsening: { icon: TrendingDown, color: "text-red-600", bg: "bg-red-50", label: "Worsening" },
    mixed: { icon: Activity, color: "text-amber-600", bg: "bg-amber-50", label: "Mixed" },
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
          <Brain className="w-4 h-4 text-teal-600" /> AI Healing Progress Assessment
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Select a body area to analyze all tracked photos over time. The AI will assess healing trajectory and flag concerning changes automatically.</p>

        <div className="mb-4">
          <Label className="text-xs mb-1 block">Select tracked body location</Label>
          <Select value={selectedLocation} onValueChange={(v) => { setSelectedLocation(v); setAssessment(null); }}>
            <SelectTrigger className="w-full sm:w-56 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Choose a location...</SelectItem>
              {locationsWithTracking.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {bodyLocations.find((l) => l.value === loc)?.label || loc} ({trackedByLocation[loc].length} photos)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedLocation !== "all" && selectedImages.length > 0 && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {selectedImages.map((img) => (
                <div key={img.id} className="shrink-0 relative">
                  <img src={img.image_url} alt="Skin" className="w-20 h-20 rounded-lg object-cover border-2 border-border" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 text-center rounded-b-lg">
                    {format(new Date(img.created_date), "MMM d")}
                  </div>
                </div>
              ))}
            </div>

            {selectedImages.length >= 2 && (
              <div className="text-xs text-muted-foreground mb-3">
                Span: {differenceInDays(new Date(selectedImages[selectedImages.length - 1].created_date), new Date(selectedImages[0].created_date))} days · {selectedImages.length} photos tracked
              </div>
            )}

            <Button onClick={runAssessment} disabled={analyzing} className="w-full bg-teal-600 hover:bg-teal-700">
              {analyzing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing healing progress...</> : <><Sparkles className="w-4 h-4 mr-2" /> Run AI Healing Assessment</>}
            </Button>
          </>
        )}
      </Card>

      {assessment && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold">Healing Assessment Results</h3>
            </div>

            {/* Trajectory & Score */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-3 rounded-lg ${trajectoryConfig[assessment.healing_trajectory]?.bg || "bg-muted"}`}>
                <p className="text-[10px] text-muted-foreground mb-1">Trajectory</p>
                <div className="flex items-center gap-1.5">
                  {React.createElement(trajectoryConfig[assessment.healing_trajectory]?.icon || Activity, { className: `w-4 h-4 ${trajectoryConfig[assessment.healing_trajectory]?.color}` })}
                  <span className={`text-sm font-bold ${trajectoryConfig[assessment.healing_trajectory]?.color}`}>
                    {trajectoryConfig[assessment.healing_trajectory]?.label || assessment.healing_trajectory}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-1">Healing Progress</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-teal-600">{assessment.healing_progress_score}/100</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${assessment.healing_progress_score}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Current Risk */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Current Risk Level:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskConfig[assessment.current_risk_level]?.bg} ${riskConfig[assessment.current_risk_level]?.text}`}>
                {riskConfig[assessment.current_risk_level]?.label || assessment.current_risk_level}
              </span>
              {assessment.follow_up_needed && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Follow-up recommended
                </span>
              )}
            </div>

            {/* Timeline Summary */}
            {assessment.timeline_summary && (
              <div className="p-3 bg-teal-50 rounded-lg mb-3">
                <p className="text-xs font-medium text-teal-700 mb-0.5">Timeline Summary</p>
                <p className="text-sm text-teal-900">{assessment.timeline_summary}</p>
              </div>
            )}

            {/* Changes Detected */}
            {assessment.changes_detected?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Changes Detected</p>
                <div className="space-y-1">
                  {assessment.changes_detected.map((c, i) => (
                    <div key={i} className="text-xs p-2 bg-muted/30 rounded-lg flex items-start gap-2">
                      <Activity className="w-3 h-3 text-sky-500 mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concerning Changes */}
            {assessment.concerning_changes?.length > 0 && (
              <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <p className="text-xs font-semibold text-red-700">Concerning Changes Flagged</p>
                </div>
                <div className="space-y-1">
                  {assessment.concerning_changes.map((c, i) => (
                    <div key={i} className="text-xs text-red-800 flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones */}
            {assessment.milestones?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Healing Milestones</p>
                <div className="flex flex-wrap gap-1.5">
                  {assessment.milestones.map((m, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            {assessment.recommendation && (
              <div className="p-3 bg-muted/50 rounded-lg mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Recommendation</p>
                <p className="text-sm">{assessment.recommendation}</p>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">This AI assessment is for informational purposes only and is not a medical diagnosis. If concerning changes are flagged, please consult a licensed dermatologist promptly.</p>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}