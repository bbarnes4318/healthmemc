import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2, VolumeX, Sparkles, Stethoscope, HeartPulse, Pill,
  FileText, Baby, PawPrint, Watch, Activity, ShieldPlus,
  Smile, Eye, Scan, Dumbbell, Flower2, Users, Siren,
  Syringe, TrendingUp, Video, Crown,
} from "lucide-react";

const VIDEO_URL = "https://media.base44.com/videos/public/6a4dfc16013374d3269a9096/27ffc0b9d_Extended_Commercial.mp4";

const SERVICE_FEATURES = [
  { icon: Stethoscope, title: "AI Doctor", desc: "Instant symptom analysis & personalized diagnoses from your health data", color: "text-sky-400" },
  { icon: Video, title: "Virtual Visits", desc: "Connect with AI health professionals across 15+ specialties", color: "text-indigo-400" },
  { icon: HeartPulse, title: "AI Nurse", desc: "24/7 wellness check-ins, daily guidance & care reminders", color: "text-emerald-400" },
  { icon: Pill, title: "Pharmacy & Medications", desc: "Track prescriptions, interactions & get refill alerts", color: "text-amber-400" },
  { icon: FileText, title: "Medical Records", desc: "Securely store, organize & share your complete medical history", color: "text-rose-400" },
  { icon: Activity, title: "Vitals & Health Tracking", desc: "Monitor heart rate, blood pressure, glucose & sleep trends", color: "text-blue-400" },
  { icon: Watch, title: "Wearable Sync", desc: "Auto-sync data from Oura, Fitbit, Garmin & more devices", color: "text-violet-400" },
  { icon: Baby, title: "Newborn Care", desc: "Track baby growth, milestones, feeding & vaccine schedules", color: "text-pink-400" },
  { icon: PawPrint, title: "Veterinary Care", desc: "Complete pet health tracking, medications & wellness logs", color: "text-orange-400" },
  { icon: Smile, title: "AI Dentist", desc: "Oral health monitoring, dental visit logs & 3D tooth map", color: "text-teal-400" },
  { icon: Eye, title: "AI Eye Doctor", desc: "Vision exams, eye health tracking & 3D eye analysis", color: "text-cyan-400" },
  { icon: Scan, title: "AI Dermatology", desc: "Track moles, rashes & skin changes with photo comparisons", color: "text-fuchsia-400" },
  { icon: Dumbbell, title: "Fitness & Sports Medicine", desc: "Personalized workout plans, injury recovery & performance tracking", color: "text-red-400" },
  { icon: Flower2, title: "Wellness Spa", desc: "Guided relaxation programs, mood tracking & self-care routines", color: "text-green-400" },
  { icon: Users, title: "Family Care", desc: "Multi-member profiles, caregiver dashboard & shared health feeds", color: "text-purple-400" },
  { icon: ShieldPlus, title: "24/7 Emergency Support", desc: "AI ER triage, emergency contacts & medical ID at your fingertips", color: "text-red-500" },
  { icon: Syringe, title: "Immunization Tracker", desc: "Vaccine records & automatic booster reminders for the whole family", color: "text-lime-400" },
  { icon: TrendingUp, title: "Health Trends Explorer", desc: "Long-term analytics across vitals, wellness & wearable data", color: "text-sky-400" },
];

const PRICING_TIERS = [
  { label: "Free", price: "$0", desc: "Essential tools", accent: "from-slate-400 to-slate-500" },
  { label: "Basic Care", price: "$9.99", desc: "Everyday health", accent: "from-sky-500 to-blue-600" },
  { label: "Family", price: "$19.99", desc: "Whole family care", accent: "from-violet-500 to-purple-600", popular: true },
  { label: "Chronic Care", price: "$29.99", desc: "Specialized monitoring", accent: "from-amber-500 to-orange-600" },
  { label: "Premium", price: "$49.99", desc: "Complete experience", accent: "from-emerald-500 to-teal-600" },
];

export default function HeroCommercial() {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [featureIndex, setFeatureIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % SERVICE_FEATURES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  const CurrentIcon = SERVICE_FEATURES[featureIndex].icon;
  const current = SERVICE_FEATURES[featureIndex];

  return (
    <div className="w-full space-y-4">
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20 pointer-events-none" />

        {/* Cycling service feature */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={featureIndex}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-lg"
            >
              <CurrentIcon className={`w-12 h-12 mx-auto mb-3 ${current.color} drop-shadow-lg`} />
              <p className="text-white text-xl sm:text-2xl font-display font-bold drop-shadow-lg mb-1">
                {current.title}
              </p>
              <p className="text-white/80 text-xs sm:text-sm drop-shadow leading-relaxed">
                {current.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
          {SERVICE_FEATURES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === featureIndex ? "w-6 bg-white/80" : "w-1.5 bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          <div className="text-white">
            <p className="text-xs font-medium opacity-80 tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Health Me Medical Center
            </p>
            <p className="text-base sm:text-lg font-display font-bold drop-shadow-lg">
              Smarter Healthcare. Anytime. Anywhere.
            </p>
          </div>
          <button
            onClick={toggleMute}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition shrink-0"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>

      {/* Service tags strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {SERVICE_FEATURES.map((service, i) => (
          <button
            key={service.title}
            onClick={() => setFeatureIndex(i)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 shrink-0 transition-all ${
              i === featureIndex
                ? "border-sky-300 bg-sky-50 text-sky-700"
                : "border-border bg-card text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <service.icon className={`w-3.5 h-3.5 ${i === featureIndex ? service.color : ""}`} />
            <span className="text-xs font-medium whitespace-nowrap">{service.title}</span>
          </button>
        ))}
      </div>

      {/* Pricing tiers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.label}
            className={`relative rounded-xl border p-3 text-center transition-all ${
              tier.popular
                ? "border-violet-300 bg-violet-50 ring-1 ring-violet-200"
                : "border-border bg-card"
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-violet-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                <Crown className="w-2.5 h-2.5" />
                Most Popular
              </div>
            )}
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tier.accent} mx-auto mb-2`} />
            <p className="text-xs font-semibold">{tier.label}</p>
            <p className="text-base font-display font-bold text-sky-600">
              {tier.price}
              {tier.price !== "$0" && <span className="text-[10px] text-muted-foreground font-normal">/mo</span>}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{tier.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}