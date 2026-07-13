import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, FileText, ChevronRight, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function CriticalRecordsBanner() {
  const { currentMemberId } = useFamilyMember();
  const [criticalRecords, setCriticalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const load = async () => {
    try {
      const data = await base44.entities.MedicalRecord.list("-date", 100);
      const filtered = currentMemberId
        ? data.filter((r) => r.family_member_id === currentMemberId && (r.priority === "critical" || r.priority === "urgent") && r.review_status !== "reviewed")
        : data.filter((r) => (r.priority === "critical" || r.priority === "urgent") && r.review_status !== "reviewed");
      setCriticalRecords(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  const handleMarkReviewed = async (id) => {
    try {
      await base44.entities.MedicalRecord.update(id, { review_status: "reviewed" });
      setCriticalRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (e) { console.error(e); }
  };

  if (loading || dismissed || criticalRecords.length === 0) return null;

  const criticalCount = criticalRecords.filter((r) => r.priority === "critical").length;
  const urgentCount = criticalRecords.filter((r) => r.priority === "urgent").length;

  return (
    <Card className={`p-4 border-2 ${criticalCount > 0 ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${criticalCount > 0 ? "bg-red-100" : "bg-amber-100"}`}>
          <AlertTriangle className={`w-5 h-5 ${criticalCount > 0 ? "text-red-600" : "text-amber-600"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold text-sm ${criticalCount > 0 ? "text-red-800" : "text-amber-800"}`}>
              {criticalCount > 0 ? "Critical Records Require Immediate Review" : "Urgent Records Need Your Attention"}
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${criticalCount > 0 ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"}`}>
              {criticalRecords.length} record{criticalRecords.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {criticalCount > 0 && `${criticalCount} critical`}
            {criticalCount > 0 && urgentCount > 0 && " · "}
            {urgentCount > 0 && `${urgentCount} urgent`}
            {" — please review these records and contact your healthcare provider if needed."}
          </p>

          <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
            {criticalRecords.map((rec) => (
              <div key={rec.id} className={`flex items-center gap-2 p-2 rounded-lg bg-white/60 ${rec.priority === "critical" ? "border border-red-200" : "border border-amber-200"}`}>
                <FileText className={`w-3.5 h-3.5 shrink-0 ${rec.priority === "critical" ? "text-red-500" : "text-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{rec.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {rec.category?.replace(/_/g, " ")}
                    {rec.date && ` · ${format(new Date(rec.date), "MMM d, yyyy")}`}
                    {rec.provider && ` · ${rec.provider}`}
                  </p>
                  {rec.flagged_reason && (
                    <p className="text-[10px] text-red-600 mt-0.5">⚠ {rec.flagged_reason}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] shrink-0"
                  onClick={() => handleMarkReviewed(rec.id)}
                >
                  Mark Reviewed
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Link to="/records">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                View All Records <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={load}>
              <RefreshCw className="w-3 h-3 mr-1" /> Refresh
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setDismissed(true)}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}