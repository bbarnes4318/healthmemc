import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, BellRing, Clock, Pill, CheckCircle, XCircle, Loader2, AlertCircle, Info } from "lucide-react";
import { useMedicationReminders } from "@/hooks/useMedicationReminders";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function MedicationReminders() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        const profiles = await base44.entities.HealthProfile.filter({ created_by_id: u.id });
        if (profiles.length > 0) setProfile(profiles[0]);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, []);

  const remindersEnabled = profile?.notification_medications ?? false;
  const { permission, todayReminders, requestPermission } = useMedicationReminders(remindersEnabled);
  const [todayLogs, setTodayLogs] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const loadTodayLogs = async () => {
    try {
      const logs = await base44.entities.MedicationLog.filter({ scheduled_date: today });
      setTodayLogs(logs);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (remindersEnabled) loadTodayLogs(); }, [remindersEnabled, todayReminders]);

  const markDose = async (reminder, status) => {
    setActionLoading(`${reminder.key}-${status}`);
    const existing = todayLogs.find((l) => l.medication_name === reminder.medName);
    try {
      if (existing) {
        await base44.entities.MedicationLog.update(existing.id, {
          status,
          taken_at: status === "taken" ? new Date().toISOString() : null,
        });
      } else {
        await base44.entities.MedicationLog.create({
          medication_name: reminder.medName,
          scheduled_date: today,
          status,
          taken_at: status === "taken" ? new Date().toISOString() : null,
        });
      }
      await loadTodayLogs();
      toast({
        title: status === "taken" ? "Medication logged" : "Dose skipped",
        description: `${reminder.medName} marked as ${status}`,
      });
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const toggleReminders = async () => {
    const newValue = !remindersEnabled;
    try {
      if (newValue) {
        if (typeof Notification === "undefined") {
          toast({ title: "Not supported", description: "Your browser doesn't support push notifications.", variant: "destructive" });
          return;
        }
        if (Notification.permission !== "granted") {
          const result = await requestPermission();
          if (result !== "granted") {
            toast({ title: "Permission needed", description: "Please allow notifications in your browser to receive medication reminders.", variant: "destructive" });
            return;
          }
        }
      }
      const data = { notification_medications: newValue };
      if (profile) {
        await base44.entities.HealthProfile.update(profile.id, data);
        setProfile({ ...profile, notification_medications: newValue });
      } else {
        const newProfile = await base44.entities.HealthProfile.create(data);
        setProfile(newProfile);
      }
      toast({ title: newValue ? "Medication reminders enabled" : "Medication reminders disabled" });
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
      </div>
    );
  }

  const notifSupported = typeof Notification !== "undefined";

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              {remindersEnabled ? <BellRing className="w-5 h-5 text-amber-600" /> : <Bell className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <h3 className="font-semibold text-sm">Push Notification Reminders</h3>
              <p className="text-xs text-muted-foreground">Get alerted when it's time to take each medication</p>
            </div>
          </div>
          <Switch checked={remindersEnabled} onCheckedChange={toggleReminders} disabled={!notifSupported} />
        </div>

        {!notifSupported && (
          <div className="flex items-start gap-2 mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-xs text-red-800">Your browser doesn't support push notifications.</p>
          </div>
        )}
        {notifSupported && permission === "denied" && (
          <div className="flex items-start gap-2 mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-xs text-red-800">Notification permission was blocked. Please enable it in your browser settings to receive medication reminders.</p>
          </div>
        )}
        {remindersEnabled && notifSupported && permission === "granted" && (
          <div className="flex items-start gap-2 mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-800">Reminders are active. Keep this app tab open for notifications to fire at scheduled times.</p>
          </div>
        )}
      </Card>

      {remindersEnabled && todayReminders.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-sm">Today's Medication Schedule</h3>
            <span className="text-xs text-muted-foreground ml-auto">Tap ✓ to confirm taken</span>
          </div>
          <div className="space-y-2">
            {todayReminders.map((r) => {
              const now = new Date();
              const isPast = r.scheduledDate < now;
              const isDueNow = !isPast && (now - r.scheduledDate >= -60000);
              const log = todayLogs.find((l) => l.medication_name === r.medName);
              const isLogged = log?.status === "taken" || log?.status === "skipped" || log?.status === "missed";
              return (
                <div
                  key={r.key}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    log?.status === "taken" ? "bg-emerald-50 border-emerald-200" :
                    log?.status === "missed" || log?.status === "skipped" ? "bg-gray-50 border-gray-200 opacity-70" :
                    isDueNow ? "bg-amber-50 border-amber-300" : isPast ? "bg-gray-50 border-gray-200" : "bg-white border-border"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    log?.status === "taken" ? "bg-emerald-100" : isPast && !isLogged ? "bg-gray-100" : "bg-amber-100"
                  }`}>
                    {log?.status === "taken" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Pill className={`w-4 h-4 ${isPast && !isLogged ? "text-gray-400" : "text-amber-600"}`} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.medName}</p>
                    {r.dosage && <p className="text-xs text-muted-foreground">{r.dosage}</p>}
                    {log?.taken_at && <p className="text-[10px] text-emerald-600">Taken at {format(new Date(log.taken_at), "h:mm a")}</p>}
                  </div>
                  <div className="text-right shrink-0 mr-1">
                    <p className="text-sm font-semibold">{r.time}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {log?.status === "taken" ? "✓ Done" : log?.status === "missed" ? "Missed" : log?.status === "skipped" ? "Skipped" : isPast ? "Overdue" : isDueNow ? "Due now" : "Upcoming"}
                    </p>
                  </div>
                  {!isLogged && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        disabled={actionLoading === `${r.key}-taken`}
                        onClick={() => markDose(r, "taken")}
                      >
                        {actionLoading === `${r.key}-taken` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 text-red-500 border-red-200 hover:bg-red-50"
                        disabled={actionLoading === `${r.key}-missed`}
                        onClick={() => markDose(r, "missed")}
                      >
                        {actionLoading === `${r.key}-missed` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {remindersEnabled && todayReminders.length === 0 && (
        <Card className="p-8 text-center">
          <Info className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No medications with scheduled times found.</p>
          <p className="text-xs text-muted-foreground mt-1">Add time-of-day schedules (e.g., "08:00", "20:00") to your medications to receive reminders.</p>
        </Card>
      )}
    </div>
  );
}