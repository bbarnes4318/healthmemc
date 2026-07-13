import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingDown, CheckCircle2, Info } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from "recharts";
import { motion } from "framer-motion";

const coverageData = [
  {
    category: "Monthly Premium",
    traditional: 650,
    aiPlatform: 29.99,
    traditionalLabel: "$650",
    aiLabel: "$29.99",
  },
  {
    category: "Annual Deductible",
    traditional: 3000,
    aiPlatform: 0,
    traditionalLabel: "$3,000",
    aiLabel: "$0",
  },
  {
    category: "Per-Visit Copay",
    traditional: 45,
    aiPlatform: 0,
    traditionalLabel: "$45",
    aiLabel: "$0",
  },
  {
    category: "Specialist Visit",
    traditional: 85,
    aiPlatform: 0,
    aiLabel: "$0",
    traditionalLabel: "$85",
  },
  {
    category: "ER Visit",
    traditional: 500,
    aiPlatform: 0,
    aiLabel: "$0",
    traditionalLabel: "$500",
  },
  {
    category: "Annual Out-of-Pocket",
    traditional: 8500,
    aiPlatform: 360,
    aiLabel: "$360",
    traditionalLabel: "$8,500",
  },
];

const featureComparison = [
  {
    feature: "24/7 AI Doctor Access",
    traditional: false,
    ai: true,
    note: "Traditional: limited to business hours + appointment",
  },
  {
    feature: "Unlimited Consultations",
    traditional: false,
    ai: true,
    note: "Traditional: subject to copay & scheduling",
  },
  {
    feature: "AI Nurse Daily Check-ins",
    traditional: false,
    ai: true,
  },
  {
    feature: "Medication Interaction Alerts",
    traditional: "Limited",
    ai: true,
  },
  {
    feature: "Lab Result OCR & Trend Tracking",
    traditional: false,
    ai: true,
  },
  {
    feature: "Surgical Recovery Tracking",
    traditional: false,
    ai: true,
  },
  {
    feature: "Family Health Management",
    traditional: "Add-on",
    ai: true,
  },
  {
    feature: "Emergency Preparedness Kit",
    traditional: false,
    ai: true,
  },
  {
    feature: "Insurance Claims Tracker",
    traditional: false,
    ai: true,
  },
  {
    feature: "In-Person Specialist Referrals",
    traditional: true,
    ai: true,
    note: "AI platform bridges to physical network",
  },
  {
    feature: "Hospital Admissions",
    traditional: true,
    ai: "Referral",
    note: "AI triages; refers to partner hospitals",
  },
  {
    feature: "Prescription Fulfillment",
    traditional: true,
    ai: "Referral",
  },
];

export default function InsuranceCoverageChart() {
  const [view, setView] = useState("cost");

  const annualSavings = coverageData
    .filter((d) => d.category === "Annual Out-of-Pocket")
    .reduce((sum, d) => sum + (d.traditional - d.aiPlatform), 0);

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-sky-600" />
          <h2 className="text-2xl font-display font-bold">AI Health Coverage vs. Traditional Medical Insurance</h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          A transparent breakdown of what you pay with Health Me Medical Center compared to standard medical insurance plans.
          The AI platform handles prevention, monitoring, and triage — traditional insurance covers hospital & specialist procedures.
        </p>
      </div>

      {/* Savings highlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6"
      >
        <Card className="p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8" />
              <div>
                <p className="text-sm text-emerald-50">Estimated Annual Savings</p>
                <p className="text-3xl font-display font-bold">${annualSavings.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-50">vs. Traditional Insurance</p>
              <p className="text-lg font-semibold">{Math.round((annualSavings / 8500) * 100)}% lower cost</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Toggle */}
      <div className="flex justify-center gap-2 mb-6">
        <Button
          size="sm"
          variant={view === "cost" ? "default" : "outline"}
          onClick={() => setView("cost")}
        >
          Cost Comparison
        </Button>
        <Button
          size="sm"
          variant={view === "features" ? "default" : "outline"}
          onClick={() => setView("features")}
        >
          Coverage Features
        </Button>
      </div>

      {view === "cost" ? (
        <Card className="p-6">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={coverageData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
                angle={-20}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                formatter={(value, name) => [`$${value.toLocaleString()}`, name === "traditional" ? "Traditional Insurance" : "Health Me AI Platform"]}
              />
              <Legend
                formatter={(value) => value === "traditional" ? "Traditional Insurance" : "Health Me AI Platform"}
                wrapperStyle={{ fontSize: 12 }}
              />
              <ReferenceLine y={0} stroke="#000" />
              <Bar dataKey="traditional" fill="#ef4444" radius={[4, 4, 0, 0]} name="traditional" />
              <Bar dataKey="aiPlatform" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="aiPlatform" />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <h4 className="font-semibold text-sm text-red-700 mb-2">Traditional Medical Insurance</h4>
              <ul className="space-y-1.5 text-xs text-red-800">
                <li>• Avg. employer plan: $650/mo premium ($7,800/yr)</li>
                <li>• Deductible: $2,000–$5,000 before coverage kicks in</li>
                <li>• Copays for every visit ($30–$85)</li>
                <li>• ER visits: $400–$1,200 out-of-pocket</li>
                <li>• Specialist wait times: 2–6 weeks</li>
                <li>• Annual out-of-pocket max: ~$8,500</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
              <h4 className="font-semibold text-sm text-sky-700 mb-2">Health Me AI Platform</h4>
              <ul className="space-y-1.5 text-xs text-sky-800">
                <li>• Plans from $9.99–$49.99/mo (avg. $29.99)</li>
                <li>• $0 deductible — coverage starts immediately</li>
                <li>• $0 copay for all AI consultations</li>
                <li>• AI ER triage: 24/7, $0 per assessment</li>
                <li>• Instant AI specialist access — no wait</li>
                <li>• Annual cost: ~$360 (96% less)</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>How they work together:</strong> Health Me AI handles prevention, monitoring, triage, and day-to-day health management.
              Traditional insurance remains valuable for hospitalizations, surgeries, and in-person specialist procedures.
              Many users pair both — using AI for 80%+ of health needs and insurance only for major events, dramatically reducing total healthcare spend.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold">Feature</th>
                <th className="text-center py-3 px-2 font-semibold text-red-600">Traditional Insurance</th>
                <th className="text-center py-3 px-2 font-semibold text-sky-600">Health Me AI</th>
              </tr>
            </thead>
            <tbody>
              {featureComparison.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                  <td className="py-2.5 px-2">
                    <p className="font-medium text-xs">{row.feature}</p>
                    {row.note && <p className="text-[10px] text-muted-foreground mt-0.5">{row.note}</p>}
                  </td>
                  <td className="text-center py-2.5 px-2">
                    {row.traditional === true ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                    ) : row.traditional === false ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">{row.traditional}</Badge>
                    )}
                  </td>
                  <td className="text-center py-2.5 px-2">
                    {row.ai === true ? (
                      <CheckCircle2 className="w-4 h-4 text-sky-600 mx-auto" />
                    ) : row.ai === false ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">{row.ai}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  );
}