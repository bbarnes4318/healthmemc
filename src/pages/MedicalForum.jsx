import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Loader2, Pin, Eye, ArrowLeft, MessageSquare, ShieldCheck, Stethoscope, HeartPulse, UserCircle, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

const categories = [
  { value: "surgery_options", label: "Surgery Options", icon: Stethoscope, color: "bg-sky-100 text-sky-700" },
  { value: "treatment_methods", label: "Treatment Methods", icon: HeartPulse, color: "bg-emerald-100 text-emerald-700" },
  { value: "care_plans", label: "Care Plans", icon: ShieldCheck, color: "bg-violet-100 text-violet-700" },
  { value: "medication_review", label: "Medication Review", icon: Tag, color: "bg-amber-100 text-amber-700" },
  { value: "diagnostic_approaches", label: "Diagnostic Approaches", icon: Stethoscope, color: "bg-rose-100 text-rose-700" },
  { value: "case_discussion", label: "Case Discussion", icon: MessageSquare, color: "bg-indigo-100 text-indigo-700" },
  { value: "general", label: "General", icon: MessageSquare, color: "bg-muted text-muted-foreground" },
];

const roleConfig = {
  doctor: { label: "Doctor", color: "bg-sky-100 text-sky-700", icon: Stethoscope },
  specialist: { label: "Specialist", color: "bg-violet-100 text-violet-700", icon: HeartPulse },
  nurse: { label: "Nurse", color: "bg-emerald-100 text-emerald-700", icon: HeartPulse },
};

const getCategory = (v) => categories.find((c) => c.value === v) || categories[6];
const getRole = (v) => roleConfig[v] || roleConfig.doctor;

export default function MedicalForum() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("doctor");
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "general", tags: "" });
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const data = await base44.entities.ForumTopic.list("-created_date", 100);
      setTopics(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadReplies = async (topicId) => {
    setLoadingReplies(true);
    try {
      const data = await base44.entities.ForumReply.filter({ topic_id: topicId });
      setReplies(data.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    } catch (e) { console.error(e); }
    setLoadingReplies(false);
  };

  const openTopic = async (topic) => {
    setSelectedTopic(topic);
    setReplies([]);
    loadReplies(topic.id);
    base44.entities.ForumTopic.update(topic.id, { views: (topic.views || 0) + 1 }).catch(() => {});
  };

  const handleCreateTopic = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      await base44.entities.ForumTopic.create({
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        author_name: user?.full_name || "Anonymous",
        author_role: userRole,
      });
      setForm({ title: "", content: "", category: "general", tags: "" });
      setDialogOpen(false);
      loadTopics();
      toast({ title: "Topic posted", description: "Your discussion topic has been published." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to post topic", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTopic) return;
    setPostingReply(true);
    try {
      await base44.entities.ForumReply.create({
        topic_id: selectedTopic.id,
        content: replyText,
        author_name: user?.full_name || "Anonymous",
        author_role: userRole,
      });
      setReplyText("");
      loadReplies(selectedTopic.id);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to post reply", variant: "destructive" });
    }
    setPostingReply(false);
  };

  const filteredTopics = filterCategory === "all" ? topics : topics.filter((t) => t.category === filterCategory);
  const pinnedTopics = filteredTopics.filter((t) => t.pinned);
  const regularTopics = filteredTopics.filter((t) => !t.pinned);

  if (selectedTopic) {
    const cat = getCategory(selectedTopic.category);
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => setSelectedTopic(null)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Forum
        </Button>

        <Card className="p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span>
            {selectedTopic.pinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
          </div>
          <h1 className="text-xl font-display font-bold mb-2">{selectedTopic.title}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            {(() => { const r = getRole(selectedTopic.author_role); return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.color}`}>{r.label}</span>; })()}
            <span>{selectedTopic.author_name}</span>
            {selectedTopic.author_specialty && <span>· {selectedTopic.author_specialty}</span>}
            <span>· {format(new Date(selectedTopic.created_date), "MMM d, yyyy 'at' h:mm a")}</span>
            <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{selectedTopic.views || 0}</span>
          </div>
          <ReactMarkdown className="prose prose-sm max-w-none">{selectedTopic.content}</ReactMarkdown>
          {selectedTopic.tags?.length > 0 && (
            <div className="flex items-center gap-1.5 mt-4 flex-wrap">
              {selectedTopic.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">#{tag}</span>
              ))}
            </div>
          )}
        </Card>

        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-semibold">{replies.length} Response{replies.length !== 1 ? "s" : ""}</h3>
        </div>

        {loadingReplies ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-sky-600" /></div>
        ) : (
          <div className="space-y-3 mb-6">
            {replies.map((reply, i) => {
              const r = getRole(reply.author_role);
              return (
                <motion.div key={reply.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <UserCircle className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold">{reply.author_name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${r.color}`}>{r.label}</span>
                        {reply.author_specialty && <span className="text-[10px] text-muted-foreground">{reply.author_specialty}</span>}
                      </div>
                      {reply.is_verified && (
                        <Badge className="text-[9px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100 ml-auto">
                          <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />Verified
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(reply.created_date), "MMM d, h:mm a")}</span>
                    </div>
                    <ReactMarkdown className="prose prose-sm max-w-none">{reply.content}</ReactMarkdown>
                  </Card>
                </motion.div>
              );
            })}
            {replies.length === 0 && (
              <Card className="p-6 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No responses yet</p>
                <p className="text-xs text-muted-foreground mt-1">Be the first to share your clinical perspective.</p>
              </Card>
            )}
          </div>
        )}

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-sky-100 text-sky-700">Posting as {getRole(userRole).label}</span>
          </div>
          <Textarea
            placeholder="Share your clinical expertise, treatment recommendations, or evidence-based insights..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            className="resize-none mb-3"
          />
          <div className="flex justify-end gap-2">
            <Button onClick={handleReply} disabled={!replyText.trim() || postingReply} className="bg-sky-600 hover:bg-sky-700">
              {postingReply ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
              Post Response
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-display font-bold">Medical Professionals Forum</h1>
          <p className="text-muted-foreground mt-1 text-sm">A secure space for doctors, specialists & nurses to discuss surgery options, treatment methods, and care plans</p>
        </div>

        {/* Role Selector + New Topic */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Your role:</Label>
            <Select value={userRole} onValueChange={setUserRole}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="specialist">Specialist</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-sky-600 hover:bg-sky-700">
                <Plus className="w-4 h-4 mr-1.5" /> New Topic
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Start a Discussion</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-xs">Title *</Label>
                  <Input placeholder="e.g., Laparoscopic vs open cholecystectomy for high-risk patients" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Category *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Content *</Label>
                  <Textarea placeholder="Describe the case, question, or topic for discussion. Include relevant clinical details, patient history, and what you'd like input on..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} className="resize-none" />
                </div>
                <div>
                  <Label className="text-xs">Tags (comma-separated)</Label>
                  <Input placeholder="e.g., cardiology, post-op, elderly" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
              <DialogFooter className="gap-2 mt-4">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateTopic} disabled={!form.title.trim() || !form.content.trim() || saving} className="bg-sky-600 hover:bg-sky-700">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Publish Topic
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterCategory("all")}
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition ${filterCategory === "all" ? "bg-sky-600 border-sky-600 text-white" : "border-border hover:bg-muted text-muted-foreground"}`}
          >
            All Topics
          </button>
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilterCategory(c.value)}
              className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition flex items-center gap-1 ${filterCategory === c.value ? "bg-sky-600 border-sky-600 text-white" : "border-border hover:bg-muted text-muted-foreground"}`}
            >
              <c.icon className="w-3 h-3" /> {c.label}
            </button>
          ))}
        </div>

        {/* Topics List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>
        ) : filteredTopics.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No topics yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start a discussion to get clinical input from your peers.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {pinnedTopics.map((topic, i) => (
              <TopicRow key={topic.id} topic={topic} onClick={() => openTopic(topic)} delay={i * 0.03} />
            ))}
            {regularTopics.map((topic, i) => (
              <TopicRow key={topic.id} topic={topic} onClick={() => openTopic(topic)} delay={(i + pinnedTopics.length) * 0.03} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function TopicRow({ topic, onClick, delay }) {
  const cat = getCategory(topic.category);
  const r = getRole(topic.author_role);
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="p-4 cursor-pointer hover:shadow-md transition hover:border-sky-200" onClick={onClick}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center shrink-0`}>
            <cat.icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {topic.pinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              <h3 className="text-sm font-semibold truncate">{topic.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{topic.content}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${r.color}`}>{r.label}</span>
              <span className="text-[10px] text-muted-foreground">{topic.author_name}</span>
              <span className="text-[10px] text-muted-foreground">· {format(new Date(topic.created_date), "MMM d")}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 text-muted-foreground">
            <span className="text-[10px] flex items-center gap-0.5"><Eye className="w-3 h-3" />{topic.views || 0}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}