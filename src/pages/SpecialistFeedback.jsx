import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Star, Plus, Loader2, Trash2, MessageSquare, ThumbsUp, Tag,
  Calendar, Stethoscope, Search, X, Quote, GitCompare, DollarSign, ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpecialistComparison from "@/components/specialists/SpecialistComparison";

const specialties = [
  "Cardiology", "Dermatology", "Neurology", "Orthopedics", "Pediatrics",
  "Women's Health", "Men's Health", "Mental Health", "Nutrition",
  "Gastroenterology", "Endocrinology", "Oncology", "Ophthalmology",
  "ENT", "Urology", "Dentistry", "Physical Therapy", "Other"
];

const quickTags = [
  "Thorough", "Good listener", "Clear explanations", "On time",
  "Compassionate", "Knowledgeable", "Rushed", "Hard to schedule",
  "Great staff", "Good follow-up"
];

const emptyForm = {
  specialist_name: "",
  specialty: "",
  visit_date: format(new Date(), "yyyy-MM-dd"),
  rating: 5,
  overall_comments: "",
  visit_reason: "",
  would_recommend: true,
  helpful_notes: [],
  tags: [],
  visit_cost: "",
  wait_time_days: "",
};

export default function SpecialistFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterSpec, setFilterSpec] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [newNote, setNewNote] = useState("");
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState("reviews");
  const { toast } = useToast();

  const loadFeedback = async () => {
    try {
      const data = await base44.entities.SpecialistFeedback.list("-visit_date", 100);
      setFeedback(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadFeedback(); }, []);

  const handleSave = async () => {
    if (!form.specialist_name.trim() || !form.specialty || !form.visit_date) return;
    setSaving(true);
    try {
      await base44.entities.SpecialistFeedback.create({
        ...form,
        visit_cost: form.visit_cost ? parseFloat(form.visit_cost) : undefined,
        wait_time_days: form.wait_time_days ? parseFloat(form.wait_time_days) : undefined,
      });
      setForm(emptyForm);
      setDialogOpen(false);
      loadFeedback();
      toast({ title: "Feedback saved", description: "Your specialist review has been recorded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save feedback", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.SpecialistFeedback.delete(id);
      setFeedback(feedback.filter((f) => f.id !== id));
      toast({ title: "Feedback deleted" });
    } catch (e) { console.error(e); }
  };

  const addHelpfulNote = () => {
    if (!newNote.trim()) return;
    setForm({ ...form, helpful_notes: [...form.helpful_notes, newNote.trim()] });
    setNewNote("");
  };

  const removeNote = (idx) => {
    setForm({ ...form, helpful_notes: form.helpful_notes.filter((_, i) => i !== idx) });
  };

  const toggleTag = (tag) => {
    if (form.tags.includes(tag)) {
      setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
    } else {
      setForm({ ...form, tags: [...form.tags, tag] });
    }
  };

  const addCustomTag = () => {
    if (!newTag.trim()) return;
    if (!form.tags.includes(newTag.trim())) {
      setForm({ ...form, tags: [...form.tags, newTag.trim()] });
    }
    setNewTag("");
  };

  const filtered = feedback.filter((f) => {
    if (filterSpec !== "all" && f.specialty !== filterSpec) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return f.specialist_name?.toLowerCase().includes(q) ||
      f.overall_comments?.toLowerCase().includes(q) ||
      f.helpful_notes?.some((n) => n.toLowerCase().includes(q)) ||
      f.tags?.some((t) => t.toLowerCase().includes(q));
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "recent") return new Date(b.visit_date || b.created_date) - new Date(a.visit_date || a.created_date);
    if (sortBy === "rating_high") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "rating_low") return (a.rating || 0) - (b.rating || 0);
    if (sortBy === "specialty") return (a.specialty || "").localeCompare(b.specialty || "");
    if (sortBy === "name") return (a.specialist_name || "").localeCompare(b.specialist_name || "");
    return 0;
  });

  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.length).toFixed(1)
    : "—";

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Star className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Specialist Feedback</h1>
          <p className="text-sm text-muted-foreground">Rate your visits and tag helpful notes for future reference</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-5">
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="reviews"><Star className="w-3.5 h-3.5 mr-1.5" />Reviews</TabsTrigger>
          <TabsTrigger value="compare"><GitCompare className="w-3.5 h-3.5 mr-1.5" />Compare</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "compare" && <SpecialistComparison />}

      {activeTab === "reviews" && (
      <>
      {/* Stats */}
      {feedback.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{feedback.length}</p>
            <p className="text-[10px] text-muted-foreground">Reviews</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{avgRating}</p>
            <p className="text-[10px] text-muted-foreground">Avg Rating</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {feedback.filter((f) => f.would_recommend).length}
            </p>
            <p className="text-[10px] text-muted-foreground">Recommended</p>
          </Card>
        </div>
      )}

      {/* Search + Add */}
      <div className="flex items-center gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by name, comments, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterSpec} onValueChange={setFilterSpec}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]"><ArrowUpDown className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="rating_high">Highest Rating</SelectItem>
            <SelectItem value="rating_low">Lowest Rating</SelectItem>
            <SelectItem value="specialty">Specialty A-Z</SelectItem>
            <SelectItem value="name">Doctor Name A-Z</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-1.5" /> Add Review
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rate Specialist Visit</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Specialist Name *</Label>
                  <Input placeholder="Dr. Jane Smith" value={form.specialist_name} onChange={(e) => setForm({ ...form, specialist_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Specialty *</Label>
                  <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Visit Date *</Label>
                  <Input type="date" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Reason for Visit</Label>
                  <Input placeholder="Annual checkup" value={form.visit_reason} onChange={(e) => setForm({ ...form, visit_reason: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Visit Cost ($)</Label>
                  <Input type="number" placeholder="e.g., 150" value={form.visit_cost} onChange={(e) => setForm({ ...form, visit_cost: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Wait Time (days)</Label>
                  <Input type="number" placeholder="e.g., 7" value={form.wait_time_days} onChange={(e) => setForm({ ...form, wait_time_days: e.target.value })} />
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <Label className="text-xs">Rating *</Label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setForm({ ...form, rating: n })}>
                      <Star
                        className={`w-7 h-7 transition ${n <= form.rating ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-200"}`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">{form.rating}/5</span>
                </div>
              </div>

              {/* Would Recommend */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium">Would recommend to others</span>
                </div>
                <button
                  onClick={() => setForm({ ...form, would_recommend: !form.would_recommend })}
                  className={`w-10 h-5 rounded-full transition relative ${form.would_recommend ? "bg-emerald-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${form.would_recommend ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              {/* Quick Tags */}
              <div>
                <Label className="text-xs">Quick Tags</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {quickTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleTag(t)}
                      className={`text-xs px-2 py-1 rounded-full border transition ${form.tags.includes(t) ? "bg-amber-100 border-amber-300 text-amber-800" : "border-border hover:bg-muted"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <Input
                    placeholder="Add custom tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
                    className="h-8 text-xs"
                  />
                  <Button variant="outline" size="sm" className="h-8" onClick={addCustomTag}><Plus className="w-3 h-3" /></Button>
                </div>
              </div>

              {/* Helpful Notes */}
              <div>
                <Label className="text-xs">Helpful Notes & Recommendations</Label>
                <p className="text-[10px] text-muted-foreground mb-1.5">Tag specific advice or recommendations worth referencing later</p>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="e.g., Take medication with food for better absorption"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHelpfulNote(); } }}
                    className="h-8 text-xs"
                  />
                  <Button variant="outline" size="sm" className="h-8" onClick={addHelpfulNote}><Plus className="w-3 h-3" /></Button>
                </div>
                {form.helpful_notes.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {form.helpful_notes.map((note, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <Quote className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                        <span className="text-xs text-emerald-900 flex-1">{note}</span>
                        <button onClick={() => removeNote(i)} className="text-red-400 hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Overall Comments */}
              <div>
                <Label className="text-xs">Overall Comments</Label>
                <Textarea placeholder="Share your experience..." value={form.overall_comments} onChange={(e) => setForm({ ...form, overall_comments: e.target.value })} rows={3} className="resize-none" />
              </div>

              <Button onClick={handleSave} disabled={!form.specialist_name.trim() || !form.specialty || !form.visit_date || saving} className="w-full bg-amber-600 hover:bg-amber-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Star className="w-4 h-4 mr-2" />}
                Save Review
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feedback Cards */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>
      ) : sorted.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{search || filterSpec !== "all" ? "No reviews found" : "No specialist reviews yet"}</p>
          <p className="text-xs text-muted-foreground mt-1">Rate your specialists after visits and tag helpful notes for easy reference.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{f.specialist_name}</p>
                      <Badge variant="outline" className="text-[10px]">{f.specialty}</Badge>
                      {f.would_recommend && (
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          <ThumbsUp className="w-2.5 h-2.5 mr-0.5" /> Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= f.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />{format(new Date(f.visit_date), "MMM d, yyyy")}
                      </span>
                      {f.visit_reason && <span className="text-xs text-muted-foreground">• {f.visit_reason}</span>}
                    </div>

                    {f.overall_comments && (
                      <p className="text-xs text-muted-foreground mt-2">{f.overall_comments}</p>
                    )}

                    {/* Tags */}
                    {f.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {f.tags.map((t, idx) => (
                          <span key={idx} className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Tag className="w-2.5 h-2.5" />{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Helpful Notes */}
                    {f.helpful_notes?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {f.helpful_notes.map((note, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                            <Quote className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                            <span className="text-xs text-emerald-900">{note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 shrink-0" onClick={() => handleDelete(f.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}