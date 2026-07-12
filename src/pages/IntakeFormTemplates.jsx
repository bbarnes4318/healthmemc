import React from "react";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import IntakeFormBuilder from "@/components/specialists/IntakeFormBuilder";

export default function IntakeFormTemplatesPage() {
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

        <IntakeFormBuilder />
      </motion.div>
    </div>
  );
}