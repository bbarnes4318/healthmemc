import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText, FlaskConical, Image, Syringe, Pill, AlertCircle,
  ClipboardList, Stethoscope, Calendar, Download, Loader2, Inbox
} from "lucide-react";
import { motion } from "framer-motion";

const categoryConfig = {
  visit_summary: { icon: FileText, color: "text-sky-600", bg: "bg-sky-100", label: "Visit Summary" },
  lab_results: { icon: FlaskConical, color: "text-emerald-600", bg: "bg-emerald-100", label: "Lab Results" },
  imaging: { icon: Image, color: "text-violet-600", bg: "bg-violet-100", label: "Imaging" },
  vaccination: { icon: Syringe, color: "text-amber-600", bg: "bg-amber-100", label: "Vaccination" },
  prescription: { icon: Pill, color: "text-rose-600", bg: "bg-rose-100", label: "Prescription" },
  allergy: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100", label: "Allergy" },
  intake_form: { icon: ClipboardList, color: "text-indigo-600", bg: "bg-indigo-100", label: "Intake Form" },
  other: { icon: FileText, color: "text-gray-600", bg: "bg-gray-100", label: "Other" },
};

const consultationConfig = {
  ai_doctor: { icon: Stethoscope, color: "text-sky-600", bg: "bg-sky-100", label: "AI Doctor Consultation" },
  ai_nurse: { icon: Stethoscope, color: "text-emerald-600", bg: "bg-emerald-100", label: "AI Nurse Consultation" },
  ai_specialist: { icon: Stethoscope, color: "text-violet-600", bg: "bg-violet-100", label: "AI Specialist Consultation" },
};

function formatDateGroup(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) => a.toDateString() === b.toDateString();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function MedicalTimeline({ onRecordClick }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [records, consultations] = await Promise.all([
          base44.entities.MedicalRecord.list("-date", 200),
          base44.entities.Consultation.list("-created_date", 200),
        ]);

        const recordItems = records.map((r) => ({
          id: `record-${r.id}`,
          type: "record",
          date: r.date || r.created_date,
          sortDate: r.date ? new Date(r.date) : new Date(r.created_date),
          title: r.title,
          category: r.category,
          provider: r.provider,
          notes: r.notes,
          file_url: r.file_url,
          config: categoryConfig[r.category] || categoryConfig.other,
        }));

        const consultationItems = consultations.map((c) => ({
          id: `consultation-${c.id}`,
          type: "consultation",
          date: c.created_date,
          sortDate: new Date(c.created_date),
          title: c.specialty ? `${c.specialty} Consultation` : "AI Consultation",
          category: c.type,
          provider: c.specialty,
          notes: c.symptoms,
          status: c.status,
          severity: c.severity,
          report: c.report,
          config: consultationConfig[c.type] || { icon: Stethoscope, color: "text-gray-600", bg: "bg-gray-100", label: "Consultation" },
        }));

        const merged = [...recordItems, ...consultationItems].sort((a, b) => b.sortDate - a.sortDate);
        setItems(merged);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">No records or consultations yet</p>
        <p className="text-xs text-muted-foreground mt-1">Your medical history will appear here as a timeline.</p>
      </Card>
    );
  }

  // Group items by date
  let lastGroup = "";

  return (
    <div className="relative pl-2">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />

      <div className="space-y-1">
        {items.map((item, i) => {
          const groupLabel = formatDateGroup(item.date);
          const showGroupHeader = groupLabel !== lastGroup;
          lastGroup = groupLabel;

          const Icon = item.config.icon;
          const isExpanded = expandedId === item.id;

          return (
            <div key={item.id}>
              {showGroupHeader && (
                <div className="flex items-center gap-3 py-3 pl-0">
                  <div className="w-10 flex justify-center">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {groupLabel}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="relative flex items-start gap-3 py-2"
              >
                {/* Node */}
                <div className={`w-10 h-10 rounded-full ${item.config.bg} flex items-center justify-center shrink-0 z-10 border-2 border-background`}>
                  <Icon className={`w-4.5 h-4.5 ${item.config.color}`} style={{ width: "18px", height: "18px" }} />
                </div>

                {/* Content */}
                <div
                  className={`flex-1 min-w-0 cursor-pointer rounded-lg transition-all ${isExpanded ? "bg-white border shadow-sm" : "hover:bg-muted/50"}`}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold truncate">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.config.bg} ${item.config.color}`}>
                            {item.config.label}
                          </span>
                          {item.provider && (
                            <span className="text-xs text-muted-foreground">{item.provider}</span>
                          )}
                          {item.status && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              item.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                              item.status === "escalated" ? "bg-red-50 text-red-600" :
                              "bg-amber-50 text-amber-600"
                            }`}>
                              {item.status}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(item.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 pt-3 border-t space-y-2"
                      >
                        {item.notes && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {item.type === "consultation" ? "Symptoms" : "Notes"}
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{item.notes}</p>
                          </div>
                        )}
                        {item.severity && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Severity</p>
                            <p className="text-sm capitalize">{item.severity}</p>
                          </div>
                        )}
                        {item.report?.summary && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Report Summary</p>
                            <p className="text-sm text-foreground">{item.report.summary}</p>
                          </div>
                        )}
                        {item.file_url && (
                          <a href={item.file_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm" className="text-xs">
                              <Download className="w-3.5 h-3.5 mr-1.5" /> View File
                            </Button>
                          </a>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}