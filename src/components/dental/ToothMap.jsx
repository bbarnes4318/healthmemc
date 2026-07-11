import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Smile, Loader2, Trash2, Calendar, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const severityColors = {
  mild: "#fbbf24",
  moderate: "#f97316",
  severe: "#ef4444",
};

const gumAreaLabels = {
  upper_left: "Upper Left", upper_front: "Upper Front", upper_right: "Upper Right",
  lower_left: "Lower Left", lower_front: "Lower Front", lower_right: "Lower Right",
};

// Upper teeth L→R: 1-16, Lower teeth L→R: 32-17
const upperTeeth = Array.from({ length: 16 }, (_, i) => i + 1);
const lowerTeeth = Array.from({ length: 16 }, (_, i) => 32 - i);

export default function ToothMap() {
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [gumAreas, setGumAreas] = useState([]);
  const [severity, setSeverity] = useState("mild");
  const [painType, setPainType] = useState("aching");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const load = async () => {
    try {
      const data = await base44.entities.DentalPainLog.list("-logged_at", 100);
      setHistory(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleTooth = (num) => {
    setSelectedTeeth((prev) => prev.includes(num) ? prev.filter((t) => t !== num) : [...prev, num]);
  };

  const toggleGum = (area) => {
    setGumAreas((prev) => prev.includes(area) ? prev.filter((g) => g !== area) : [...prev, area]);
  };

  const handleSave = async () => {
    if (selectedTeeth.length === 0 && gumAreas.length === 0) return;
    setSaving(true);
    try {
      await base44.entities.DentalPainLog.create({
        pain_teeth: selectedTeeth,
        gum_pain_areas: gumAreas,
        severity,
        pain_type: painType,
        duration: duration || undefined,
        notes: notes || undefined,
        logged_at: new Date().toISOString(),
      });
      setSelectedTeeth([]); setGumAreas([]); setDuration(""); setNotes("");
      load();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.DentalPainLog.delete(id); load(); } catch (e) { console.error(e); }
  };

  const toothFill = (num) => {
    if (!selectedTeeth.includes(num)) return "#f0f9ff";
    return severityColors[severity];
  };

  const renderTooth = (num, x) => (
    <g key={num} className="cursor-pointer" onClick={() => toggleTooth(num)}>
      <rect
        x={x} y={num <= 16 ? 30 : 80}
        width={20} height={32} rx={6}
        fill={toothFill(num)}
        fillOpacity={selectedTeeth.includes(num) ? 0.7 : 0.4}
        stroke={selectedTeeth.includes(num) ? severityColors[severity] : "#94a3b8"}
        strokeWidth={selectedTeeth.includes(num) ? 2 : 0.8}
      />
      <text x={x + 10} y={num <= 16 ? 24 : 128} textAnchor="middle" fontSize="8" fill="#64748b">{num}</text>
    </g>
  );

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Smile className="w-4 h-4 text-cyan-600" /> Interactive Tooth Map
          </h3>
          <p className="text-xs text-muted-foreground">Click teeth to mark pain · Click gum areas for gum pain</p>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowHistory(!showHistory)}>
          <Calendar className="w-3.5 h-3.5 mr-1" /> History
        </Button>
      </div>

      {showHistory ? (
        <div>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-cyan-600" /></div>
          ) : history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No pain logs yet. Click teeth above to start.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {history.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                  <div className="p-2.5 bg-muted/50 rounded-lg flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: severityColors[h.severity] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {h.pain_teeth?.length > 0 && (
                          <span className="text-xs font-medium">Teeth: {h.pain_teeth.join(", ")}</span>
                        )}
                        {h.gum_pain_areas?.length > 0 && (
                          <span className="text-xs font-medium">Gums: {h.gum_pain_areas.map((g) => gumAreaLabels[g]).join(", ")}</span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: severityColors[h.severity] + "33", color: severityColors[h.severity] }}>
                          {h.severity}
                        </span>
                      </div>
                      {h.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{h.notes}</p>}
                      <span className="text-[9px] text-muted-foreground">{format(new Date(h.logged_at), "MMM d, h:mm a")}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 shrink-0" onClick={() => handleDelete(h.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex justify-center">
            <svg viewBox="0 0 360 140" className="w-full max-w-md">
              {/* Gum areas - upper */}
              {["upper_left", "upper_front", "upper_right"].map((area, i) => (
                <rect key={area} x={4 + i * 118} y={4} width={114} height={18} rx={4}
                  fill={gumAreas.includes(area) ? "#fb7185" : "#fce7f3"}
                  fillOpacity={gumAreas.includes(area) ? 0.6 : 0.3}
                  stroke={gumAreas.includes(area) ? "#e11d48" : "#f9a8d4"}
                  strokeWidth={gumAreas.includes(area) ? 1.5 : 0.5}
                  className="cursor-pointer transition-all"
                  onClick={() => toggleGum(area)} />
              ))}
              <text x={61} y={16} textAnchor="middle" fontSize="7" fill="#9f1239">UL Gums</text>
              <text x={179} y={16} textAnchor="middle" fontSize="7" fill="#9f1239">UF Gums</text>
              <text x={297} y={16} textAnchor="middle" fontSize="7" fill="#9f1239">UR Gums</text>

              {/* Upper teeth */}
              {upperTeeth.map((num, i) => renderTooth(num, 4 + i * 22))}
              {/* Lower teeth */}
              {lowerTeeth.map((num, i) => renderTooth(num, 4 + i * 22))}

              {/* Gum areas - lower */}
              {["lower_left", "lower_front", "lower_right"].map((area, i) => (
                <rect key={area} x={4 + i * 118} y={118} width={114} height={18} rx={4}
                  fill={gumAreas.includes(area) ? "#fb7185" : "#fce7f3"}
                  fillOpacity={gumAreas.includes(area) ? 0.6 : 0.3}
                  stroke={gumAreas.includes(area) ? "#e11d48" : "#f9a8d4"}
                  strokeWidth={gumAreas.includes(area) ? 1.5 : 0.5}
                  className="cursor-pointer transition-all"
                  onClick={() => toggleGum(area)} />
              ))}
              <text x={61} y={131} textAnchor="middle" fontSize="7" fill="#9f1239">LL Gums</text>
              <text x={179} y={131} textAnchor="middle" fontSize="7" fill="#9f1239">LF Gums</text>
              <text x={297} y={131} textAnchor="middle" fontSize="7" fill="#9f1239">LR Gums</text>
            </svg>
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              {Object.entries(severityColors).map(([key, color]) => (
                <button key={key} onClick={() => setSeverity(key)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition ${severity === key ? "border-current font-semibold" : "border-border"}`}
                  style={severity === key ? { color } : {}}>
                  <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                  <span className="capitalize">{key}</span>
                </button>
              ))}
            </div>

            <div>
              <Label className="text-xs">Pain Type</Label>
              <Select value={painType} onValueChange={setPainType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["aching", "sharp", "throbbing", "sensitivity", "burning", "other"].map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Duration</Label>
                <Input placeholder="e.g., 3 days" value={duration} onChange={(e) => setDuration(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Selected Teeth</Label>
                <p className="text-xs font-medium h-9 flex items-center">
                  {selectedTeeth.length > 0 ? selectedTeeth.sort((a, b) => a - b).join(", ") : "None"}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Additional details..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="resize-none" />
            </div>

            <Button onClick={handleSave} disabled={(selectedTeeth.length === 0 && gumAreas.length === 0) || saving} className="w-full bg-cyan-600 hover:bg-cyan-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
              Save Pain Log
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}