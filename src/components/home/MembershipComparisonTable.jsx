import React from "react";
import { Check, X, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";

const PLANS = [
  { value: "free", label: "Free", price: "$0" },
  { value: "basic", label: "Basic Care", price: "$9.99" },
  { value: "family", label: "Family", price: "$19.99", popular: true },
  { value: "chronic_care", label: "Chronic Care", price: "$29.99" },
  { value: "premium", label: "Premium", price: "$49.99" },
];

// rows: { feature, plans: [free, basic, family, chronic, premium] }
// value can be true (check), false (x), or a string
const COMPARISON_ROWS = [
  {
    category: "AI Consultations",
    rows: [
      { feature: "AI symptom consultations", plans: ["3/month", true, true, true, true] },
      { feature: "AI Doctor & AI Nurse", plans: [false, true, true, true, true] },
      { feature: "AI Personal Physician", plans: [false, false, true, true, true] },
      { feature: "AI Specialists (Cardio, Neuro, etc.)", plans: [false, true, true, true, true] },
      { feature: "AI ER & Emergency Triage", plans: [false, false, true, true, true] },
      { feature: "AI Dentist, Eye & Dermatology", plans: [false, false, true, true, true] },
    ],
  },
  {
    category: "Health Management",
    rows: [
      { feature: "Basic health profile", plans: [true, true, true, true, true] },
      { feature: "Medication tracking & reminders", plans: [true, true, true, true, true] },
      { feature: "Full medical records management", plans: [false, true, true, true, true] },
      { feature: "Vitals tracking & trends", plans: [false, true, true, true, true] },
      { feature: "Lab value extraction & trends", plans: [false, false, false, true, true] },
      { feature: "Chronic condition tracking", plans: [false, false, false, true, true] },
    ],
  },
  {
    category: "Family & Caregiving",
    rows: [
      { feature: "Family member profiles", plans: [false, false, "Up to 5", "Up to 5", "Unlimited"] },
      { feature: "Caregiver dashboard & alerts", plans: [false, false, true, true, true] },
      { feature: "Shared family activity feed", plans: [false, false, true, true, true] },
      { feature: "Family medication management", plans: [false, false, true, true, true] },
      { feature: "Newborn care & milestones", plans: [false, false, true, true, true] },
      { feature: "Pet care & veterinary tracking", plans: [false, false, true, true, true] },
    ],
  },
  {
    category: "Wellness & Fitness",
    rows: [
      { feature: "Nutrition & exercise tracking", plans: [false, true, true, true, true] },
      { feature: "Wellness spa & guided programs", plans: [false, false, true, true, true] },
      { feature: "AI fitness planner", plans: [false, false, true, true, true] },
      { feature: "Wearable device sync", plans: [false, false, true, true, true] },
      { feature: "Advanced wellness analytics", plans: [false, false, false, false, true] },
    ],
  },
  {
    category: "Reports & Sharing",
    rows: [
      { feature: "PDF health summaries", plans: [false, true, true, true, true] },
      { feature: "Appointment reminders", plans: [true, true, true, true, true] },
      { feature: "Specialist feedback portal", plans: [false, false, false, true, true] },
      { feature: "Caregiver visit logs", plans: [false, false, false, true, true] },
      { feature: "Doctor records portal & clinician access", plans: [false, false, false, false, true] },
    ],
  },
  {
    category: "Premium Perks",
    rows: [
      { feature: "Email support", plans: [false, true, true, true, true] },
      { feature: "Priority email support", plans: [false, false, false, true, true] },
      { feature: "Priority 24/7 support", plans: [false, false, false, false, true] },
      { feature: "Insurance out-of-pocket estimator", plans: [false, false, false, false, true] },
      { feature: "Physical Medical ID Card mailed", plans: [false, false, false, false, true] },
      { feature: "All future features included", plans: [false, false, false, false, true] },
    ],
  },
];

function Cell({ value }) {
  if (value === true) return <Check className="w-4 h-4 text-emerald-600 mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-gray-300 mx-auto" />;
  return <span className="text-xs font-medium text-gray-700">{value}</span>;
}

export default function MembershipComparisonTable() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-bold">Plan Comparison</h2>
        <p className="text-sm text-muted-foreground mt-1">Compare every feature side-by-side to find your perfect plan</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Header */}
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-display font-semibold sticky left-0 bg-card z-10 min-w-[200px]">Features</th>
                {PLANS.map((plan) => (
                  <th key={plan.value} className="p-4 text-center min-w-[120px]">
                    {plan.popular && (
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Crown className="w-3 h-3 text-violet-600" />
                        <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded-full">Popular</span>
                      </div>
                    )}
                    <p className="font-display font-bold">{plan.label}</p>
                    <p className="text-lg font-display font-bold text-sky-600 mt-0.5">{plan.price}</p>
                    {plan.price !== "$0" && <p className="text-[10px] text-muted-foreground">per month</p>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((section) => (
                <React.Fragment key={section.category}>
                  <tr className="bg-muted/50">
                    <td colSpan={PLANS.length + 1} className="p-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground sticky left-0 bg-muted/50 z-10">
                      {section.category}
                    </td>
                  </tr>
                  {section.rows.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                      <td className="p-3 px-4 text-left font-medium sticky left-0 bg-inherit z-10">{row.feature}</td>
                      {row.plans.map((value, j) => (
                        <td key={j} className="p-3 text-center">
                          <Cell value={value} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-4">
        All plans include appointment reminders and medication tracking. Secure checkout powered by Base44 Payments. Cancel anytime.
      </p>
    </section>
  );
}