import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ShieldCheck, AlertCircle, Loader2, FileText, Stethoscope, Pill, HeartPulse, Lock } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ClinicianView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setError("No access token provided"); setLoading(false); return; }

    base44.functions.invoke("clinicianAccess", { token })
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || err.message || "Failed to load data"))
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base">Health Me Medical Center</h1>
              <p className="text-xs text-sky-100">Secure Patient Data Access</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-0">
            <ShieldCheck className="w-3 h-3 mr-1" /> Secure
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Patient Info */}
        <Card className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Patient</p>
              <h2 className="text-lg font-display font-bold">{data.patient_name}</h2>
              <p className="text-sm text-muted-foreground">{data.patient_email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Access expires</p>
              <p className="text-sm font-medium">{new Date(data.expires_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
              {data.accessed_at && <p className="text-xs text-emerald-600 mt-1">First viewed: {new Date(data.accessed_at).toLocaleString()}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 p-2 bg-amber-50 rounded-lg">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">This data is confidential and shared securely by the patient. Access is logged and time-limited.</p>
          </div>
        </Card>

        {/* Medical Records */}
        {data.share_records && data.records?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-sky-600" />
              <h3 className="font-display font-semibold">Medical Records ({data.records.length})</h3>
            </div>
            <div className="space-y-2">
              {data.records.map((r) => (
                <Card key={r.id} className="p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{r.title}</p>
                    <Badge variant="outline" className="text-[10px]">{r.category?.replace(/_/g, " ")}</Badge>
                    {r.date && <span className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString()}</span>}
                  </div>
                  {r.provider && <p className="text-xs text-muted-foreground mt-0.5">Provider: {r.provider}</p>}
                  {r.notes && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{r.notes}</p>}
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Consultation Summaries */}
        {data.share_consultations && data.consultations?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="w-4 h-4 text-violet-600" />
              <h3 className="font-display font-semibold">Consultation Summaries ({data.consultations.length})</h3>
            </div>
            <div className="space-y-2">
              {data.consultations.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant="outline" className="text-[10px] capitalize">{c.type?.replace(/_/g, " ")}</Badge>
                    {c.specialty && <Badge variant="outline" className="text-[10px]">{c.specialty}</Badge>}
                    <Badge variant={c.status === "completed" ? "default" : "secondary"} className="text-[10px] capitalize">{c.status}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(c.created_date).toLocaleDateString()}</span>
                  </div>
                  {c.symptoms && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Reported Symptoms</p>
                      <p className="text-sm">{c.symptoms}</p>
                    </div>
                  )}
                  {c.report?.summary && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">AI Assessment Summary</p>
                      <p className="text-sm">{c.report.summary}</p>
                    </div>
                  )}
                  {c.report?.diagnoses?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Possible Diagnoses</p>
                      <ul className="text-sm space-y-1 mt-1">
                        {c.report.diagnoses.map((d, i) => (
                          <li key={i}>• {d.name} <span className="text-xs text-muted-foreground">({d.confidence} confidence)</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {c.report?.recommended_tests?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Recommended Tests</p>
                      <p className="text-sm">{c.report.recommended_tests.join(", ")}</p>
                    </div>
                  )}
                  {c.report?.follow_up_plan && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Follow-up Plan</p>
                      <p className="text-sm">{c.report.follow_up_plan}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Medications */}
        {data.share_medications && data.medications?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-emerald-600" />
              <h3 className="font-display font-semibold">Current Medications ({data.medications.length})</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.medications.map((m) => (
                <Card key={m.id} className="p-3">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.dosage} • {m.frequency}</p>
                  {m.prescribing_provider && <p className="text-xs text-muted-foreground mt-0.5">Prescribed by: {m.prescribing_provider}</p>}
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Vitals */}
        {data.share_vitals && data.vitals?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <HeartPulse className="w-4 h-4 text-red-500" />
              <h3 className="font-display font-semibold">Recent Vital Records ({data.vitals.length})</h3>
            </div>
            <Card className="p-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {data.vitals.slice(0, 12).map((v) => (
                  <div key={v.id} className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-[10px] text-muted-foreground uppercase">{v.type?.replace(/_/g, " ")}</p>
                    <p className="text-sm font-bold">
                      {v.type === "blood_pressure" && v.secondary_value ? `${v.value}/${v.secondary_value}` : v.value}
                      {v.unit && <span className="text-xs font-normal text-muted-foreground ml-1">{v.unit}</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{new Date(v.recorded_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* Empty state */}
        {!data.records?.length && !data.consultations?.length && !data.medications?.length && !data.vitals?.length && (
          <Card className="p-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No shared data available</p>
          </Card>
        )}

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">Health Me Medical Center — Secure Clinician Portal</p>
        </div>
      </div>
    </div>
  );
}