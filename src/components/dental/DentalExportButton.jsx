import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FileDown, Loader2 } from "lucide-react";
import { generateDentalReportPdf } from "@/lib/generateDentalReportPdf";

export default function DentalExportButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      const [user, visitLogs, painLogs] = await Promise.all([
        base44.auth.me(),
        base44.entities.DentalVisitLog.list("-visit_date", 200),
        base44.entities.DentalPainLog.list("-created_date", 200),
      ]);
      if (visitLogs.length === 0 && painLogs.length === 0) {
        toast({ title: "No data to export", description: "Log dental visits or pain entries first.", variant: "destructive" });
        setLoading(false);
        return;
      }
      generateDentalReportPdf({ user, visitLogs, painLogs });
      toast({ title: "PDF exported", description: "Your dental report is ready to print." });
    } catch (e) {
      console.error(e);
      toast({ title: "Export failed", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading} className="border-cyan-300 text-cyan-700 hover:bg-cyan-50">
      {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 mr-1.5" />}
      Export PDF
    </Button>
  );
}