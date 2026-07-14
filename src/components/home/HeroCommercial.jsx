import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Stethoscope, Pill, FileText, HeartPulse, Baby, PawPrint, Watch, Activity, ShieldPlus, Sparkles } from "lucide-react";

const VIDEO_URL = "https://media.base44.com/videos/public/6a4dfc16013374d3269a9096/27ffc0b9d_Extended_Commercial.mp4";

const SERVICE_HIGHLIGHTS = [
  { icon: Stethoscope, label: "AI Doctor & Nurse", color: "text-sky-400" },
  { icon: Pill, label: "Pharmacy & Medications", color: "text-emerald-400" },
  { icon: FileText, label: "Medical Records", color: "text-blue-400" },
  { icon: HeartPulse, label: "Vitals & Health Tracking", color: "text-rose-400" },
  { icon: Baby, label: "Newborn Care", color: "text-pink-400" },
  { icon: PawPrint, label: "Veterinary Care", color: "text-amber-400" },
  { icon: Watch, label: "Wearable Sync", color: "text-violet-400" },
  { icon: Activity, label: "Fitness & Wellness Spa", color: "text-teal-400" },
  { icon: ShieldPlus, label: "24/7 Emergency Support", color: "text-red-400" },
];

const PRICING_TIERS = [
  { label: "Free", price: "$0", accent: "from-slate-400 to-slate-500" },
  { label: "Basic Care", price: "$9.99", accent: "from-sky-500 to-blue-600" },
  { label: "Family", price: "$19.99", accent: "from-violet-500 to-purple-600", popular: true },
  { label: "Chronic Care", price: "$29.99", accent: "from-amber-500 to-orange-600" },
  { label: "Premium", price: "$49.99", accent: "from-emerald-500 to-teal-600" },
];

export default function HeroCommercial() {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [serviceIndex, setServiceIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setServiceIndex((prev) => (prev + 1) % SERVICE_HIGHLIGHTS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  const CurrentIcon = SERVICE_HIGHLIGHTS[serviceIndex].icon;

  return (
    <div className="w-full space-y-3">
      {/* Video with cycling service overlay */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full rounded-2xl overflow-hidden shadow-xl aspect-video bg-slate-900"
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 pointer-events-none" />

        {/* Cycling service highlight */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={serviceIndex}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="text-center px-4"
            >
              <CurrentIcon className={`w-10 h-10 mx-auto mb-2 ${SERVICE_HIGHLIGHTS[serviceIndex].color} drop-shadow-lg`} />
              <p className="text-white text-lg sm:text-xl font-display font-bold drop-shadow-lg">
                {SERVICE_HIGHLIGHTS[serviceIndex].label}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          <div className="text-white">
            <p className="text-xs font-medium opacity-80 tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Health Me Medical Center
            </p>
            <p className="text-base sm:text-lg font-display font-bold drop-shadow-lg">Smarter Healthcare. Anytime. Anywhere.</p>
          </div>
          <button
            onClick={toggleMute}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition shrink-0"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>

      {/* Pricing tiers strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.label}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 shrink-0 ${tier.popular ? "border-violet-300 bg-violet-50" : "border-border bg-card"}`}
          >
            <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${tier.accent} flex items-center justify-center shrink-0`}>
              <span className="text-[9px] font-bold text-white">{tier.label[0]}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight">{tier.label}</p>
              <p className="text-xs text-muted-foreground leading-tight">
                {tier.price}{tier.price !== "$0" && <span className="text-[10px]">/mo</span>}
              </p>
            </div>
            {tier.popular && (
              <span className="text-[9px] font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded-full shrink-0">★</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}