import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  FileText, Plus, Upload, Loader2, Calendar, Trash2,
  Download, Filter, Search
} from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  { value: "visit_summary", label: "Visit Summary" },
  { value: "lab_results", label: "Lab Results" },
  { value: "imaging", label: "Imaging" },
  { value: "vaccination", label: "Vaccination" },
  { value: "prescription", label: "Prescription" },
  { value: "allergy", label: "Allergy" },
  { value: "other", label: "Other" },
];

const categoryColors = {
  visit_summary: "bg-sky-100 text-sky-700",
  lab_results: "bg-emerald-100 text-emerald-700",
  imaging: "bg-violet-100 text-violet-700",
  vaccination: "bg-amber-100 text-amber-700",
  prescription: "bg-rose-100 text-rose-700",
  allergy: "bg-red-100 text-red-700",
  other: "bg-gray-100 text-gray-700",
};

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({ title: "", category: "visit_summary", date: "", provider: "", notes: "" });
  const [fileUrl, setFileUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const data = await base44.entities.MedicalRecord.list("-date", 100);
      setRecords(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(result.file_url);
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await base44.entities.MedicalRecord.create({
        ...form,
        file_url: fileUrl || undefined,
      });
      setForm({ title: "", category: "visit_summary", date: "", provider: "", notes: "" });
      setFileUrl(null);
      setDialogOpen(false);
      loadRecords();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.MedicalRecord.delete(id);
      setRecords(records.filter((r) => r.id !== id));
    } catch (err) { console.error(err); }
  };

  const filtered = records.filter((r) => {
    if (filterCat !== "all" && r.category !== filterCat) return false;
    if (searchTerm && !r.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Medical Records</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{records.length} records stored securely</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-600 hover:bg-sky-700">
              <Plus className="w-4 h-4 mr-2" /> Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Medical Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Record title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Input placeholder="Provider name" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
              <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="resize-none" />
              <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition text-sm">
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : fileUrl ? "File attached ✓" : "Attach file"}
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              <Button onClick={handleSave} disabled={!form.title.trim() || saving} className="w-full bg-sky-600 hover:bg-sky-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Record
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-3.5 h-3.5 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Records List */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No records found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((record, i) => (
            <motion.div key={record.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate">{record.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[record.category] || categoryColors.other}`}>
                      {categories.find((c) => c.value === record.category)?.label || record.category}
                    </span>
                    {record.date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {record.file_url && (
                    <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(record.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}