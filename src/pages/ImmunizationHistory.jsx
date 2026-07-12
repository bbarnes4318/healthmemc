import React from "react";
import { motion } from "framer-motion";
import { Syringe, ShieldAlert } from "lucide-react";
import ImmunizationHistory from "@/components/immunization/ImmunizationHistory";

export default function ImmunizationPage() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
            <Syringe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold">Immunization History</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track vaccinations, batch numbers, and booster schedules</p>
        </div>

        <div className="flex items-start gap-2 p-4 bg-emerald-50 rounded-xl border border-emerald-200 mb-6">
          <ShieldAlert className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-800">
            Keep your vaccine records up to date. You'll receive automatic booster reminders when a vaccine is due.
          </p>
        </div>

        <ImmunizationHistory />
      </motion.div>
    </div>
  );
}