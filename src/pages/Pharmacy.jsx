import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pill, Search, Loader2, AlertTriangle, Info, RefreshCw,
  Shield, Activity, Bell, Package, BarChart3, Receipt
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import AdherenceTracker from "@/components/pharmacy/AdherenceTracker";
import AdherenceAnalytics from "@/components/pharmacy/AdherenceAnalytics";
import MedicationSupplyAlert from "@/components/pharmacy/MedicationSupplyAlert";
import MedicationReminders from "@/components/pharmacy/MedicationReminders";
import MedicationManager from "@/components/pharmacy/MedicationManager";
import RefillActionPanel from "@/components/pharmacy/RefillActionPanel";
import PharmacyExpenseTracker from "@/components/pharmacy/PharmacyExpenseTracker";

export default function Pharmacy() {
  const [searchQuery, setSearchQuery] = useState("");
  const [interactionDrugs, setInteractionDrugs] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("lookup");

  const searchMedication = async (overrideQuery) => {
    const query = overrideQuery || searchQuery;
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide comprehensive information about the medication "${query}". Include: generic name, brand names, drug class, common dosages, indications, side effects (common and serious), warnings, contraindications, and generic alternatives if available. Format with clear headers. Add a disclaimer that this is for informational purposes only.`,
        add_context_from_internet: true,
        model: "gemini_3_flash"
      });
      setResult(response);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const searchMedicationFor = (query) => searchMedication(query);

  const checkInteractions = async () => {
    if (!interactionDrugs.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Check for drug interactions between the following medications: ${interactionDrugs}. List each interaction with severity (major, moderate, minor), describe what happens, and give clinical significance. If no interactions found, say so. Include a disclaimer to consult a pharmacist or physician.`,
        add_context_from_internet: true,
        model: "gemini_3_flash"
      });
      setResult(response);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold">AI Pharmacy</h1>
          <p className="text-muted-foreground mt-1 text-sm">Medication information, interactions, and safety</p>
        </div>

        <div className="mb-6">
          <MedicationSupplyAlert />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-8 mb-6">
            <TabsTrigger value="medications"><Pill className="w-3.5 h-3.5 mr-1" />My Meds</TabsTrigger>
            <TabsTrigger value="refills"><Package className="w-3.5 h-3.5 mr-1" />Refills</TabsTrigger>
            <TabsTrigger value="receipts"><Receipt className="w-3.5 h-3.5 mr-1" />Receipts</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="w-3.5 h-3.5 mr-1" />Analytics</TabsTrigger>
            <TabsTrigger value="lookup">Lookup</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="adherence"><Activity className="w-3.5 h-3.5 mr-1" />Adherence</TabsTrigger>
            <TabsTrigger value="reminders"><Bell className="w-3.5 h-3.5 mr-1" />Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="medications">
            <MedicationManager />
          </TabsContent>

          <TabsContent value="refills">
            <RefillActionPanel />
          </TabsContent>

          <TabsContent value="receipts">
            <PharmacyExpenseTracker />
          </TabsContent>

          <TabsContent value="analytics">
            <AdherenceAnalytics />
          </TabsContent>

          <TabsContent value="lookup">
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-3">Search for a medication</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter medication name (e.g., Lisinopril)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") searchMedication(); }}
                />
                <Button onClick={() => searchMedication()} disabled={!searchQuery.trim() || loading} className="bg-amber-600 hover:bg-amber-700">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="interactions">
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-3">Check drug interactions</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter medications separated by commas (e.g., Aspirin, Warfarin)"
                  value={interactionDrugs}
                  onChange={(e) => setInteractionDrugs(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") checkInteractions(); }}
                />
                <Button onClick={checkInteractions} disabled={!interactionDrugs.trim() || loading} className="bg-amber-600 hover:bg-amber-700">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="adherence">
            <AdherenceTracker />
          </TabsContent>

          <TabsContent value="reminders">
            <MedicationReminders />
          </TabsContent>
        </Tabs>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-5 mt-6">
              <ReactMarkdown className="prose prose-sm max-w-none">{result}</ReactMarkdown>
            </Card>
            <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200 mt-4">
              <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                This information is for educational purposes only. Always consult your pharmacist or physician before making medication decisions.
              </p>
            </div>
          </motion.div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[
            { label: "Side Effects", icon: AlertTriangle, desc: "Common & serious" },
            { label: "Generic Alternatives", icon: RefreshCw, desc: "Cost-saving options" },
            { label: "Dosage Guide", icon: Info, desc: "Proper usage" },
            { label: "Allergy Check", icon: Shield, desc: "Safety screening" },
          ].map((item) => (
            <Card key={item.label} className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => { setSearchQuery(item.label); setActiveTab("lookup"); setTimeout(() => searchMedicationFor(item.label), 100); }}>
              <item.icon className="w-5 h-5 text-amber-600 mb-2" />
              <h4 className="text-sm font-semibold">{item.label}</h4>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}