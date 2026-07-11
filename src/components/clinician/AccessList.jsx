import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Ban, Clock, Mail, Stethoscope, Loader2 } from "lucide-react";

export default function AccessList({ grants, onRevoke }) {
  const [copiedId, setCopiedId] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  const copyLink = (grant) => {
    const link = `${window.location.origin}/clinician-view?token=${grant.access_token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(grant.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (grant) => {
    setRevokingId(grant.id);
    try {
      await base44.entities.ClinicianAccess.update(grant.id, { status: "revoked" });
      onRevoke();
    } catch (e) { console.error(e); }
    setRevokingId(null);
  };

  if (grants.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Ban className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No access grants yet</p>
        <p className="text-xs text-muted-foreground mt-1">Grant secure access to share your health data with your doctors</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {grants.map((grant) => {
        const isExpired = new Date(grant.expires_at) < new Date();
        const isRevoked = grant.status === "revoked";
        const isActive = !isExpired && !isRevoked;

        return (
          <Card key={grant.id} className={`p-4 ${isRevoked ? "opacity-60" : ""}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{grant.doctor_name}</p>
                  {grant.specialty && <span className="text-xs text-muted-foreground">• {grant.specialty}</span>}
                  <Badge variant={isActive ? "default" : "secondary"} className={`text-[10px] ${isActive ? "bg-emerald-100 text-emerald-700" : isRevoked ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                    {isActive ? "Active" : isRevoked ? "Revoked" : "Expired"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {grant.doctor_email && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />{grant.doctor_email}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {isExpired ? "Expired" : "Expires"} {new Date(grant.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  {grant.accessed_at && (
                    <span className="text-xs text-emerald-600">Last viewed: {new Date(grant.accessed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {grant.share_records && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-600">Records</span>}
                  {grant.share_consultations && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600">Consultations</span>}
                  {grant.share_medications && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">Medications</span>}
                  {grant.share_vitals && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">Vitals</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {isActive && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copyLink(grant)}>
                    {copiedId === grant.id ? <Check className="w-3 h-3 mr-1 text-emerald-600" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copiedId === grant.id ? "Copied" : "Copy Link"}
                  </Button>
                )}
                {!isRevoked && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700" disabled={revokingId === grant.id} onClick={() => handleRevoke(grant)}>
                    {revokingId === grant.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3 mr-1" />}
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}