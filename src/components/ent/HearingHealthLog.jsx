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
  Plus, Loader2, Trash2, Calendar, Ear, Activity, Share2, TrendingDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const testFrequencies = [250, 500, 1000, 2000, 4000, 8000];

const resultConfig = {
  normal: { label: "Normal", bg: "bg-green-100", text: "text-green-700" },
  mild_loss: { label: "Mild Loss", bg: "bg-amber-100", text: "text-amber-700" },
  moderate_loss: { label: "Moderate Loss", bg: "bg-orange-100", text: "text-orange-700" },
  severe_loss: { label: "Severe Loss", bg: "bg-red-100", text: "text-red-700" },
};

const earLabels = { left: "Left Ear", right: "Right Ear", both: "Both Ears" };

export default function HearingHealthLog() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    test_date: format(new Date(), "yyyy-MM-dd"),
    ear: "both",
    test_type: "self_screening",
    overall_result: "normal",
    symptoms: "",
    treatment: "",
    provider: "",
    notes: "",
  });
  const [heardFreqs, setHeardFreqs] = useState([]);

  const load = async () => {
    try {
      const data = await base44.entities.HearingTestLog.list("-test_date", 200);
      const filtered = currentMemberId ? data.filter((l) => l.family_member_id === currentMemberId) : data;
      setLogs(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.HearingTestLog.create({
        ...form,
        frequencies_heard: heardFreqs,
        frequencies_missed: testFrequencies.filter((f) => !heardFreqs.includes(f)),
        family_member_id: currentMemberId || undefined,
      });
      setForm({
        test_date: format(new Date(), "yyyy-MM-dd"),
        ear: "both",
        test_type: "self_screening",
        overall_result: "normal",
        symptoms: "",
        treatment: "",
        provider: "",
        notes: "",
      });
      setHeardFreqs([]);
      setDialogOpen(false);
      load();
      toast({ title: "Hearing test logged" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.HearingTestLog.delete(id); load(); } catch (e) { console.error(e); }
  };

  const toggleFreq = (freq) => {
    setHeardFreqs((prev) => prev.includes(freq) ? prev.filter((f) => f !== freq) : [...prev, freq]);
  };

  // Chart data: hearing score (freqs heard / total) over time
  const chartData = logs
    .filter((l) => l.test_date)
    .sort((a, b) => new Date(a.test_date) - new Date(b.test_date))
    .map((l) => {
      const heard = l.frequencies_heard?.length || 0;
      const total = (l.frequencies_heard?.length || 0) + (l.frequencies_missed?.length || 0) || testFrequencies.length;
      return {
        date: format(new Date(l.test_date), "MMM d, yy"),
        score: Math.round((heard / total) * 100),
        ear: earLabels[l.ear] || l.ear,
      };
    });

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Ear className="w-4 h-4 text-purple-600" /><span className="text-xs text-muted-foreground">Total Tests</span></div>
          <p className="text-2xl font-bold">{logs.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-purple-600" /><span className="text-xs text-muted-foreground">Last Test</span></div>
          <p className="text-sm font-semibold mt-1">{logs[0] ? format(new Date(logs[0].test_date), "MMM d, yyyy") : "N/A"}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-purple-600" /><span className="text-xs text-muted-foreground">Latest Result</span></div>
          <p className="text-sm font-semibold mt-1">{logs[0] ? resultConfig[logs[0].overall_result]?.label : "N/A"}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Activity className="w-4 h-4 text-purple-600" /><span className="text-xs text-muted-foreground">Tracking For</span></div>
          <p className="text-sm font-semibold mt-1">{currentMemberName}</p>
        </Card>
      </div>

      {/* Hearing score chart */}
      {chartData.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Hearing Score Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" name="% Frequencies Heard" stroke="#9333ea" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Add button */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Test History & Symptoms</h3>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Log Test
        </Button>
      </div>

      {/* Log entries */}
      {logs.length === 0 ? (
        <Card className="p-12 text-center">
          <Ear className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No hearing tests logged yet</p>
          <p className="text-xs text-muted-foreground mt-1">Log your hearing screening results and ear symptoms to track changes over time.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <Ear className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{earLabels[log.ear] || log.ear}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(log.test_date), "MMM d, yyyy")}</span>
                      <Badge className={`${resultConfig[log.overall_result]?.bg} ${resultConfig[log.overall_result]?.text} border-0`}>
                        {resultConfig[log.overall_result]?.label}
                      </Badge>
                      {log.test_type && (
                        <span className="text-[10px] text-muted-foreground capitalize">{log.test_type.replace(/_/g, " ")}</span>
                      )}
                    </div>
                    {log.frequencies_heard && log.frequencies_heard.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {testFrequencies.map((freq) => {
                          const heard = log.frequencies_heard?.includes(freq);
                          return (
                            <span key={freq} className={`text-[10px] px-1.5 py-0.5 rounded-full ${heard ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`} {heard ? "✓" : "✗"}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {log.symptoms && <p className="text-xs text-muted-foreground mt-1.5"><strong>Symptoms:</strong> {log.symptoms}</p>}
                    {log.treatment && <p className="text-xs text-muted-foreground mt-0.5"><strong>Treatment:</strong> {log.treatment}</p>}
                    {log.provider && <p className="text-xs text-muted-foreground mt-0.5"><strong>Provider:</strong> {log.provider}</p>}
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

      {/* Add Test Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Hearing Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Test Date *</Label>
                <Input type="date" value={form.test_date} onChange={(e) => setForm({ ...form, test_date: e.target.value })} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Ear *</Label>
                <Select value={form.ear} onValueChange={(v) => setForm({ ...form, ear: v })}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both Ears</SelectItem>
                    <SelectItem value="left">Left Ear</SelectItem>
                    <SelectItem value="right">Right Ear</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Test Type</Label>
              <Select value={form.test_type} onValueChange={(v) => setForm({ ...form, test_type: v })}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="self_screening">Self Screening</SelectItem>
                  <SelectItem value="audiologist_exam">Audiologist Exam</SelectItem>
                  <SelectItem value="phone_app_test">Phone App Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Overall Result</Label>
              <Select value={form.overall_result} onValueChange={(v) => setForm({ ...form, overall_result: v })}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="mild_loss">Mild Loss</SelectItem>
                  <SelectItem value="moderate_loss">Moderate Loss</SelectItem>
                  <SelectItem value="severe_loss">Severe Loss</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Frequencies Heard</Label>
              <p className="text-[10px] text-muted-foreground mb-1.5">Select the frequencies you could hear during the test</p>
              <div className="flex flex-wrap gap-1.5">
                {testFrequencies.map((freq) => (
                  <button
                    key={freq}
                    onClick={() => toggleFreq(freq)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${heardFreqs.includes(freq) ? "bg-green-100 text-green-700 border border-green-300" : "bg-muted text-muted-foreground border border-border"}`}
                  >
                    {freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Symptoms</Label>
              <Input placeholder="e.g., Ringing, pressure, muffled hearing" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Treatment</Label>
              <Input placeholder="e.g., Ear drops, cleaning, hearing aid" value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Provider</Label>
              <Input placeholder="Audiologist or clinic name" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}