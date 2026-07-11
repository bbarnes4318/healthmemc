import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const PLANS = [
  {
    value: "free",
    label: "Free",
    price: 0,
    display: "Free",
    description: "Get started with essential health tools",
    features: [
      "AI symptom consultations (3/month)",
      "Basic health profile",
      "Medication tracking",
      "Appointment reminders",
    ],
    accent: "from-slate-400 to-slate-500",
  },
  {
    value: "basic",
    label: "Basic Care",
    price: 9.99,
    display: "$9.99/mo",
    description: "Everything you need for everyday health management",
    features: [
      "Unlimited AI consultations",
      "Full medical records management",
      "Vitals tracking & trends",
      "PDF health summaries",
      "Email support",
    ],
    accent: "from-sky-500 to-blue-600",
  },
  {
    value: "family",
    label: "Family",
    price: 19.99,
    display: "$19.99/mo",
    description: "Comprehensive care for your whole family",
    features: [
      "Everything in Basic Care",
      "Up to 5 family member profiles",
      "Caregiver dashboard & alerts",
      "Shared activity feed",
      "Family medication management",
    ],
    accent: "from-violet-500 to-purple-600",
    popular: true,
  },
  {
    value: "chronic_care",
    label: "Chronic Care",
    price: 29.99,
    display: "$29.99/mo",
    description: "Specialized monitoring for chronic conditions",
    features: [
      "Everything in Family",
      "Chronic condition tracking",
      "Specialist feedback portal",
      "Lab value extraction & trends",
      "Caregiver visit logs",
      "Priority email support",
    ],
    accent: "from-amber-500 to-orange-600",
  },
  {
    value: "premium",
    label: "Premium Complete",
    price: 49.99,
    display: "$49.99/mo",
    description: "The ultimate health intelligence experience",
    features: [
      "Everything in Chronic Care",
      "Priority 24/7 support",
      "Physical Medical ID Card mailed to you",
      "Advanced wellness analytics",
      "Insurance out-of-pocket estimator",
      "Doctor records portal & clinician access",
      "All future features included",
    ],
    accent: "from-emerald-500 to-teal-600",
  },
];

export default function PricingPlans({ currentTier }) {
  const [loadingTier, setLoadingTier] = useState(null);
  const { toast } = useToast();

  const handleCheckout = async (plan) => {
    if (plan.value === "free") {
      toast({ title: "Free plan", description: "The Free plan requires no payment — just sign up!" });
      return;
    }
    if (currentTier === plan.value) {
      toast({ title: "Already subscribed", description: `You're currently on the ${plan.label} plan.` });
      return;
    }

    setLoadingTier(plan.value);
    try {
      const response = await base44.functions.invoke("create-checkout", {
        item_name: `${plan.label} — Health Me Medical Center Membership`,
        price: plan.price,
      });
      if (response.data?.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
        toast({ title: "Checkout failed", description: response.data?.error || "Could not start checkout.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    }
    setLoadingTier(null);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-display font-bold">Membership Plans</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose the plan that fits your health journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {PLANS.map((plan, i) => {
          const isCurrent = currentTier === plan.value;
          const isLoading = loadingTier === plan.value;
          return (
            <motion.div
              key={plan.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={i >= 3 ? "md:col-span-2 lg:col-span-1" : ""}
            >
              <Card className={`p-6 h-full flex flex-col ${plan.popular ? "ring-2 ring-violet-500 border-violet-200" : ""} ${isCurrent ? "ring-2 ring-sky-500 bg-sky-50/30" : ""}`}>
                {plan.popular && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Crown className="w-3.5 h-3.5 text-violet-600" />
                    <span className="text-xs font-semibold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">Most Popular</span>
                  </div>
                )}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.accent} flex items-center justify-center mb-3`}>
                  <Check className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-lg">{plan.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-2xl font-display font-bold">{plan.display}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleCheckout(plan)}
                  disabled={isLoading || isCurrent}
                  variant={plan.popular ? "default" : "outline"}
                  className={`w-full ${plan.popular ? "bg-violet-600 hover:bg-violet-700" : ""}`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : isCurrent ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : null}
                  {isCurrent ? "Current Plan" : plan.value === "free" ? "Get Started" : "Subscribe"}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Secure checkout powered by Base44 Payments. Cancel anytime.
      </p>
    </section>
  );
}