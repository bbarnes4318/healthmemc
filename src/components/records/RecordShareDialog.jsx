import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Copy, Check, Link2, Shield, Filter, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "lab_results", label: "Labs" },
  { value: "visit_summary", label: "Visits" },
  { value: "imaging", label: "Imaging" },
  { value: "prescription", label: "Rx" },
  { value: "vaccination", label: "Vaccines" },
  { value: "allergy", label: "Allergies" },
  { value: "other", label: "Other" },
];

const EXPIRY_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
];

export default function RecordShareDialog({ doctor, onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [category, setCategory] = useState("all");
  const [expiryDays, setExpiryDays] = useState(14);
  const [creating, setCreating] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!doctor) return;
    setLoading(true);
    setShareLink(null);
    setSelected(new Set());
    const load = async () => {
      try {
        const data = await base44.entities.MedicalRecord.list("-date", 100);
        setRecords(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [doctor]);

  const filtered = records.filter((r) => category === "all" || r.category === category);

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleCreate = async () => {
    if (selected.size === 0) return;
    setCreating(true);
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      await base44.entities.RecordShare.create({
        recipient_email: doctor?.email || "",
        recipient_name: doctor?.doctor_name || "",
        assigned_record_ids: Array.from(selected),
        access_token: token,
        expires_at: expiresAt.toISOString(),
        status: "active",
        share_medical_records: true,
      });

      const link = `${window.location.origin}/shared-records?token=${token}`;
      setShareLink(link);
      toast({ title: "Secure link created", description: `${selected.size} record${selected.size > 1 ? "s" : ""} shared with ${doctor?.doctor_name || "doctor"}.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to create link", variant: "destructive" });
    }
    setCreating(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoLink = doctor?.email
    ? `mailto:${doctor.email}?subject=${encodeURIComponent("Secure Medical Records Share")}&body=${encodeURIComponent(`I've shared medical records with you via Health Me Medical Center. Access them securely here:\n\n${shareLink}`)}`
    : null;

  return (
    <Dialog open={!!doctor} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-sky-600" />
            Share Records with {doctor?.doctor_name || "Doctor"}
          </DialogTitle>
        </DialogHeader>

        {shareLink ? (
          <div className="space-y-4 mt-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-emerald-700">Secure link created!</p>
              <p className="text-xs text-emerald-600 mt-1">
                {selected.size} record{selected.size > 1 ? "s" : ""} shared · Expires in {expiryDays} days
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase mb-1.5">Secure Link</p>
              <div className="flex items-center gap-2">
                <input readOnly value={shareLink} className="flex-1 h-9 px-3 text-xs rounded-md border border-input bg-transparent truncate" />
                <Button size="sm" className="h-9 shrink-0" onClick={copyLink}>
                  {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
            {mailtoLink && (
              <a href={mailtoLink}>
                <Button className="w-full">
                  <Mail className="w-4 h-4 mr-2" /> Email Link to {doctor.doctor_name}
                </Button>
              </a>
            )}
            <Button variant="outline" className="w-full" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-2 p-2.5 bg-sky-50 border border-sky-100 rounded-lg">
              <Shield className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <p className="text-[10px] text-sky-700">Links are secure, time-limited, and show only the records you select.</p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    category === c.value ? "bg-sky-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-sky-600" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No records in this category</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {filtered.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                      selected.has(r.id) ? "bg-sky-50 border border-sky-200" : "bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="w-4 h-4 rounded shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px]">{r.category?.replace(/_/g, " ")}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {r.date ? format(parseISO(r.date), "MMM d, yyyy") : ""}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Expires in:</span>
              {EXPIRY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setExpiryDays(o.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    expiryDays === o.value ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <Button onClick={handleCreate} disabled={selected.size === 0 || creating} className="w-full bg-sky-600 hover:bg-sky-700 h-10">
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
              Generate Secure Link ({selected.size} selected)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}