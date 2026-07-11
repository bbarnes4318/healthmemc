import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Ban, Loader2, Copy, CheckCircle, Shield, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const shareLabels = {
  share_medical_records: "Medical Records",
  share_appointments: "Appointments",
  share_medications: "Medications",
  share_vitals: "Vitals",
};

export default function RecordShareManager() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [form, setForm] = useState({
    recipient_email: "",
    recipient_name: "",
    share_medical_records: true,
    share_appointments: true,
    share_medications: false,
    share_vitals: false,
  });
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await base44.entities.RecordShare.filter({ status: "active" }, "-created_date");
      setShares(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.recipient_email.trim()) return;
    setSaving(true);
    try {
      const token = crypto.randomUUID();
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      await base44.entities.RecordShare.create({
        ...form,
        access_token: token,
        expires_at: expires.toISOString(),
        status: "active",
      });
      toast({
        title: "Access authorized",
        description: `${form.recipient_name || form.recipient_email} can now view the selected records.`,
      });
      setForm({
        recipient_email: "", recipient_name: "",
        share_medical_records: true, share_appointments: true,
        share_medications: false, share_vitals: false,
      });
      setDialogOpen(false);
      load();
    } catch (e) {
      toast({ title: "Failed to create share", variant: "destructive" });
      console.error(e);
    }
    setSaving(false);
  };

  const handleRevoke = async (id) => {
    setRevokingId(id);
    try {
      await base44.entities.RecordShare.update(id, { status: "revoked" });
      toast({ title: "Access revoked" });
      load();
    } catch (e) { console.error(e); }
    setRevokingId(null);
  };

  const copyLink = (share) => {
    const url = `${window.location.origin}/clinician-view?token=${share.access_token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link copied", description: "Share this secure link with your family member." });
  };

  const toggleField = (field) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-600" /> Family Data Sharing
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Authorize family members to view specific health records and appointment history.
          </p>
        </div>
        <Button size="sm" className="bg-sky-600 hover:bg-sky-700" onClick={() => setDialogOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Share
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
        </div>
      ) : shares.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No active shares yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Authorize a family member to view your records and assist with your care.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {shares.map((share) => (
            <Card key={share.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{share.recipient_name || share.recipient_email}</p>
                    {share.recipient_name && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Mail className="w-3 h-3" />{share.recipient_email}
                      </span>
                    )}
                    <Badge className="text-[10px] bg-emerald-100 text-emerald-700">Active</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(shareLabels).map(([key, label]) => {
                      if (!share[key]) return null;
                      return (
                        <span key={key} className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-600">
                          {label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copyLink(share)}>
                      {copiedId === share.id ? (
                        <><CheckCircle className="w-3 h-3 mr-1.5 text-emerald-600" /> Copied</>
                      ) : (
                        <><Copy className="w-3 h-3 mr-1.5" /> Copy Secure Link</>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-500 hover:text-red-700"
                      disabled={revokingId === share.id}
                      onClick={() => handleRevoke(share.id)}
                    >
                      {revokingId === share.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Ban className="w-3 h-3 mr-1" />}
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-600" /> Authorize Family Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground">
              Grant a family member or caregiver secure access to specific health data. They'll receive a link to view the authorized records.
            </p>
            <div>
              <Label className="text-xs">Recipient Name</Label>
              <Input
                placeholder="e.g., Jane Doe"
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Recipient Email *</Label>
              <Input
                type="email"
                placeholder="family@email.com"
                value={form.recipient_email}
                onChange={(e) => setForm({ ...form, recipient_email: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs mb-2 block">Select Data to Share</Label>
              <div className="space-y-2">
                {Object.entries(shareLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                    <span className="text-sm">{label}</span>
                    <Switch checked={form[key]} onCheckedChange={() => toggleField(key)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.recipient_email.trim() || saving} className="bg-sky-600 hover:bg-sky-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
              Authorize Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}