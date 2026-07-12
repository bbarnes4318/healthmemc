import React from "react";
import { motion } from "framer-motion";
import { Activity, ShieldAlert } from "lucide-react";
import SurgicalRecoveryTracker from "@/components/surgical/SurgicalRecoveryTracker";

export default function SurgicalRecoveryPage() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold">Surgical Recovery Tracker</h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor post-op healing, pain levels, and wound progress</p>
        </div>

        <div className="flex items-start gap-2 p-4 bg-rose-50 rounded-xl border border-rose-200 mb-6">
          <ShieldAlert className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-800">
            If you notice signs of infection (fever, increasing pain, redness, swelling, or discharge), contact your surgeon immediately.
          </p>
        </div>

        <SurgicalRecoveryTracker />
      </motion.div>
    </div>
  );
}