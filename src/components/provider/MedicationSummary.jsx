import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pill, CheckCircle2, XCircle, Circle } from "lucide-react";

const statusConfig = {
  taken: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", label: "Taken" },
  missed: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "Missed" },
  skipped: { icon: Circle, color: "text-gray-500", bg: "bg-gray-50", label: "Skipped" },
};

export default function MedicationSummary() {
  const [meds, setMeds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Medication.filter({ active: true }),
      base44.entities.MedicationLog.list("-scheduled_date", 20),
    ])
      .then(([m, l]) => { setMeds(m); setLogs(l); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const takenCount = logs.filter((l) => l.status === "taken").length;
  const adherenceRate = logs.length > 0 ? Math.round((takenCount / logs.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Medications</h4>
        {meds.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">No active medications</p>
        ) : (
          <div className="space-y-2">
            {meds.map((med) => (
              <Card key={med.id} className="p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                  <Pill className="w-4 h-4 text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{med.name}</p>
                  <p className="text-xs text-muted-foreground">{med.dosage} • {med.frequency}</p>
                </div>
                {med.refill_date && (
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    Refill: {new Date(med.refill_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Logs</h4>
          {logs.length > 0 && (
            <Badge variant={adherenceRate >= 80 ? "default" : adherenceRate >= 50 ? "secondary" : "destructive"} className="text-[10px]">
              {adherenceRate}% adherence
            </Badge>
          )}
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">No medication logs</p>
        ) : (
          <div className="space-y-1.5">
            {logs.slice(0, 8).map((log) => {
              const config = statusConfig[log.status] || statusConfig.skipped;
              const Icon = config.icon;
              return (
                <div key={log.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50">
                  <div className={`w-7 h-7 rounded-md ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{log.medication_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(log.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {log.taken_at && ` • ${new Date(log.taken_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                    </p>
                  </div>
                  <span className={`text-[10px] ${config.color} font-medium`}>{config.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}