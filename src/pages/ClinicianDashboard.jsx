import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { KeyRound, Shield, Loader2 } from "lucide-react";
import AccessGrantForm from "@/components/clinician/AccessGrantForm";
import AccessList from "@/components/clinician/AccessList";

export default function ClinicianDashboard() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGrants = async () => {
    try {
      const data = await base44.entities.ClinicianAccess.list("-created_date", 50);
      setGrants(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadGrants(); }, []);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
          <KeyRound className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Clinician Access</h1>
          <p className="text-sm text-muted-foreground">Securely share your health records with your doctors</p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-4 bg-sky-50 rounded-xl border border-sky-200 mb-6">
        <Shield className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
        <p className="text-xs text-sky-800">
          Generate a secure, time-limited access link for your doctor. You choose what data to share and when access expires. Revoke access at any time.
        </p>
      </div>

      <Card className="p-5 mb-6">
        <h2 className="font-display font-semibold text-sm mb-4">Grant New Access</h2>
        <AccessGrantForm onGranted={loadGrants} />
      </Card>

      <div>
        <h2 className="font-display font-semibold text-sm mb-3">Active & Past Access Grants</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <AccessList grants={grants} onRevoke={loadGrants} />
        )}
      </div>
    </div>
  );
}