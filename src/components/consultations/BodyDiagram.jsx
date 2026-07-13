import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Activity, Loader2, Trash2, Calendar, TrendingUp, ChevronRight, LineChart as LineChartIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format } from "date-fns";
import PainRegionTrendChart from "@/components/health/PainRegionTrendChart";

const severityColors = {
  mild: { fill: "#fbbf24", bg: "bg-amber-100", text: "text-amber-700", label: "Mild" },
  moderate: { fill: "#f97316", bg: "bg-orange-100", text: "text-orange-700", label: "Moderate" },
  severe: { fill: "#ef4444", bg: "bg-red-100", text: "text-red-700", label: "Severe" },
};

const regionLabels = {
  head: "Head", neck: "Neck",
  left_shoulder: "Left Shoulder", right_shoulder: "Right Shoulder",
  left_arm: "Left Arm", right_arm: "Right Arm",
  chest: "Chest", abdomen: "Abdomen", back: "Upper Back", lower_back: "Lower Back",
  left_hip: "Left Hip", right_hip: "Right Hip",
  left_thigh: "Left Thigh", right_thigh: "Right Thigh",
  left_knee: "Left Knee", right_knee: "Right Knee",
  left_calf: "Left Calf", right_calf: "Right Calf",
  left_foot: "Left Foot", right_foot: "Right Foot",
};

const painTypes = ["aching", "sharp", "burning", "throbbing", "stiffness", "numbness", "tingling", "cramping", "other"];

// Body region click targets as SVG rects/ellipses on a 200x400 viewBox
const frontRegions = [
  { id: "head", el: "ellipse", props: { cx: 100, cy: 30, rx: 22, ry: 28 } },
  { id: "neck", el: "rect", props: { x: 88, y: 55, width: 24, height: 18, rx: 8 } },
  { id: "left_shoulder", el: "ellipse", props: { cx: 60, cy: 82, rx: 18, ry: 12 } },
  { id: "right_shoulder", el: "ellipse", props: { cx: 140, cy: 82, rx: 18, ry: 12 } },
  { id: "chest", el: "rect", props: { x: 75, y: 95, width: 50, height: 45, rx: 10 } },
  { id: "abdomen", el: "rect", props: { x: 78, y: 140, width: 44, height: 50, rx: 10 } },
  { id: "left_arm", el: "rect", props: { x: 32, y: 95, width: 18, height: 70, rx: 9 } },
  { id: "right_arm", el: "rect", props: { x: 150, y: 95, width: 18, height: 70, rx: 9 } },
  { id: "left_hip", el: "ellipse", props: { cx: 72, cy: 200, rx: 16, ry: 14 } },
  { id: "right_hip", el: "ellipse", props: { cx: 128, cy: 200, rx: 16, ry: 14 } },
  { id: "left_thigh", el: "rect", props: { x: 62, y: 215, width: 22, height: 60, rx: 11 } },
  { id: "right_thigh", el: "rect", props: { x: 116, y: 215, width: 22, height: 60, rx: 11 } },
  { id: "left_knee", el: "ellipse", props: { cx: 73, cy: 285, rx: 12, ry: 10 } },
  { id: "right_knee", el: "ellipse", props: { cx: 127, cy: 285, rx: 12, ry: 10 } },
  { id: "left_calf", el: "rect", props: { x: 63, y: 298, width: 20, height: 55, rx: 10 } },
  { id: "right_calf", el: "rect", props: { x: 117, y: 298, width: 20, height: 55, rx: 10 } },
  { id: "left_foot", el: "ellipse", props: { cx: 70, cy: 365, rx: 14, ry: 8 } },
  { id: "right_foot", el: "ellipse", props: { cx: 130, cy: 365, rx: 14, ry: 8 } },
];

const backRegions = [
  { id: "head", el: "ellipse", props: { cx: 100, cy: 30, rx: 22, ry: 28 } },
  { id: "neck", el: "rect", props: { x: 88, y: 55, width: 24, height: 18, rx: 8 } },
  { id: "left_shoulder", el: "ellipse", props: { cx: 60, cy: 82, rx: 18, ry: 12 } },
  { id: "right_shoulder", el: "ellipse", props: { cx: 140, cy: 82, rx: 18, ry: 12 } },
  { id: "back", el: "rect", props: { x: 75, y: 95, width: 50, height: 50, rx: 10 } },
  { id: "lower_back", el: "rect", props: { x: 78, y: 145, width: 44, height: 45, rx: 10 } },
  { id: "left_arm", el: "rect", props: { x: 32, y: 95, width: 18, height: 70, rx: 9 } },
  { id: "right_arm", el: "rect", props: { x: 150, y: 95, width: 18, height: 70, rx: 9 } },
  { id: "left_hip", el: "ellipse", props: { cx: 72, cy: 200, rx: 16, ry: 14 } },
  { id: "right_hip", el: "ellipse", props: { cx: 128, cy: 200, rx: 16, ry: 14 } },
  { id: "left_thigh", el: "rect", props: { x: 62, y: 215, width: 22, height: 60, rx: 11 } },
  { id: "right_thigh", el: "rect", props: { x: 116, y: 215, width: 22, height: 60, rx: 11 } },
  { id: "left_knee", el: "ellipse", props: { cx: 73, cy: 285, rx: 12, ry: 10 } },
  { id: "right_knee", el: "ellipse", props: { cx: 127, cy: 285, rx: 12, ry: 10 } },
  { id: "left_calf", el: "rect", props: { x: 63, y: 298, width: 20, height: 55, rx: 10 } },
  { id: "right_calf", el: "rect", props: { x: 117, y: 298, width: 20, height: 55, rx: 10 } },
  { id: "left_foot", el: "ellipse", props: { cx: 70, cy: 365, rx: 14, ry: 8 } },
  { id: "right_foot", el: "ellipse", props: { cx: 130, cy: 365, rx: 14, ry: 8 } },
];

export default function BodyDiagram() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [view, setView] = useState("front");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [form, setForm] = useState({ severity: "mild", symptom_description: "", pain_type: "aching", duration: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrends, setShowTrends] = useState(false);

  const load = async () => {
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const data = await base44.entities.SymptomMap.filter(filter, "-logged_at", 200);
      setEntries(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const handleRegionClick = (regionId) => {
    setSelectedRegion(regionId);
    setForm({ severity: "mild", symptom_description: "", pain_type: "aching", duration: "", notes: "" });
  };

  const handleSave = async () => {
    if (!selectedRegion) return;
    setSaving(true);
    try {
      await base44.entities.SymptomMap.create({
        body_region: selectedRegion,
        body_view: view,
        severity: form.severity,
        symptom_description: form.symptom_description || undefined,
        pain_type: form.pain_type,
        duration: form.duration || undefined,
        notes: form.notes || undefined,
        logged_at: new Date().toISOString(),
        family_member_id: currentMemberId || undefined,
      });
      setSelectedRegion(null);
      load();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.SymptomMap.delete(id); load(); } catch (e) { console.error(e); }
  };

  const regions = view === "front" ? frontRegions : backRegions;
  const regionEntries = entries.filter((e) => e.body_view === view);

  // Get the latest entry for each region to show on the body
  const latestByRegion = {};
  regionEntries.forEach((e) => {
    if (!latestByRegion[e.body_region] || new Date(e.logged_at) > new Date(latestByRegion[e.body_region].logged_at)) {
      latestByRegion[e.body_region] = e;
    }
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" /> Interactive Body Map
          </h3>
          <p className="text-xs text-muted-foreground">Click a region to log pain or symptoms · {currentMemberName}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <Button size="sm" variant={view === "front" ? "default" : "ghost"} className={`h-7 text-xs ${view === "front" ? "bg-sky-600" : ""}`} onClick={() => setView("front")}>Front</Button>
            <Button size="sm" variant={view === "back" ? "default" : "ghost"} className={`h-7 text-xs ${view === "back" ? "bg-sky-600" : ""}`} onClick={() => setView("back")}>Back</Button>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant={showTrends ? "default" : "outline"} className={`h-7 text-xs ${showTrends ? "bg-sky-600" : ""}`} onClick={() => { setShowTrends(!showTrends); setShowHistory(false); }}>
              <LineChartIcon className="w-3.5 h-3.5 mr-1" /> Trends
            </Button>
            <Button size="sm" variant={showHistory ? "default" : "outline"} className={`h-7 text-xs ${showHistory ? "bg-sky-600" : ""}`} onClick={() => { setShowHistory(!showHistory); setShowTrends(false); }}>
              <Calendar className="w-3.5 h-3.5 mr-1" /> History
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Body SVG */}
        <div className="flex justify-center">
          <svg viewBox="0 0 200 400" className="w-48 h-96">
            {/* Body silhouette */}
            <ellipse cx="100" cy="30" rx="24" ry="30" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="1" />
            <rect x="85" y="55" width="30" height="20" rx="8" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="1" />
            <path d="M 50 80 Q 50 75 55 75 L 145 75 Q 150 75 150 80 L 150 190 Q 150 195 145 195 L 55 195 Q 50 195 50 190 Z" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="1" />
            <rect x="28" y="90" width="24" height="80" rx="12" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="1" />
            <rect x="148" y="90" width="24" height="80" rx="12" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="1" />
            <rect x="58" y="190" width="34" height="80" rx="15" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="1" />
            <rect x="108" y="190" width="34" height="80" rx="15" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="1" />
            <rect x="60" y="280" width="26" height="60" rx="13" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="1" />
            <rect x="114" y="280" width="26" height="60" rx="13" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="1" />
            <ellipse cx="70" cy="355" rx="16" ry="8" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="1" />
            <ellipse cx="130" cy="355" rx="16" ry="8" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="1" />

            {/* Clickable regions */}
            {regions.map((region) => {
              const latest = latestByRegion[region.id];
              const fillColor = latest ? severityColors[latest.severity].fill : "transparent";
              const opacity = latest ? 0.6 : (hoveredRegion === region.id ? 0.3 : 0.15);
              const isHovered = hoveredRegion === region.id;
              return (
                <g key={region.id}>
                  {region.el === "ellipse" ? (
                    <ellipse
                      {...region.props}
                      fill={fillColor}
                      fillOpacity={opacity}
                      stroke={isHovered ? "#0284c7" : latest ? severityColors[latest.severity].fill : "#94a3b8"}
                      strokeWidth={isHovered ? 2 : latest ? 1.5 : 0.5}
                      strokeDasharray={latest ? "none" : "2 2"}
                      className="cursor-pointer transition-all"
                      onClick={() => handleRegionClick(region.id)}
                      onMouseEnter={() => setHoveredRegion(region.id)}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                  ) : (
                    <rect
                      {...region.props}
                      fill={fillColor}
                      fillOpacity={opacity}
                      stroke={isHovered ? "#0284c7" : latest ? severityColors[latest.severity].fill : "#94a3b8"}
                      strokeWidth={isHovered ? 2 : latest ? 1.5 : 0.5}
                      strokeDasharray={latest ? "none" : "2 2"}
                      className="cursor-pointer transition-all"
                      onClick={() => handleRegionClick(region.id)}
                      onMouseEnter={() => setHoveredRegion(region.id)}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                  )}
                  {latest && (
                    <circle
                      cx={region.props.cx || (region.props.x + region.props.width / 2)}
                      cy={region.props.cy || (region.props.y + region.props.height / 2)}
                      r="3"
                      fill={severityColors[latest.severity].fill}
                      stroke="white"
                      strokeWidth="1"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Side Panel */}
        <div className="flex-1 min-w-0">
          {/* Legend */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {Object.entries(severityColors).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: val.fill }} />
                <span className="text-[10px] text-muted-foreground">{val.label}</span>
              </div>
            ))}
          </div>

          {hoveredRegion && (
            <div className="p-2 bg-sky-50 rounded-lg mb-3">
              <p className="text-xs text-sky-700 font-medium">{regionLabels[hoveredRegion]}</p>
            </div>
          )}

          {showTrends ? (
            <div>
              <h4 className="text-xs font-semibold mb-3 flex items-center gap-1"><LineChartIcon className="w-3.5 h-3.5 text-sky-600" /> Pain Trends by Region</h4>
              <PainRegionTrendChart entries={entries} />
            </div>
          ) : showHistory ? (
            <div>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-sky-600" /> Symptom History</h4>
              {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-sky-600" /></div>
              ) : entries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No symptoms logged yet. Click a body region to start.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {entries.map((entry, i) => (
                    <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                      <div className="p-2.5 bg-muted/50 rounded-lg flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0`} style={{ background: severityColors[entry.severity].fill }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{regionLabels[entry.body_region] || entry.body_region}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${severityColors[entry.severity].bg} ${severityColors[entry.severity].text}`}>
                              {severityColors[entry.severity].label}
                            </span>
                          </div>
                          {entry.symptom_description && <p className="text-[10px] text-muted-foreground mt-0.5">{entry.symptom_description}</p>}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-muted-foreground">{format(new Date(entry.logged_at), "MMM d, h:mm a")}</span>
                            {entry.pain_type && <span className="text-[9px] text-muted-foreground capitalize">· {entry.pain_type}</span>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 shrink-0" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h4 className="text-xs font-semibold mb-2">How to Use</h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-sky-500" /> Click any body region to log a symptom</p>
                <p className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-sky-500" /> Colored dots show your latest pain severity</p>
                <p className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-sky-500" /> Switch between front and back views</p>
                <p className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-sky-500" /> Use the Trends tab to see if treatments are reducing pain</p>
                <p className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-sky-500" /> View the History tab to track changes over time</p>
              </div>

              {/* Active regions summary */}
              {Object.keys(latestByRegion).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold mb-2">Active Symptoms ({view} view)</h4>
                  <div className="space-y-1.5">
                    {Object.entries(latestByRegion).map(([region, entry]) => (
                      <div key={region} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: severityColors[entry.severity].fill }} />
                        <span className="text-xs font-medium flex-1">{regionLabels[region] || region}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${severityColors[entry.severity].bg} ${severityColors[entry.severity].text}`}>
                          {severityColors[entry.severity].label}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{format(new Date(entry.logged_at), "MMM d")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Symptom Entry Dialog */}
      <Dialog open={!!selectedRegion} onOpenChange={(v) => { if (!v) setSelectedRegion(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Symptom: {selectedRegion && regionLabels[selectedRegion]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Severity *</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {Object.entries(severityColors).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setForm({ ...form, severity: key })}
                    className={`p-2 rounded-lg border-2 text-xs font-medium transition ${form.severity === key ? "border-current" : "border-border"}`}
                    style={form.severity === key ? { color: val.fill, background: val.bg } : {}}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Pain Type</Label>
              <Select value={form.pain_type} onValueChange={(v) => setForm({ ...form, pain_type: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {painTypes.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Symptom Description</Label>
              <Input placeholder="e.g., Dull ache, tender to touch" value={form.symptom_description} onChange={(e) => setForm({ ...form, symptom_description: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Duration</Label>
              <Input placeholder="e.g., 3 days, 2 weeks" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Additional details..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setSelectedRegion(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-sky-600 hover:bg-sky-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Symptom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}