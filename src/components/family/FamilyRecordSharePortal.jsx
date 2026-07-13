import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, Shield, Share2, Trash2, Copy, Check, Link2, Lock, Eye, EyeOff, UserPlus, Calendar, FileText, Pill, Activity, Stethoscope, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const shareOptions = [
  { key: "share_medical_records", label: "Medical Records", icon: FileText, color: "text-sky-600" },
  { key: "share_appointments", label: "Appointment History", icon: Calendar, color: "text-indigo-600" },
  { key: "share_medications", label: "Medications", icon: Pill, color: "text-emerald-600" },
  { key: "share_vitals", label: "Vitals & Labs", icon: Activity, color: "text-amber-600" },
  { key: "share_recovery", label: "Surgical Recovery", icon: Stethoscope, color: "text-rose-600" },
];

const expiryOptions = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "6 months", days: 180 },
];

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function FamilyRecordSharePortal() {
  const { toast } = useToast();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [creating, setCreating] = useState(false);

  // Form state
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [expiryDays, setExpiryDays] = useState(30);
  const [shareFlags, setShareFlags] = useState({
    share_medical_records: true,
    share_appointments: true,
    share_medications: false,
    share_vitals: false,
    share_recovery: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.RecordShare.filter({}, "-created_date", 50);
      setShares(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!recipientEmail.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const share = await base44.entities.RecordShare.create({
        recipient_email: recipientEmail.trim(),
        recipient_name: recipientName.trim() || undefined,
        family_member_id: familyMemberId || undefined,
        ...shareFlags,
        access_token: token,
        expires_at: expiresAt.toISOString(),
        status: "active",
      });

      // Send email notification to recipient
      try {
        const origin = window.location.origin;
        const accessLink = `${origin}/clinician-view?token=${token}`;
        await base44.integrations.Core.SendEmail({
          to: recipientEmail.trim(),
          subject: "Secure Health Records Access Granted — Health Me Medical Center",
          body: `Hello ${recipientName || ""},\n\nYou have been granted secure, read-only access to health records on Health Me Medical Center.\n\nAccess Link: ${accessLink}\n\nThis access will expire on ${format(expiresAt, "MMMM d, yyyy 'at' h:mm a")}.\n\nPlease use the link above to view the shared records. If you did not expect this email, please disregard it.\n\n— Health Me Medical Center`,
        });
        toast({ title: "Access granted & email sent", description: `${recipientEmail} can now view shared records.` });
      } catch (e) {
        console.error("Email failed:", e);
        toast({ title: "Access granted", description: "Share link created (email notification failed)." });
      }

      setRecipientName("");
      setRecipientEmail("");
      setFamilyMemberId("");
      setShareFlags({
        share_medical_records: true,
        share_appointments: true,
        share_medications: false,
        share_vitals: false,
        share_recovery: false,
      });
      setDialogOpen(false);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to create access", variant: "destructive" });
    }
    setCreating(false);
  };

  const handleRevoke = async (share) => {
    try {
      await base44.entities.RecordShare.update(share.id, { status: "revoked" });
      toast({ title: "Access revoked", description: `${share.recipient_email} can no longer view records.` });
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to revoke", variant: "destructive" });
    }
  };

  const copyLink = (share) => {
    const origin = window.location.origin;
    const link = `${origin}/clinician-view?token=${share.access_token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link copied to clipboard" });
  };

  const toggleFlag = (key) => {
    setShareFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeShares = shares.filter((s) => s.status === "active" && new Date(s.expires_at) > new Date());
  const expiredShares = shares.filter((s) => s.status === "revoked" || new Date(s.expires_at) <= new Date());

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Secure Family Access Portal</h3>
            <p className="text-xs text-muted-foreground">Grant read-only access to records & appointments for your family</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-sky-600 hover:bg-sky-700 h-8 text-xs">
              <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Grant Access
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Share2 className="w-4 h-4 text-sky-600" /> Grant Read-Only Access
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Recipient Name</label>
                <Input
                  placeholder="e.g., Sarah Johnson"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Recipient Email *</label>
                <Input
                  type="email"
                  placeholder="family@email.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="h-8 text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">They'll receive a secure access link via email.</p>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">What to Share (Read-Only)</label>
                <div className="space-y-2">
                  {shareOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <div key={opt.key} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${opt.color}`} />
                          <span className="text-xs font-medium">{opt.label}</span>
                        </div>
                        <Switch
                          checked={shareFlags[opt.key]}
                          onCheckedChange={() => toggleFlag(opt.key)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Access Expires In</label>
                <div className="grid grid-cols-4 gap-2">
                  {expiryOptions.map((opt) => (
                    <Button
                      key={opt.days}
                      size="sm"
                      variant={expiryDays === opt.days ? "default" : "outline"}
                      className={`h-8 text-xs ${expiryDays === opt.days ? "bg-sky-600 hover:bg-sky-700" : ""}`}
                      onClick={() => setExpiryDays(opt.days)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Lock className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-800">
                  Recipients get view-only access via a secure token link. You can revoke access at any time. No login or account required to view shared records.
                </p>
              </div>
              <Button onClick={handleCreate} disabled={creating || !recipientEmail.trim()} className="w-full bg-sky-600 hover:bg-sky-700">
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
                Grant Access & Send Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
        </div>
      ) : shares.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No access granted yet</p>
          <p className="text-xs text-muted-foreground mt-1">Grant read-only access to your medical records and appointments so family members stay informed during your recovery.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active shares */}
          {activeShares.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Active Access ({activeShares.length})</p>
              <div className="space-y-2">
                <AnimatePresence>
                  {activeShares.map((share) => (
                    <motion.div
                      key={share.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate">{share.recipient_name || share.recipient_email}</p>
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px]">
                              <Eye className="w-2.5 h-2.5 mr-0.5" /> Read-Only
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{share.recipient_email}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {shareOptions.filter((o) => share[o.key]).map((o) => (
                              <Badge key={o.key} variant="outline" className="text-[9px]">
                                <o.icon className={`w-2.5 h-2.5 mr-0.5 ${o.color}`} /> {o.label}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Expires {format(new Date(share.expires_at), "MMM d, yyyy 'at' h:mm a")}
                            {share.last_accessed_at && (
                              <span className="ml-2">· Last viewed {format(new Date(share.last_accessed_at), "MMM d")}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => copyLink(share)}>
                            {copiedId === share.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-700" onClick={() => handleRevoke(share)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Expired/revoked shares */}
          {expiredShares.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Expired / Revoked ({expiredShares.length})</p>
              <div className="space-y-2">
                {expiredShares.map((share) => (
                  <div key={share.id} className="p-3 rounded-lg border border-muted bg-muted/20 opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{share.recipient_name || share.recipient_email}</p>
                          <Badge variant="outline" className="text-[9px]">
                            <EyeOff className="w-2.5 h-2.5 mr-0.5" /> {share.status === "revoked" ? "Revoked" : "Expired"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{share.recipient_email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}