import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, ShieldAlert, LayoutDashboard, ListChecks, TrendingUp, Award, Bookmark, Camera, ClipboardList } from "lucide-react";
import SurgicalRecoveryTracker from "@/components/surgical/SurgicalRecoveryTracker";
import RecoveryMilestoneTimeline from "@/components/surgical/RecoveryMilestoneTimeline";
import SurgicalRecoveryDashboard from "@/components/surgical/SurgicalRecoveryDashboard";
import SurgicalRecoveryTrends from "@/components/surgical/SurgicalRecoveryTrends";
import RecoveryLogTemplateManager from "@/components/surgical/RecoveryLogTemplateManager";
import IncisionCheckIn from "@/components/surgical/IncisionCheckIn";
import RecoveryPlanTracker from "@/components/surgical/RecoveryPlanTracker";
import QuickDailyCheckIn from "@/components/surgical/QuickDailyCheckIn";
import SurgicalRecoveryEvaluator from "@/components/surgical/SurgicalRecoveryEvaluator";

export default function SurgicalRecoveryPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [trackerView, setTrackerView] = useState("log");

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

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 w-fit mx-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "dashboard" ? "bg-background shadow-sm text-rose-700" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab("log")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "log" ? "bg-background shadow-sm text-rose-700" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListChecks className="w-4 h-4" /> Log Entries
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "templates" ? "bg-background shadow-sm text-rose-700" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className="w-4 h-4" /> Templates
          </button>
          <button
            onClick={() => setActiveTab("trends")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "trends" ? "bg-background shadow-sm text-rose-700" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Trends
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "timeline" ? "bg-background shadow-sm text-rose-700" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="w-4 h-4" /> Timeline
          </button>
          <button
            onClick={() => setActiveTab("incision")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "incision" ? "bg-background shadow-sm text-rose-700" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Camera className="w-4 h-4" /> Incision
          </button>
          <button
            onClick={() => setActiveTab("plan")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "plan" ? "bg-background shadow-sm text-rose-700" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Recovery Plan
          </button>
        </div>

        {activeTab === "dashboard" ? (
          <div className="space-y-4">
            <QuickDailyCheckIn />
            <SurgicalRecoveryEvaluator />
            <SurgicalRecoveryDashboard />
          </div>
        ) : activeTab === "log" ? <SurgicalRecoveryTracker /> : activeTab === "trends" ? <SurgicalRecoveryTrends /> : activeTab === "templates" ? <RecoveryLogTemplateManager /> : activeTab === "incision" ? <IncisionCheckIn /> : activeTab === "plan" ? <RecoveryPlanTracker /> : <RecoveryMilestoneTimeline />}
      </motion.div>
    </div>
  );
}