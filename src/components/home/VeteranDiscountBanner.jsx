import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Check, Loader2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const VETERAN_PLANS = [
  {
    value: "basic",
    label: "Basic Care",
    regularPrice: 9.99,
    vetPrice: 7.99,
    features: ["Unlimited AI consultations", "Full records management", "Vitals tracking & trends"],
  },
  {
    value: "family",
    label: "Family",
    regularPrice: 19.99,
    vetPrice: 15.99,
    features: ["Everything in Basic Care", "Up to 5 family profiles", "Caregiver dashboard & alerts"],
  },
  {
    value: "premium",
    label: "Premium Complete",
    regularPrice: 49.99,
    vetPrice: 39.99,
    features: ["Everything in Family", "24/7 priority support", "Physical Medical ID Card mailed"],
  },
];

export default function VeteranDiscountBanner() {
  const [verified, setVerified] = useState(false);
  const [loadingTier, setLoadingTier] = useState(null);
  const { toast } = useToast();

  const handleCheckout = async (plan) => {
    setLoadingTier(plan.value);
    try {
      const response = await base44.functions.invoke("create-checkout", {
        item_name: `${plan.label} — Health Me Medical Center (Veteran Discount)`,
        price: plan.vetPrice,
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
    <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base">Military & Veteran Discount</h3>
            <p className="text-xs text-slate-300">20% off all paid plans — our commitment to those who served</p>
          </div>
        </div>

        <label className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer mb-4 hover:bg-white/10 transition-colors">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="w-4 h-4 rounded shrink-0" />
          <span className="text-xs text-slate-200">I am an active duty service member or military veteran</span>
        </label>

        <AnimatePresence>
          {verified && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <p className="text-xs text-amber-400 font-semibold mb-3">Veteran pricing unlocked — 20% off applied</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {VETERAN_PLANS.map((plan) => (
                  <div key={plan.value} className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm font-semibold">{plan.label}</p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-xl font-display font-bold text-amber-400">${plan.vetPrice}</span>
                      <span className="text-xs text-slate-400 line-through">${plan.regularPrice}</span>
                      <span className="text-xs text-slate-300">/mo</span>
                    </div>
                    <ul className="space-y-1 mt-2 mb-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[10px] text-slate-300">
                          <Check className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <Button onClick={() => handleCheckout(plan)} disabled={loadingTier === plan.value} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-9 text-xs">
                      {loadingTier === plan.value ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Subscribe <ChevronRight className="w-3 h-3 ml-0.5" /></>}
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-3">
                By checking the box, you confirm your military service status. Secure checkout powered by Base44 Payments. Cancel anytime.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}