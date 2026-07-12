import React from "react";
import { motion } from "framer-motion";
import { Users, UserPlus } from "lucide-react";
import FamilyManagement from "@/components/family/FamilyManagement";
import FamilyCareDashboard from "@/components/family/FamilyCareDashboard";

export default function FamilyManagementPage() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold">Family Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage profiles for your children, parents, and dependents — linked to your dashboard</p>
        </div>

        <FamilyCareDashboard />
        <FamilyManagement />
      </motion.div>
    </div>
  );
}