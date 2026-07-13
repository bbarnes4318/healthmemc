import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FileDown, Loader2 } from "lucide-react";
import { generateNewbornMonthlyPdf } from "@/lib/generateNewbornMonthlyPdf";
import { format, subMonths } from "date-fns";

export default function BabyMonthlyReportButton() {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthLabel = format(now, "MMMM yyyy");

      const [logs, milestones, growth] = await Promise.all([
        base44.entities.BabyDailyLog.list("-date", 500),
        base44.entities.BabyMilestone.list("-milestone_date", 100),
        base44.entities.BabyGrowthLog.list("-measurement_date", 50),
      ]);

      const inMonth = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= monthStart && d <= monthEnd;
      };

      const monthLogs = logs.filter(l => inMonth(l.date));
      const monthMilestones = milestones.filter(m => inMonth(m.milestone_date));
      const monthGrowth = growth.filter(g => inMonth(g.measurement_date));

      const feedings = monthLogs.filter(l => l.log_type === "feeding");
      const sleeps = monthLogs.filter(l => l.log_type === "sleep");
      const diapers = monthLogs.filter(l => l.log_type === "diaper");

      const babyName = logs.find(l => l.baby_name)?.baby_name ||
        milestones.find(m => m.baby_name)?.baby_name ||
        growth.find(g => g.baby_name)?.baby_name || "";

      generateNewbornMonthlyPdf({
        feedings, sleeps, diapers,
        milestones: monthMilestones,
        growthLogs: monthGrowth,
        babyName,
        monthLabel,
      });

      toast({ title: "Monthly report generated!" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate report", variant: "destructive" });
    }
    setGenerating(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 text-xs"
      onClick={handleGenerate}
      disabled={generating}
    >
      {generating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 mr-1.5" />}
      {generating ? "Generating..." : "Monthly PDF Report"}
    </Button>
  );
}