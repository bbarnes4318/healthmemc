import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Pill, Mail, Loader2, X, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { useRefillAlerts } from "@/hooks/useRefillAlerts";
import { toast } from "@/components/ui/use-toast";

export default function RefillAlertBanner({ compact = false }) {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const { refillAlerts, loading, requestNotificationPermission } = useRefillAlerts(true);
  const [dismissed, setDismissed] = useState(new Set());
  const [requesting, setRequesting] = useState(null);
  const [notifRequested, setNotifRequested] = useState(false);

  const memberAlerts = refillAlerts.filter((m) => {
    if (!currentMemberId) return !m.family_member_id;
    return m.family_member_id === currentMemberId;
  });

  const visibleAlerts = memberAlerts.filter((m) => !dismissed.has(m.id));

  const handleRequestRefill = async (med) => {
    setRequesting(med.id);
    try {
      const user = await base44.auth.me();
      const recipient = user?.email || "";
      const subject = `Prescription Refill Request: ${med.name} ${med.dosage}`;
      const body = `Hello,

I am requesting a refill for the following prescription:

  Medication: ${med.name} ${med.dosage}
  Frequency: ${med.frequency}
  Prescribing Provider: ${med.prescribing_provider || "N/A"}
  Remaining Supply: ${med.remaining} pills (approximately ${med.daysRemaining} day${med.daysRemaining === 1 ? "" : "s"})

Please process this refill request at your earliest convenience.

Patient: ${user?.full_name || currentMemberName}
Sent from Health Me Medical Center`;

      await base44.integrations.Core.SendEmail({
        to: recipient,
        subject,
        body,
      });

      toast({
        title: "Refill request sent",
        description: `An email with your refill request for ${med.name} has been sent to ${recipient}.`,
      });
    } catch (e) {
      toast({
        title: "Failed to send refill request",
        description: e.message || "Please try again later.",
        variant: "destructive",
      });
    }
    setRequesting(null);
  };

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setNotifRequested(true);
    if (result === "granted") {
      toast({ title: "Notifications enabled", description: "You'll be alerted when medications need refilling." });
    }
  };

  if (loading || visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleAlerts.map((med) => (
        <motion.div
          key={med.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
        >
          <Card
            className={`p-3 ${
              med.isCritical
                ? "border-red-300 bg-red-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  med.isCritical ? "bg-red-100" : "bg-amber-100"
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 ${med.isCritical ? "text-red-600" : "text-amber-600"}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {med.name} <span className="text-xs font-normal text-muted-foreground">{med.dosage}</span>
                </p>
                {!compact && (
                  <p className="text-xs text-muted-foreground">
                    {med.remaining} pills left · {med.dosesPerDay}×/day ·{" "}
                    <span className={med.isCritical ? "text-red-600 font-medium" : "text-amber-700 font-medium"}>
                      {med.daysRemaining} {med.daysRemaining === 1 ? "day" : "days"} until empty
                    </span>
                  </p>
                )}
                {compact && (
                  <p className="text-xs text-muted-foreground">
                    <span className={med.isCritical ? "text-red-600 font-medium" : "text-amber-700 font-medium"}>
                      {med.daysRemaining} {med.daysRemaining === 1 ? "day" : "days"} left
                    </span>
                  </p>
                )}
              </div>
              <Button
                size="sm"
                className={`shrink-0 ${med.isCritical ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}`}
                disabled={requesting === med.id}
                onClick={() => handleRequestRefill(med)}
              >
                {requesting === med.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                )}
                Request Refill
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setDismissed((prev) => new Set([...prev, med.id]))}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}

      {!notifRequested &&
        typeof Notification !== "undefined" &&
        Notification.permission === "default" && (
          <button
            onClick={handleEnableNotifications}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Enable push notifications for refill alerts
          </button>
        )}
    </div>
  );
}