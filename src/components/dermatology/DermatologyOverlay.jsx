import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { GitCompare, Loader2, Layers } from "lucide-react";
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

export default function DermatologyOverlay() {
  const { currentMemberId } = useFamilyMember();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [imageA, setImageA] = useState(null);
  const [imageB, setImageB] = useState(null);
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const load = async () => {
    try {
      const data = await base44.entities.DermatologyImage.list("-created_date", 200);
      const filtered = currentMemberId ? data.filter((d) => d.family_member_id === currentMemberId) : data;
      setImages(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const locationFiltered = (selectedLocation === "all" ? images : images.filter((d) => d.body_location === selectedLocation))
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const locationsWithImages = [...new Set(images.map((i) => i.body_location))];

  // Auto-select first two images when location changes
  useEffect(() => {
    if (locationFiltered.length >= 2) {
      setImageA(locationFiltered[0]);
      setImageB(locationFiltered[locationFiltered.length - 1]);
    } else {
      setImageA(null);
      setImageB(null);
    }
  }, [selectedLocation, images]);

  const handleSliderMove = useCallback((clientX) => {
    if (!containerRef.current || !isDragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  useEffect(() => {
    const handleMove = (e) => handleSliderMove(e.touches ? e.touches[0].clientX : e.clientX);
    const handleUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [handleSliderMove]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>;
  }

  if (images.length < 2) {
    return (
      <Card className="p-12 text-center">
        <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Need at least 2 photos to use the overlay tool</p>
        <p className="text-xs text-muted-foreground mt-1">Upload more photos in the Gallery tab first.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-600" /> Photo Overlay Comparison
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Drag the slider to blend two photos and spot subtle improvements over time.</p>

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

        {locationFiltered.length < 2 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-muted-foreground">Need at least 2 photos in this location to overlay.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <Label className="text-xs mb-1 block">Before (left side)</Label>
                <Select value={imageA?.id || ""} onValueChange={(id) => setImageA(images.find((i) => i.id === id))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {locationFiltered.map((img) => (
                      <SelectItem key={img.id} value={img.id}>
                        {format(new Date(img.created_date), "MMM d, yyyy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">After (right side)</Label>
                <Select value={imageB?.id || ""} onValueChange={(id) => setImageB(images.find((i) => i.id === id))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {locationFiltered.map((img) => (
                      <SelectItem key={img.id} value={img.id}>
                        {format(new Date(img.created_date), "MMM d, yyyy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {imageA && imageB && (
              <>
                <div
                  ref={containerRef}
                  className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-border cursor-ew-resize select-none"
                  onMouseDown={(e) => { isDragging.current = true; handleSliderMove(e.clientX); }}
                  onTouchStart={(e) => { isDragging.current = true; handleSliderMove(e.touches[0].clientX); }}
                >
                  {/* Bottom layer: Image B (After) */}
                  <img src={imageB.image_url} alt="After" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                  {/* Top layer: Image A (Before), clipped by slider */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img
                      src={imageA.image_url}
                      alt="Before"
                      className="absolute inset-0 h-full object-cover"
                      style={{ width: containerRef.current?.clientWidth || "100%", maxWidth: "none" }}
                      draggable={false}
                    />
                  </div>
                  {/* Slider line */}
                  <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}>
                    <div className="w-0.5 h-full bg-white shadow-lg" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <GitCompare className="w-4 h-4 text-teal-600" />
                    </div>
                  </div>
                  {/* Labels */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full pointer-events-none">
                    {format(new Date(imageA.created_date), "MMM d, yyyy")}
                  </div>
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full pointer-events-none">
                    {format(new Date(imageB.created_date), "MMM d, yyyy")}
                  </div>
                </div>

                <div className="mt-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(parseInt(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>← Before</span>
                    <span>Drag to compare</span>
                    <span>After →</span>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                  <p className="text-[10px] text-teal-800">
                    <strong>Tip:</strong> Align the slider over specific features to spot subtle changes in size, color, or texture between the two photos.
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
}