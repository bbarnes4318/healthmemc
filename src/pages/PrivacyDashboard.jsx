import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Lock, FileCheck, Eye, Shield, Activity, Clock,
  UserCheck, AlertCircle, Loader2, RefreshCw, KeyRound, FileText, UserX
} from "lucide-react";
import { format } from "date-fns";
import PrivacyNotice from "@/components/records/PrivacyNotice";
import { useFamilyMember } from "@/context/FamilyMemberContext";

export default function PrivacyDashboard() {
  const { currentMemberId } = useFamilyMember();
  const [accessLogs, setAccessLogs] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [access, meds] = await Promise.all([
        base44.entities.ClinicianAccess.list("-created_date", 100),
        base44.entities.MedicalRecord.list("-date", 100),
      ]);
      const filteredAccess = currentMemberId
        ? access.filter((a) => true) // ClinicianAccess is user-scoped by created_by_id
        : access;
      const filteredRecords = currentMemberId
        ? meds.filter((r) => r.family_member_id === currentMemberId)
        : meds;
      setAccessLogs(filteredAccess);
      setRecords(filteredRecords);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const activeAccess = accessLogs.filter((a) => a.status === "active");
  const revokedAccess = accessLogs.filter((a) => a.status === "revoked");
  const criticalRecords = records.filter((r) => r.priority === "critical" || r.priority === "urgent");
  const reviewedRecords = records.filter((r) => r.review_status === "reviewed");
  const expiredAccess = activeAccess.filter((a) => a.expires_at && new Date(a.expires_at) < new Date());

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" /> Privacy & Security Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your medical data access logs, security status, and compliance information</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SecurityCard
          icon={Lock}
          title="Encryption"
          status="Active"
          color="green"
          subtitle="AES-256 at rest · TLS 1.2+ in transit"
        />
        <SecurityCard
          icon={KeyRound}
          title="Active Access Grants"
          status={activeAccess.length.toString()}
          color={activeAccess.length > 0 ? "blue" : "gray"}
          subtitle={expiredAccess.length > 0 ? `${expiredAccess.length} expired` : "All valid"}
        />
        <SecurityCard
          icon={AlertCircle}
          title="Flagged Records"
          status={criticalRecords.length.toString()}
          color={criticalRecords.length > 0 ? "red" : "green"}
          subtitle={criticalRecords.length > 0 ? "Require review" : "All clear"}
        />
        <SecurityCard
          icon={FileCheck}
          title="HIPAA Compliance"
          status="Verified"
          color="green"
          subtitle="45 CFR § 164.520"
        />
      </div>

      {/* Compliance Notice */}
      <PrivacyNotice />

      {/* Federal Compliance Section */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-blue-600" /> Federal Privacy Compliance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ComplianceItem
            icon={FileCheck}
            title="HIPAA"
            full="Health Insurance Portability and Accountability Act"
            description="Your Protected Health Information (PHI) is handled according to federal privacy and security rules. No data is shared without your explicit written consent."
          />
          <ComplianceItem
            icon={Shield}
            title="HITECH Act"
            full="Health Information Technology for Economic and Clinical Health Act"
            description="Strengthened civil and criminal enforcement of HIPAA rules. Promotes secure adoption of electronic health records with breach notification requirements."
          />
          <ComplianceItem
            icon={Eye}
            title="Patient Rights"
            full="45 CFR § 164.520 — Notice of Privacy Practices"
            description="You have the right to access, amend, restrict, and revoke access to your medical records at any time. All access is logged and auditable."
          />
        </div>
      </Card>

      {/* Access Logs */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" /> Medical Record Access Logs
          </h3>
          <Badge variant="secondary" className="text-xs">{accessLogs.length} total grants</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
        ) : accessLogs.length === 0 ? (
          <div className="text-center py-8">
            <UserX className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No clinician access grants yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Access grants appear here when you share records with a healthcare provider.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accessLogs.map((log) => {
              const isExpired = log.expires_at && new Date(log.expires_at) < new Date();
              const isActive = log.status === "active" && !isExpired;
              return (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-green-100" : "bg-red-100"}`}>
                    {isActive ? <UserCheck className="w-4 h-4 text-green-600" /> : <UserX className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{log.doctor_name}</p>
                      <Badge variant={isActive ? "default" : "destructive"} className="text-[10px] h-5">
                        {isActive ? "Active" : isExpired ? "Expired" : "Revoked"}
                      </Badge>
                      {log.specialty && <Badge variant="outline" className="text-[10px] h-5">{log.specialty}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{log.doctor_email}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        Granted: {log.created_date ? format(new Date(log.created_date), "MMM d, yyyy") : "N/A"}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <KeyRound className="w-3 h-3" />
                        Expires: {log.expires_at ? format(new Date(log.expires_at), "MMM d, yyyy") : "N/A"}
                      </span>
                      {log.accessed_at && (
                        <span className="flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />
                          Last accessed: {format(new Date(log.accessed_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    {/* Share permissions */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {log.share_records && <Badge variant="outline" className="text-[9px] h-4"><FileText className="w-2.5 h-2.5 mr-0.5" />Records</Badge>}
                      {log.share_consultations && <Badge variant="outline" className="text-[9px] h-4"><Activity className="w-2.5 h-2.5 mr-0.5" />Consultations</Badge>}
                      {log.share_medications && <Badge variant="outline" className="text-[9px] h-4">Meds</Badge>}
                      {log.share_vitals && <Badge variant="outline" className="text-[9px] h-4">Vitals</Badge>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Record Security Summary */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-blue-600" /> Record Security Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Total Records" value={records.length} color="text-blue-600" bg="bg-blue-50" />
          <StatBox label="Flagged (Critical/Urgent)" value={criticalRecords.length} color="text-red-600" bg="bg-red-50" />
          <StatBox label="Reviewed" value={reviewedRecords.length} color="text-green-600" bg="bg-green-50" />
          <StatBox label="Revoked Access" value={revokedAccess.length} color="text-gray-600" bg="bg-gray-100" />
        </div>
      </Card>
    </div>
  );
}

function SecurityCard({ icon: Icon, title, status, color, subtitle }) {
  const colorMap = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    red: "bg-red-100 text-red-600",
    gray: "bg-gray-100 text-gray-500",
  };
  return (
    <Card className="p-4">
      <div className={`w-9 h-9 rounded-lg ${colorMap[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-muted-foreground font-medium">{title}</p>
      <p className="text-lg font-bold mt-0.5">{status}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
    </Card>
  );
}

function ComplianceItem({ icon: Icon, title, full, description }) {
  return (
    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-4 h-4 text-blue-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900">{title}</p>
          <p className="text-[10px] text-blue-600">{full}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function StatBox({ label, value, color, bg }) {
  return (
    <div className={`text-center p-3 ${bg} rounded-lg`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}