import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, FileText, Lock, ShieldCheck, Download } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function SharedRecordsView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setError("No access token provided"); setLoading(false); return; }

    base44.functions.invoke("getSharedRecords", { token })
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || err.message || "Failed to load records"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-display font-bold mb-1">Access Denied</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-3">Please contact the patient for a new access link.</p>
        </Card>
      </div>
    );
  }

  const records = data.records || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base">Health Me Medical Center</h1>
              <p className="text-xs text-sky-100">Secure Medical Records Share</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-0">
            <ShieldCheck className="w-3 h-3 mr-1" /> Secure
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        <Card className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Patient</p>
              <h2 className="text-lg font-display font-bold">{data.patient_name}</h2>
              {data.recipient_name && <p className="text-sm text-muted-foreground mt-0.5">Shared with: {data.recipient_name}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Link expires</p>
              <p className="text-sm font-medium">{format(parseISO(data.expires_at), "MMM d, yyyy")}</p>
              {data.accessed_at && <p className="text-xs text-emerald-600 mt-1">Last viewed: {format(new Date(data.accessed_at), "MMM d, h:mm a")}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 p-2 bg-amber-50 rounded-lg">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">This data is confidential and shared securely by the patient. Access is logged and time-limited.</p>
          </div>
        </Card>

        {records.length > 0 ? (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-sky-600" />
              <h3 className="font-display font-semibold">Shared Medical Records ({records.length})</h3>
            </div>
            <div className="space-y-2">
              {records.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-medium">{r.title}</p>
                    <Badge variant="outline" className="text-[10px]">{r.category?.replace(/_/g, " ")}</Badge>
                    {r.priority === "urgent" && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                    {r.priority === "critical" && <Badge variant="destructive" className="text-[10px]">Critical</Badge>}
                    {r.date && <span className="text-xs text-muted-foreground">{format(parseISO(r.date), "MMM d, yyyy")}</span>}
                  </div>
                  {r.provider && <p className="text-xs text-muted-foreground">Provider: {r.provider}</p>}
                  {r.notes && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{r.notes}</p>}
                  {r.file_url && (
                    <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline mt-2">
                      <Download className="w-3 h-3" /> View attached file
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </section>
        ) : (
          <Card className="p-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No shared records available</p>
          </Card>
        )}

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">Health Me Medical Center — Secure Records Share Portal</p>
        </div>
      </div>
    </div>
  );
}