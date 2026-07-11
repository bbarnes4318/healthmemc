import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bookmark, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function QuickTemplates({ onLoadTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.IntakeTemplate.list("-created_date", 10);
        setTemplates(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Loading templates...</div>;
  if (templates.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
        <Bookmark className="w-3 h-3" /> One-Click Templates
      </p>
      <div className="flex flex-wrap gap-1.5">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              onLoadTemplate({
                chief_complaint: t.chief_complaint || "",
                symptom_duration: t.symptom_duration || "",
                symptom_severity: t.symptom_severity || "moderate",
                current_medications: t.current_medications || "",
                allergies: t.allergies || "",
                medical_history: t.medical_history || "",
                surgical_history: t.surgical_history || "",
                family_history: t.family_history || "",
                lifestyle_notes: t.lifestyle_notes || "",
                questions_for_provider: t.questions_for_provider || "",
              });
              toast({ title: "Template applied", description: `"${t.template_name}" loaded.` });
            }}
            className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition font-medium"
          >
            {t.template_name}
          </button>
        ))}
      </div>
    </div>
  );
}