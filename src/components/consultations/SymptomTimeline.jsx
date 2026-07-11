import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, History, ChevronDown, ChevronUp, Stethoscope, Activity, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { generateReportPdf } from "@/lib/generateReportPdf";

const severityConfig = {
  emergency: { label: "Emergency", color: "bg-red-500", text: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  high: { label: "High", color: "bg-orange-500", text: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  moderate: { label: "Moderate", color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  low: { label: "Low", color: "bg-green-500", text: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
};

const typeLabels = {
  ai_doctor: "AI Doctor",
  ai_nurse: "AI Nurse",
  ai_specialist: "AI Specialist",
};

export default function SymptomTimeline() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.Consultation.list("-created_date", 50);
        setConsultations(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <Card className="p-4 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
        <span className="text-sm text-muted-foreground">Loading symptom history...</span>
      </Card>
    );
  }

  if (consultations.length === 0) {
    return null;
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-sky-600" />
        <h3 className="font-display font-semibold text-sm">Symptom & Severity Timeline</h3>
        <span className="text-xs text-muted-foreground">({consultations.length} consultations)</span>
      </div>

      <div className="relative pl-6">
        {/* vertical line */}
        <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-sky-100" />

        <div className="space-y-3">
          {consultations.map((consult, i) => {
            const sev = severityConfig[consult.severity] || severityConfig.low;
            const isExpanded = expandedId === consult.id;
            const date = consult.created_date ? new Date(consult.created_date) : null;

            return (
              <div key={consult.id} className="relative">
                {/* dot on timeline */}
                <div className={`absolute -left-[18px] top-3 w-3 h-3 rounded-full ${sev.color} ring-4 ring-white`} />

                <div className={`rounded-lg border ${sev.border} ${sev.bg} p-3`}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : consult.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium text-white ${sev.color}`}>
                          {sev.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-white/60 px-1.5 py-0.5 rounded">
                          {typeLabels[consult.type] || consult.type}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      {date ? format(date, "MMM d, yyyy 'at' h:mm a") : "Unknown date"}
                    </p>

                    <p className="text-sm mt-1 line-clamp-2">
                      {consult.symptoms || "No symptoms recorded"}
                    </p>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 mt-2 border-t border-border/50 space-y-2">
                          {consult.symptoms && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Full Symptoms</p>
                              <p className="text-xs mt-0.5">{consult.symptoms}</p>
                            </div>
                          )}

                          {consult.specialty && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Specialty</p>
                              <p className="text-xs mt-0.5">{consult.specialty}</p>
                            </div>
                          )}

                          {consult.report?.summary && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Summary</p>
                              <p className="text-xs mt-0.5 text-muted-foreground">{consult.report.summary}</p>
                            </div>
                          )}

                          {consult.report?.diagnoses?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Possible Diagnoses</p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {consult.report.diagnoses.map((d, idx) => (
                                  <span key={idx} className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded">
                                    {d.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {consult.report?.recommended_tests?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Recommended Tests</p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {consult.report.recommended_tests.map((t, idx) => (
                                  <span key={idx} className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded">{t}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {consult.status === "completed" && consult.report && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-1 h-7 text-xs"
                              onClick={() => generateReportPdf(consult.report, consult.symptoms || "", consult.severity)}
                            >
                              <Download className="w-3 h-3 mr-1.5" /> Download Report
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground font-medium">Severity legend:</span>
        {Object.entries(severityConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
            <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}