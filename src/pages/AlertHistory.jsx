import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle, ArrowLeft, TrendingUp, TrendingDown, CheckCircle2,
  ShieldAlert, Activity, Loader2,
} from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import moment from "moment";

const vitalLabels = {
  heart_rate: "Heart Rate", blood_pressure: "Blood Pressure", oxygen_saturation: "Oxygen (SpO2)",
  blood_glucose: "Blood Glucose", weight: "Weight", sleep_hours: "Sleep",
  activity_minutes: "Activity", temperature: "Temperature", steps: "Steps",
};
const vitalUnits = {
  heart_rate: "bpm", blood_pressure: "mmHg", oxygen_saturation: "%",
  blood_glucose: "mg/dL", weight: "kg", sleep_hours: "hrs",
  activity_minutes: "min", temperature: "°F", steps: "steps",
};

function formatValue(vital) {
  if (vital.type === "blood_pressure" && vital.secondary_value) return `${vital.value}/${vital.secondary_value}`;
  return `${vital.value} ${vitalUnits[vital.type] || ""}`;
}

export default function AlertHistory() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [thresholds, setThresholds] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    loadData();
  }, [currentMemberId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const [t, v] = await Promise.all([
        base44.entities.VitalThreshold.filter(filter),
        base44.entities.VitalRecord.filter(filter, "-recorded_at", 500),
      ]);
      setThresholds(t);
      setVitals(v);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const alerts = useMemo(() => {
    const result = [];
    const sortedVitals = [...vitals].sort(
      (a, b) => new Date(a.recorded_at || a.created_date) - new Date(b.recorded_at || b.created_date)
    );

    sortedVitals.forEach((vital) => {
      const threshold = thresholds.find((t) => t.vital_type === vital.type && t.enabled !== false);
      if (!threshold) return;

      let breached = false;
      let direction = "";

      if (threshold.high_threshold && vital.value > threshold.high_threshold) {
        breached = true; direction = "high";
      }
      if (threshold.low_threshold && vital.value < threshold.low_threshold) {
        breached = true; direction = "low";
      }
      if (vital.type === "blood_pressure" && vital.secondary_value && threshold.high_threshold) {
        if (vital.secondary_value > threshold.high_threshold) { breached = true; direction = "high"; }
      }

      if (breached) {
        const range = threshold.high_threshold - (threshold.low_threshold || 0);
        const deviation = direction === "high"
          ? (vital.value - threshold.high_threshold) / (range || 1)
          : ((threshold.low_threshold || 0) - vital.value) / (range || 1);
        result.push({
          ...vital,
          threshold,
          direction,
          severity: deviation > 0.25 ? "critical" : "warning",
        });
      }
    });
    return result.reverse();
  }, [vitals, thresholds]);

  const alertsWithRecovery = useMemo(() => {
    return alerts.map((alert) => {
      const laterVitals = vitals
        .filter((v) => v.type === alert.type &&
          new Date(v.recorded_at || v.created_date) > new Date(alert.recorded_at || alert.created_date))
        .sort((a, b) => new Date(a.recorded_at || a.created_date) - new Date(b.recorded_at || b.created_date));

      const recovery = laterVitals.find((v) => {
        const t = alert.threshold;
        if (!t) return false;
        const inRange = (!t.high_threshold || v.value <= t.high_threshold) &&
                        (!t.low_threshold || v.value >= t.low_threshold);
        if (v.type === "blood_pressure" && v.secondary_value && t.high_threshold) {
          return inRange && v.secondary_value <= t.high_threshold;
        }
        return inRange;
      });

      return {
        ...alert,
        recovery: recovery
          ? { value: formatValue(recovery), date: recovery.recorded_at || recovery.created_date }
          : null,
      };
    });
  }, [alerts, vitals]);

  const filtered = filterType === "all" ? alertsWithRecovery : alertsWithRecovery.filter((a) => a.type === filterType);
  const criticalCount = filtered.filter((a) => a.severity === "critical").length;
  const recoveredCount = filtered.filter((a) => a.recovery).length;
  const alertTypes = [...new Set(alerts.map((a) => a.type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-5">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-sky-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-600" />
          Alert History
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Triggered vital sign alerts & recovery trends for {currentMemberName}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-display font-bold text-rose-600">{filtered.length}</p>
          <p className="text-xs text-muted-foreground">Total Alerts</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-display font-bold text-red-700">{criticalCount}</p>
          <p className="text-xs text-muted-foreground">Critical</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-display font-bold text-emerald-600">{recoveredCount}</p>
          <p className="text-xs text-muted-foreground">Recovered</p>
        </Card>
      </div>

      {/* Filter */}
      {alertTypes.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filter:</span>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {alertTypes.map((t) => (
                <SelectItem key={t} value={t}>{vitalLabels[t] || t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Alert Timeline */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium">No alerts triggered</p>
          <p className="text-xs text-muted-foreground mt-1">
            All vital signs have been within your configured thresholds.
          </p>
          <Link to="/vital-thresholds">
            <Button variant="outline" size="sm" className="mt-3">Configure Thresholds</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <Card key={alert.id} className={`p-4 border-l-4 ${
              alert.severity === "critical" ? "border-l-red-500" : "border-l-amber-400"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  alert.severity === "critical" ? "bg-red-100" : "bg-amber-100"
                }`}>
                  {alert.direction === "high"
                    ? <TrendingUp className="w-5 h-5 text-red-600" />
                    : <TrendingDown className="w-5 h-5 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{vitalLabels[alert.type] || alert.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {moment(alert.recorded_at || alert.created_date).format("MMM D, YYYY [at] h:mm A")}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      alert.severity === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {alert.severity === "critical" ? "CRITICAL" : "WARNING"}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    <span className="text-rose-600 font-medium">
                      Reading: {formatValue(alert)}
                    </span>
                    <span className="text-muted-foreground">
                      Range: {alert.threshold.low_threshold || "—"} – {alert.threshold.high_threshold || "—"} {vitalUnits[alert.type]}
                    </span>
                  </div>

                  {alert.recovery ? (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Recovered to {alert.recovery.value} on{" "}
                      {moment(alert.recovery.date).format("MMM D, YYYY [at] h:mm A")}
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      No recovery recorded yet
                    </div>
                  )}

                  {alert.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">"{alert.notes}"</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Threshold config link */}
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600" />
          <p className="text-sm text-muted-foreground">Manage your alert thresholds</p>
        </div>
        <Link to="/vital-thresholds">
          <Button variant="outline" size="sm">Configure</Button>
        </Link>
      </Card>
    </div>
  );
}