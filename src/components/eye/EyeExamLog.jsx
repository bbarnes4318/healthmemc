import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, Loader2, Trash2, Calendar, Eye, Glasses, Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const earLabels = { left: "Left Eye", right: "Right Eye", both: "Both Eyes" };

// Convert acuity ratio to a numeric score for charting (20/20 = 100, 20/40 = 50, etc.)
const acuityToScore = (num, den) => {
  if (!num || !den) return null;
  return Math.round((den / num) * 100);
};

export default function EyeExamLog() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    exam_date: format(new Date(), "yyyy-MM-dd"),
    eye: "both",
    acuity_numerator: 20,
    acuity_denominator: 20,
    prescription_sphere: "",
    prescription_cylinder: "",
    prescription_axis: "",
    color_vision_tested: false,
    color_vision_normal: true,
    pressure_left: "",
    pressure_right: "",
    provider: "",
    notes: "",
  });

  const load = async () => {
    try {
      const data = await base44.entities.EyeExamLog.list("-exam_date", 200);
      const filtered = currentMemberId ? data.filter((l) => l.family_member_id === currentMemberId) : data;
      setLogs(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.EyeExamLog.create({
        ...form,
        prescription_sphere: form.prescription_sphere !== "" ? parseFloat(form.prescription_sphere) : undefined,
        prescription_cylinder: form.prescription_cylinder !== "" ? parseFloat(form.prescription_cylinder) : undefined,
        prescription_axis: form.prescription_axis !== "" ? parseFloat(form.prescription_axis) : undefined,
        pressure_left: form.pressure_left !== "" ? parseFloat(form.pressure_left) : undefined,
        pressure_right: form.pressure_right !== "" ? parseFloat(form.pressure_right) : undefined,
        family_member_id: currentMemberId || undefined,
      });
      setForm({
        exam_date: format(new Date(), "yyyy-MM-dd"),
        eye: "both",
        acuity_numerator: 20,
        acuity_denominator: 20,
        prescription_sphere: "",
        prescription_cylinder: "",
        prescription_axis: "",
        color_vision_tested: false,
        color_vision_normal: true,
        pressure_left: "",
        pressure_right: "",
        provider: "",
        notes: "",
      });
      setDialogOpen(false);
      load();
      toast({ title: "Eye exam logged" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.EyeExamLog.delete(id); load(); } catch (e) { console.error(e); }
  };

  // Chart data: acuity score over time
  const chartData = logs
    .filter((l) => l.exam_date && l.acuity_numerator && l.acuity_denominator)
    .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))
    .map((l) => ({
      date: format(new Date(l.exam_date), "MMM d, yy"),
      score: acuityToScore(l.acuity_numerator, l.acuity_denominator),
      acuity: `${l.acuity_numerator}/${l.acuity_denominator}`,
      eye: earLabels[l.eye] || l.eye,
    }));

  // Separate by eye for chart lines
  const leftEyeData = chartData.filter((d) => d.eye === "Left Eye" || d.eye === "Both Eyes");
  const rightEyeData = chartData.filter((d) => d.eye === "Right Eye" || d.eye === "Both Eyes");

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Eye className="w-4 h-4 text-indigo-600" /><span className="text-xs text-muted-foreground">Total Exams</span></div>
          <p className="text-2xl font-bold">{logs.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-indigo-600" /><span className="text-xs text-muted-foreground">Last Exam</span></div>
          <p className="text-sm font-semibold mt-1">{logs[0] ? format(new Date(logs[0].exam_date), "MMM d, yyyy") : "N/A"}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Glasses className="w-4 h-4 text-indigo-600" /><span className="text-xs text-muted-foreground">Latest Acuity</span></div>
          <p className="text-sm font-semibold mt-1">{logs[0] ? `${logs[0].acuity_numerator}/${logs[0].acuity_denominator}` : "N/A"}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Activity className="w-4 h-4 text-indigo-600" /><span className="text-xs text-muted-foreground">Tracking For</span></div>
          <p className="text-sm font-semibold mt-1">{currentMemberName}</p>
        </Card>
      </div>

      {/* Vision change chart */}
      {chartData.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-1">Vision Changes Over Time</h3>
          <p className="text-xs text-muted-foreground mb-4">Higher score = better acuity (20/20 = 100)</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 120]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [`${value} (${chartData.find((d) => d.score === value)?.acuity || ""})`, name]}
              />
              <Legend />
              <Line type="monotone" dataKey="score" name="Acuity Score" stroke="#4f46e5" strokeWidth={2} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Add button */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Exam History</h3>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Log Exam
        </Button>
      </div>

      {/* Log entries */}
      {logs.length === 0 ? (
        <Card className="p-12 text-center">
          <Eye className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No eye exams logged yet</p>
          <p className="text-xs text-muted-foreground mt-1">Log your vision test results, prescription updates, and optometrist notes to track changes over time.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{earLabels[log.eye] || log.eye}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(log.exam_date), "MMM d, yyyy")}</span>
                      {log.acuity_numerator && log.acuity_denominator && (
                        <Badge className="bg-indigo-100 text-indigo-700 border-0">Acuity: {log.acuity_numerator}/{log.acuity_denominator}</Badge>
                      )}
                    </div>

                    {(log.prescription_sphere !== undefined && log.prescription_sphere !== null) && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">SPH: {log.prescription_sphere}</span>
                        {log.prescription_cylinder !== undefined && log.prescription_cylinder !== null && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">CYL: {log.prescription_cylinder}</span>
                        )}
                        {log.prescription_axis !== undefined && log.prescription_axis !== null && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">AXIS: {log.prescription_axis}°</span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {log.pressure_left != null && <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">IOP L: {log.pressure_left} mmHg</span>}
                      {log.pressure_right != null && <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">IOP R: {log.pressure_right} mmHg</span>}
                      {log.color_vision_tested && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${log.color_vision_normal ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          Color Vision: {log.color_vision_normal ? "Normal" : "Abnormal"}
                        </span>
                      )}
                    </div>

                    {log.provider && <p className="text-xs text-muted-foreground mt-1.5"><strong>Provider:</strong> {log.provider}</p>}
                    {log.notes && <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 shrink-0" onClick={() => handleDelete(log.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Exam Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Eye Exam</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Exam Date *</Label>
                <Input type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Eye *</Label>
                <Select value={form.eye} onValueChange={(v) => setForm({ ...form, eye: v })}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both Eyes</SelectItem>
                    <SelectItem value="left">Left Eye</SelectItem>
                    <SelectItem value="right">Right Eye</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Visual Acuity (Snellen)</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">20 /</span>
                <Input type="number" value={form.acuity_denominator} onChange={(e) => setForm({ ...form, acuity_denominator: parseInt(e.target.value) || 20 })} className="h-9 w-20" />
                <span className="text-xs text-muted-foreground ml-2">e.g., 20/20, 20/40, 20/200</span>
              </div>
            </div>

            <div>
              <Label className="text-xs">Prescription (Optional)</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div>
                  <span className="text-[10px] text-muted-foreground">Sphere (SPH)</span>
                  <Input type="number" step="0.25" placeholder="-2.50" value={form.prescription_sphere} onChange={(e) => setForm({ ...form, prescription_sphere: e.target.value })} className="h-9" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Cylinder (CYL)</span>
                  <Input type="number" step="0.25" placeholder="-1.00" value={form.prescription_cylinder} onChange={(e) => setForm({ ...form, prescription_cylinder: e.target.value })} className="h-9" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Axis (°)</span>
                  <Input type="number" placeholder="180" value={form.prescription_axis} onChange={(e) => setForm({ ...form, prescription_axis: e.target.value })} className="h-9" />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Eye Pressure / IOP (mmHg)</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <span className="text-[10px] text-muted-foreground">Left</span>
                  <Input type="number" placeholder="14" value={form.pressure_left} onChange={(e) => setForm({ ...form, pressure_left: e.target.value })} className="h-9" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Right</span>
                  <Input type="number" placeholder="15" value={form.pressure_right} onChange={(e) => setForm({ ...form, pressure_right: e.target.value })} className="h-9" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={form.color_vision_tested} onChange={(e) => setForm({ ...form, color_vision_tested: e.target.checked })} className="w-4 h-4" />
                Color vision tested
              </label>
              {form.color_vision_tested && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={form.color_vision_normal} onChange={(e) => setForm({ ...form, color_vision_normal: e.target.checked })} className="w-4 h-4" />
                  Normal color vision
                </label>
              )}
            </div>

            <div>
              <Label className="text-xs">Provider / Optometrist</Label>
              <Input placeholder="Dr. Smith, Vision Clinic" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Optometrist recommendations, next checkup, etc." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}