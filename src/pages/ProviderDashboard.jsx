import React from "react";
import { Stethoscope, HeartPulse, FileText, Pill } from "lucide-react";
import VitalSummary from "@/components/provider/VitalSummary";
import RecentReports from "@/components/provider/RecentReports";
import MedicationSummary from "@/components/provider/MedicationSummary";

export default function ProviderDashboard() {
  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Provider Dashboard</h1>
          <p className="text-sm text-muted-foreground">Clinical overview of patient health data</p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <HeartPulse className="w-4 h-4 text-red-500" />
            <h2 className="font-display font-semibold text-base">Vital Records</h2>
          </div>
          <VitalSummary />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-sky-500" />
            <h2 className="font-display font-semibold text-base">Recent Medical Reports</h2>
          </div>
          <RecentReports />
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Pill className="w-4 h-4 text-violet-500" />
            <h2 className="font-display font-semibold text-base">Medication Summary</h2>
          </div>
          <MedicationSummary />
        </section>
      </div>
    </div>
  );
}