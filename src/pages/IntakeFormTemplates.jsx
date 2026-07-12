import React, { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, LayoutDashboard } from "lucide-react";
import IntakeFormBuilder from "@/components/specialists/IntakeFormBuilder";
import IntakeFormDashboard from "@/components/specialists/IntakeFormDashboard";

export default function IntakeFormTemplatesPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [builderKey, setBuilderKey] = useState(0);

  const handleNewTemplate = () => {
    setActiveTab("templates");
    setBuilderKey((k) => k + 1);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold">Intake Form Templates</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create reusable forms to fill out before doctor visits</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 w-fit mx-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "dashboard" ? "bg-background shadow-sm text-violet-700" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "templates" ? "bg-background shadow-sm text-violet-700" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Templates
          </button>
        </div>

        {activeTab === "dashboard" ? (
          <IntakeFormDashboard onNewTemplate={handleNewTemplate} />
        ) : (
          <IntakeFormBuilder key={builderKey} />
        )}
      </motion.div>
    </div>
  );
}