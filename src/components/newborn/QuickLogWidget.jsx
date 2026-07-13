import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Milk, Droplets, Moon, Plus, X, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_ACTIONS = [
  {
    type: "feeding",
    label: "Feeding",
    icon: Milk,
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-500",
    defaults: { feeding_type: "breast", feeding_side: "both" },
  },
  {
    type: "diaper",
    label: "Diaper",
    icon: Droplets,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-500",
    defaults: { diaper_type: "wet" },
  },
  {
    type: "sleep",
    label: "Sleep",
    icon: Moon,
    color: "from-indigo-500 to-purple-600",
    bg: "bg-indigo-500",
    defaults: { sleep_quality: "good" },
  },
];

export default function QuickLogWidget({ onLogged }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [logging, setLogging] = useState(null);

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().slice(0, 5);

  const quickLog = async (action) => {
    setLogging(action.type);
    try {
      await base44.entities.BabyDailyLog.create({
        log_type: action.type,
        date: dateStr,
        time: timeStr,
        ...action.defaults,
      });
      toast({
        title: `${action.label} logged!`,
        description: `${timeStr} · Tap to add details in the journal`,
      });
      onLogged?.();
    } catch (e) {
      toast({ title: "Failed to log", variant: "destructive" });
    }
    setLogging(null);
    setOpen(false);
  };

  return (
    <>
      {/* Floating action button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <>
              {QUICK_ACTIONS.map((action, i) => (
                <motion.div
                  key={action.type}
                  initial={{ opacity: 0, scale: 0, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, y: 10 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <button
                    onClick={() => quickLog(action)}
                    disabled={logging !== null}
                    className="flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all group disabled:opacity-50"
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                      {logging === action.type ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <action.icon className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    <span className="text-[10px] text-muted-foreground">{timeStr}</span>
                  </button>
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(!open)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-colors ${
            open ? "bg-gray-700" : "bg-gradient-to-br from-pink-500 to-rose-600"
          }`}
        >
          {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Backdrop when open */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/10"
          />
        )}
      </AnimatePresence>
    </>
  );
}