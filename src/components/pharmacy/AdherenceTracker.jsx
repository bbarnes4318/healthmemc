import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, TrendingUp, Pill } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell
} from "recharts";
import { format, subDays, isSameDay } from "date-fns";

export default function AdherenceTracker() {
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const loadData = async () => {
    try {
      const [meds, allLogs] = await Promise.all([
        base44.entities.Medication.filter({ active: true }),
        base44.entities.MedicationLog.filter({}),
      ]);
      setMedications(meds);
      setLogs(allLogs);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const todayLogs = useMemo(
    () => logs.filter((l) => l.scheduled_date === today),
    [logs, today]
  );

  const chartData = useMemo(() => {
    const expectedPerDay = medications.length || 1;
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayLogs = logs.filter((l) => l.scheduled_date === format(date, "yyyy-MM-dd"));
      const taken = dayLogs.filter((l) => l.status === "taken").length;
      const missed = dayLogs.filter((l) => l.status === "missed").length;
      const isToday = isSameDay(date, new Date());
      const pending = isToday ? Math.max(0, expectedPerDay - taken - missed) : Math.max(0, expectedPerDay - taken - missed);
      return {
        day: format(date, "EEE"),
        taken,
        missed: isToday ? missed : missed + pending,
        pending: isToday ? pending : 0,
      };
    });
  }, [logs, medications]);

  const adherenceRate = useMemo(() => {
    const totalTaken = chartData.reduce((s, d) => s + d.taken, 0);
    const totalExpected = (medications.length || 1) * 7;
    return Math.round((totalTaken / totalExpected) * 100);
  }, [chartData, medications]);

  const markDose = async (med, status) => {
    setActionLoading(`${med.id}-${status}`);
    const existing = todayLogs.find((l) => l.medication_name === med.name);
    try {
      if (existing) {
        await base44.entities.MedicationLog.update(existing.id, {
          status,
          taken_at: status === "taken" ? new Date().toISOString() : null,
        });
      } else {
        await base44.entities.MedicationLog.create({
          medication_name: med.name,
          scheduled_date: today,
          status,
          taken_at: status === "taken" ? new Date().toISOString() : null,
        });
      }

      if (status === "missed") {
        try {
          const contacts = await base44.entities.TrustedContact.filter({ status: "active", alert_missed_medications: true });
          if (contacts.length > 0) {
            await Promise.all(contacts.map((c) =>
              base44.integrations.Core.SendEmail({
                to: c.email,
                subject: "Missed Medication Alert — Health Me Medical Center",
                body: `This is an automated alert from Health Me Medical Center.\n\nA medication dose was marked as missed:\n\nMedication: ${med.name}\nDosage: ${med.dosage}\nFrequency: ${med.frequency}\nScheduled Date: ${format(new Date(), "MMMM d, yyyy")}\nTime Marked: ${new Date().toLocaleTimeString()}\n\nPlease follow up with the patient to ensure they take their medication.\n\n— Health Me Medical Center`,
              })
            ));
          }
        } catch (e) { console.error("Failed to send missed dose alert:", e); }
      }

      await loadData();
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
      </div>
    );
  }

  if (medications.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Pill className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No active medications found. Add medications in your Profile to start tracking adherence.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Adherence Summary */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-sm">7-Day Adherence Overview</h3>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${adherenceRate >= 80 ? "text-green-600" : adherenceRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
              {adherenceRate}%
            </div>
            <p className="text-xs text-muted-foreground">adherence rate</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="taken" stackId="a" fill="#22c55e" name="Taken" radius={[0, 0, 0, 0]} />
            <Bar dataKey="missed" stackId="a" fill="#ef4444" name="Missed" radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" stackId="a" fill="#d1d5db" name="Pending" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Today's Doses */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3">Today's Doses — {format(new Date(), "MMM d")}</h3>
        <div className="space-y-2">
          {medications.map((med) => {
            const log = todayLogs.find((l) => l.medication_name === med.name);
            return (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">{med.name}</p>
                  <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency}</p>
                  {log?.taken_at && (
                    <p className="text-xs text-green-600 mt-0.5">
                      Taken at {format(new Date(log.taken_at), "h:mm a")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={log?.status === "taken" ? "default" : "outline"}
                    className={log?.status === "taken" ? "bg-green-600 hover:bg-green-700" : "text-green-600 border-green-300"}
                    disabled={actionLoading === `${med.id}-taken`}
                    onClick={() => markDose(med, "taken")}
                  >
                    {actionLoading === `${med.id}-taken` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant={log?.status === "missed" ? "default" : "outline"}
                    className={log?.status === "missed" ? "bg-red-600 hover:bg-red-700" : "text-red-600 border-red-300"}
                    disabled={actionLoading === `${med.id}-missed`}
                    onClick={() => markDose(med, "missed")}
                  >
                    {actionLoading === `${med.id}-missed` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}