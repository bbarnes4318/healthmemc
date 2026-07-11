import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, FileText, Download } from "lucide-react";

const categoryConfig = {
  visit_summary: { label: "Visit Summary", color: "text-sky-600", bg: "bg-sky-50" },
  lab_results: { label: "Lab Results", color: "text-violet-600", bg: "bg-violet-50" },
  imaging: { label: "Imaging", color: "text-amber-600", bg: "bg-amber-50" },
  vaccination: { label: "Vaccination", color: "text-emerald-600", bg: "bg-emerald-50" },
  prescription: { label: "Prescription", color: "text-pink-600", bg: "bg-pink-50" },
  allergy: { label: "Allergy", color: "text-red-600", bg: "bg-red-50" },
  intake_form: { label: "Intake Form", color: "text-indigo-600", bg: "bg-indigo-50" },
  other: { label: "Other", color: "text-gray-600", bg: "bg-gray-50" },
};

export default function RecentReports() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.MedicalRecord.list("-date", 10)
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (records.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No medical records yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((rec) => {
        const cat = categoryConfig[rec.category] || categoryConfig.other;
        return (
          <Card key={rec.id} className="p-3 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
              <FileText className={`w-4 h-4 ${cat.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium truncate">{rec.title}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>{cat.label}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {rec.date && <span className="text-[11px] text-muted-foreground">{new Date(rec.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                {rec.provider && <span className="text-[11px] text-muted-foreground">• {rec.provider}</span>}
              </div>
              {rec.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.notes}</p>}
            </div>
            {rec.file_url && (
              <a href={rec.file_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary shrink-0">
                <Download className="w-4 h-4" />
              </a>
            )}
          </Card>
        );
      })}
    </div>
  );
}