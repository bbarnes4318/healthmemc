import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Loader2, Clock, Sparkles, CheckCircle2, Play, Calendar, Wand2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const emptyForm = {
  schedule_name: "",
  schedule_date: format(new Date(), "yyyy-MM-dd"),
  start_time: "09:00",
  activities: [],
  notes: "",
};

const statusConfig = {
  planned: { label: "Planned", color: "bg-purple-100 text-purple-700 border-purple-200" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default function SpaScheduleBuilder() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [actInput, setActInput] = useState({ time: "", activity: "", duration: "30" });
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await base44.entities.SpaSchedule.list("-schedule_date", 50);
      setSchedules(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addActivity = () => {
    if (!actInput.activity.trim()) return;
    setForm({ ...form, activities: [...form.activities, { time: actInput.time || form.start_time, activity: actInput.activity, duration: parseInt(actInput.duration) || 30 }] });
    setActInput({ time: "", activity: "", duration: "30" });
  };

  const removeActivity = (idx) => {
    setForm({ ...form, activities: form.activities.filter((_, i) => i !== idx) });
  };

  const handleSave = async () => {
    if (!form.schedule_name.trim() || !form.schedule_date) return;
    setSaving(true);
    try {
      const totalDuration = form.activities.reduce((sum, a) => sum + (a.duration || 0), 0);
      await base44.entities.SpaSchedule.create({
        schedule_name: form.schedule_name,
        schedule_date: form.schedule_date,
        start_time: form.start_time,
        total_duration_minutes: totalDuration,
        activities_json: JSON.stringify(form.activities),
        status: "planned",
        notes: form.notes,
      });
      setForm(emptyForm); setDialogOpen(false); load();
      toast({ title: "Schedule created", description: "Your relaxation schedule has been saved." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleAiGenerate = async () => {
    setAiGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: "Create a custom relaxation schedule for a wellness spa day. Include a creative name and 4-6 activities with times (HH:MM format) and durations in minutes. Activities can include meditation, massage, aromatherapy, hydrotherapy, skincare, breathing exercises, tea time, journaling, sound healing, etc. Make it feel luxurious and restorative.",
        response_json_schema: {
          type: "object",
          properties: {
            schedule_name: { type: "string" },
            activities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  activity: { type: "string" },
                  duration: { type: "number" },
                },
              },
            },
          },
        },
      });
      setForm({
        ...emptyForm,
        schedule_name: response.schedule_name,
        activities: response.activities || [],
        start_time: response.activities?.[0]?.time || "09:00",
      });
      toast({ title: "AI schedule generated", description: "Review and save your custom relaxation schedule." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate", variant: "destructive" });
    }
    setAiGenerating(false);
  };

  const updateStatus = async (id, status) => {
    try { await base44.entities.SpaSchedule.update(id, { status }); load(); } catch (e) { console.error(e); }
  };

  const parseActivities = (json) => {
    try { return JSON.parse(json); } catch { return []; }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" /> Relaxation Schedule Builder
            </h3>
            <p className="text-xs text-muted-foreground">Design custom spa day schedules or let AI create one for you</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAiGenerate} disabled={aiGenerating}>
              {aiGenerating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
              AI Generate
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700"><Plus className="w-3.5 h-3.5 mr-1" />New Schedule</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Build Relaxation Schedule</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Schedule Name *</Label>
                      <Input placeholder="Sunday Self-Care Day" value={form.schedule_name} onChange={(e) => setForm({ ...form, schedule_name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Date *</Label>
                      <Input type="date" value={form.schedule_date} onChange={(e) => setForm({ ...form, schedule_date: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Start Time</Label>
                    <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Add Activity</Label>
                    <div className="flex gap-1.5">
                      <Input type="time" value={actInput.time} onChange={(e) => setActInput({ ...actInput, time: e.target.value })} className="h-8 w-28" />
                      <Input placeholder="Activity name" value={actInput.activity} onChange={(e) => setActInput({ ...actInput, activity: e.target.value })} className="h-8 flex-1" />
                      <Input type="number" placeholder="min" value={actInput.duration} onChange={(e) => setActInput({ ...actInput, duration: e.target.value })} className="h-8 w-16" />
                      <Button variant="outline" size="sm" className="h-8" onClick={addActivity}><Plus className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  {form.activities.length > 0 && (
                    <div className="space-y-1.5">
                      {form.activities.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                          <Clock className="w-3 h-3 text-purple-500 shrink-0" />
                          <span className="text-xs font-medium w-16">{a.time}</span>
                          <span className="text-xs flex-1">{a.activity}</span>
                          <span className="text-[10px] text-muted-foreground">{a.duration}m</span>
                          <button onClick={() => removeActivity(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea placeholder="Goals, intentions, or special instructions..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
                  </div>
                  <Button onClick={handleSave} disabled={!form.schedule_name.trim() || !form.schedule_date || saving} className="w-full bg-purple-600 hover:bg-purple-700">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Save Schedule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No schedules yet</p>
            <p className="text-xs text-muted-foreground mt-1">Build a custom relaxation schedule or generate one with AI.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((sched, i) => {
              const activities = parseActivities(sched.activities_json);
              const sc = statusConfig[sched.status] || statusConfig.planned;
              return (
                <motion.div key={sched.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-sm font-semibold">{sched.schedule_name}</h4>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />{format(new Date(sched.schedule_date), "MMM d, yyyy")}
                          {sched.start_time && <><Clock className="w-2.5 h-2.5 ml-1" />{sched.start_time}</>}
                          {sched.total_duration_minutes > 0 && <span className="ml-1">• {sched.total_duration_minutes}m total</span>}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-[9px] ${sc.color}`}>{sc.label}</Badge>
                    </div>
                    {activities.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {activities.map((a, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs p-1.5 bg-purple-50/50 rounded">
                            <span className="font-medium text-purple-600 w-14">{a.time}</span>
                            <span className="flex-1">{a.activity}</span>
                            <span className="text-[10px] text-muted-foreground">{a.duration}m</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {sched.notes && <p className="text-[10px] text-muted-foreground italic">{sched.notes}</p>}
                    <div className="flex gap-1.5 mt-2">
                      {sched.status === "planned" && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(sched.id, "in_progress")}>
                          <Play className="w-2.5 h-2.5 mr-1" />Start
                        </Button>
                      )}
                      {(sched.status === "planned" || sched.status === "in_progress") && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px] text-emerald-600" onClick={() => updateStatus(sched.id, "completed")}>
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" />Complete
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}