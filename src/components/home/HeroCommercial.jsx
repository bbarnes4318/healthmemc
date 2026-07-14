import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2, VolumeX, Sparkles, Crown,
  Stethoscope, HeartPulse, Pill, FileText, Baby, PawPrint, Watch,
  Activity, ShieldPlus, Smile, Eye, Scan, Dumbbell, Flower2, Users,
  Siren, Syringe, TrendingUp, Video, UserRound, Ear,
  Heart, LifeBuoy, Shield, Globe, Home as HomeIcon, MessagesSquare,
} from "lucide-react";

const VIDEO_URL = "https://media.base44.com/videos/public/6a4dfc16013374d3269a9096/27ffc0b9d_Extended_Commercial.mp4";

const CHAPTERS = [
  {
    title: "AI Consultations",
    subtitle: "Talk to AI health professionals anytime, anywhere",
    icon: Stethoscope,
    color: "text-sky-400",
    services: [
      { icon: Stethoscope, title: "AI Doctor", desc: "Instant symptom analysis & AI-powered diagnoses from your complete health profile", color: "text-sky-400" },
      { icon: Video, title: "Virtual Visits", desc: "Connect with AI health professionals across 15+ medical specialties", color: "text-indigo-400" },
      { icon: UserRound, title: "AI Personal Physician", desc: "Your personalized, ongoing care companion that learns your health history", color: "text-purple-400" },
      { icon: HeartPulse, title: "AI Nurse", desc: "24/7 wellness check-ins, daily guidance & medication care reminders", color: "text-emerald-400" },
      { icon: Users, title: "AI Specialists", desc: "Cardiology, neurology, orthopedics & 15+ specialized channels", color: "text-violet-400" },
      { icon: Siren, title: "AI Emergency Room", desc: "Emergency triage & instant guidance when seconds matter most", color: "text-red-500" },
    ],
  },
  {
    title: "Specialty Care",
    subtitle: "Dedicated AI channels for every part of your body",
    icon: Smile,
    color: "text-teal-400",
    services: [
      { icon: Smile, title: "AI Dentist", desc: "Oral health monitoring, dental visit logs & interactive 3D tooth map", color: "text-teal-400" },
      { icon: Eye, title: "AI Eye Doctor", desc: "Vision exams, eye health tracking & prescription management", color: "text-cyan-400" },
      { icon: Scan, title: "3D Eye Exam", desc: "Advanced 3D eye analysis with detailed visual assessments", color: "text-blue-400" },
      { icon: Ear, title: "Ear & Nose Doctor", desc: "ENT diagnostics, hearing assessments & sinus care guidance", color: "text-purple-400" },
      { icon: Activity, title: "Ear Care", desc: "Hearing test logs, ear health tracking & preventive care tips", color: "text-fuchsia-400" },
      { icon: Scan, title: "AI Dermatology", desc: "Track moles, rashes & skin changes with side-by-side photo comparisons", color: "text-teal-400" },
      { icon: Dumbbell, title: "Physical Therapy", desc: "Recovery plans, exercise tracking & mobility goal monitoring", color: "text-orange-400" },
    ],
  },
  {
    title: "Family & Caregiving",
    subtitle: "Comprehensive care for every member of your household",
    icon: Baby,
    color: "text-pink-400",
    services: [
      { icon: Baby, title: "Newborn Care", desc: "Track baby growth, milestones, feeding logs & vaccine schedules", color: "text-pink-400" },
      { icon: Heart, title: "Senior Care", desc: "Elderly health monitoring, medication management & fall prevention", color: "text-rose-400" },
      { icon: LifeBuoy, title: "Assisted Living", desc: "Care coordination & daily living support for loved ones", color: "text-amber-400" },
      { icon: Users, title: "Family Management", desc: "Multi-member profiles, shared health feeds & record sharing", color: "text-purple-400" },
      { icon: Users, title: "Caregiver Dashboard", desc: "Visit logs, real-time alerts & shared activity tracking", color: "text-indigo-400" },
      { icon: PawPrint, title: "Veterinary Care", desc: "Complete pet health tracking, medications & wellness logs", color: "text-orange-400" },
    ],
  },
  {
    title: "Wellness & Fitness",
    subtitle: "Holistic wellness programs powered by AI",
    icon: Sparkles,
    color: "text-cyan-400",
    services: [
      { icon: Sparkles, title: "Wellness Center", desc: "Nutrition tracking, exercise logging & lifestyle goal management", color: "text-cyan-400" },
      { icon: Flower2, title: "Wellness Spa", desc: "Guided relaxation programs, mood tracking & self-care routines", color: "text-green-400" },
      { icon: Dumbbell, title: "AI Fitness Center", desc: "Personalized workout plans with progress tracking & AI coaching", color: "text-red-400" },
      { icon: Dumbbell, title: "Family Fitness Challenge", desc: "Group challenges, leaderboards & shared motivation for the family", color: "text-orange-400" },
      { icon: Dumbbell, title: "Sports Medicine", desc: "Injury recovery protocols & athletic performance optimization", color: "text-red-500" },
    ],
  },
  {
    title: "Health Management",
    subtitle: "Everything you need to manage your health in one place",
    icon: Activity,
    color: "text-blue-400",
    services: [
      { icon: Pill, title: "Pharmacy & Medications", desc: "Track prescriptions, drug interactions & get automatic refill alerts", color: "text-amber-400" },
      { icon: FileText, title: "Medical Records", desc: "Securely store, organize & share your complete medical history", color: "text-rose-400" },
      { icon: Activity, title: "Vitals & Health Tracking", desc: "Monitor heart rate, blood pressure, glucose & sleep trends over time", color: "text-blue-400" },
      { icon: Watch, title: "Wearable Sync", desc: "Auto-sync data from Oura Ring, Fitbit, Garmin & more devices daily", color: "text-violet-400" },
      { icon: Siren, title: "Vital Sign Alerts", desc: "Threshold-based notifications when vitals go out of safe range", color: "text-red-500" },
      { icon: Syringe, title: "Immunization Tracker", desc: "Vaccine records & automatic booster reminders for the whole family", color: "text-lime-400" },
      { icon: Activity, title: "Surgical Recovery", desc: "Post-op healing milestones, wound tracking & mobility goals", color: "text-rose-400" },
      { icon: TrendingUp, title: "Health Trends Explorer", desc: "Long-term analytics across vitals, wellness & wearable data", color: "text-sky-400" },
    ],
  },
  {
    title: "Tools & Resources",
    subtitle: "Smart tools to support your healthcare journey",
    icon: Shield,
    color: "text-indigo-400",
    services: [
      { icon: Shield, title: "Insurance Tracker", desc: "Manage policies, track deductibles & monitor claim statuses", color: "text-indigo-400" },
      { icon: Shield, title: "Privacy Dashboard", desc: "Full access logs, security controls & data sharing management", color: "text-blue-400" },
      { icon: TrendingUp, title: "Master Wellness", desc: "All health trends — nutrition, exercise, vitals & meds — unified", color: "text-violet-400" },
      { icon: Globe, title: "Language Directory", desc: "Essential medical phrases translated into 24+ languages", color: "text-emerald-400" },
      { icon: HomeIcon, title: "Home Doctor Visit", desc: "Request a physician to come directly to your home", color: "text-sky-400" },
      { icon: MessagesSquare, title: "Medical Forum", desc: "Connect with healthcare professionals in specialized discussion boards", color: "text-purple-400" },
    ],
  },
];

const PRICING_TIERS = [
  { label: "Free", price: "$0", desc: "3 AI consults/mo, basic profile & med tracking", accent: "from-slate-400 to-slate-500" },
  { label: "Basic Care", price: "$9.99", desc: "Unlimited consults, full records & vitals tracking", accent: "from-sky-500 to-blue-600" },
  { label: "Family", price: "$19.99", desc: "Up to 5 members, caregiver tools & shared feeds", accent: "from-violet-500 to-purple-600", popular: true },
  { label: "Chronic Care", price: "$29.99", desc: "Condition tracking, lab extraction & specialist portal", accent: "from-amber-500 to-orange-600" },
  { label: "Premium", price: "$49.99", desc: "24/7 priority support, Medical ID card & clinician access", accent: "from-emerald-500 to-teal-600" },
];

// Build a flat slides array: chapter headers + services + pricing finale
function buildSlides() {
  const slides = [];
  CHAPTERS.forEach((chapter) => {
    slides.push({ type: "chapter", ...chapter });
    chapter.services.forEach((service) => {
      slides.push({ type: "service", ...service, chapterTitle: chapter.title });
    });
  });
  slides.push({ type: "pricing" });
  return slides;
}

export default function HeroCommercial() {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = useMemo(() => buildSlides(), []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  const current = slides[slideIndex];

  // Find which chapter we're in for the progress indicator
  let chapterIndex = 0;
  for (let i = 0; i <= slideIndex; i++) {
    if (slides[i].type === "chapter") chapterIndex = CHAPTERS.findIndex((c) => c.title === slides[i].title);
  }
  const isPricing = current.type === "pricing";

  return (
    <div className="w-full space-y-4">
      {/* Video with cycling slide overlay */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full rounded-2xl overflow-hidden shadow-xl aspect-video max-h-[180px] sm:max-h-none bg-slate-900"
      >
        <video ref={videoRef} autoPlay muted loop playsInline className="w-full h-full object-cover">
          <source src={VIDEO_URL} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25 pointer-events-none" />

        {/* Slide content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pointer-events-none">
          <AnimatePresence mode="wait">
            {current.type === "chapter" && (
              <motion.div
                key={slideIndex}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-3">
                  <current.icon className={`w-8 h-8 ${current.color} drop-shadow-lg`} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Chapter {chapterIndex + 1} of {CHAPTERS.length}</p>
                <p className="text-white text-2xl sm:text-3xl font-display font-bold drop-shadow-lg">{current.title}</p>
                <p className="text-white/70 text-xs sm:text-sm mt-1.5 drop-shadow max-w-md">{current.subtitle}</p>
              </motion.div>
            )}
            {current.type === "service" && (
              <motion.div
                key={slideIndex}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-lg"
              >
                <current.icon className={`w-12 h-12 mx-auto mb-3 ${current.color} drop-shadow-lg`} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{current.chapterTitle}</p>
                <p className="text-white text-xl sm:text-2xl font-display font-bold drop-shadow-lg mb-1.5">{current.title}</p>
                <p className="text-white/75 text-xs sm:text-sm drop-shadow leading-relaxed max-w-sm mx-auto">{current.desc}</p>
              </motion.div>
            )}
            {current.type === "pricing" && (
              <motion.div
                key={slideIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-3xl"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 text-center">Membership Plans</p>
                <p className="text-white text-xl sm:text-2xl font-display font-bold drop-shadow-lg text-center mb-3">Choose Your Plan</p>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {PRICING_TIERS.map((tier) => (
                    <div key={tier.label} className={`rounded-lg p-1.5 sm:p-2 text-center ${tier.popular ? "bg-white/20 ring-1 ring-white/30" : "bg-white/5"}`}>
                      {tier.popular && <p className="text-[8px] font-bold text-amber-300 mb-0.5">★ Popular</p>}
                      <p className="text-[9px] sm:text-[10px] font-semibold text-white/80">{tier.label}</p>
                      <p className="text-sm sm:text-base font-display font-bold text-white">{tier.price}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chapter progress indicators */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
          {CHAPTERS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === chapterIndex && !isPricing ? "w-6 bg-white/80" : isPricing ? "w-1.5 bg-white/30" : "w-1.5 bg-white/30"
              }`}
            />
          ))}
          <div className={`h-1.5 rounded-full transition-all duration-300 ${isPricing ? "w-6 bg-amber-400" : "w-1.5 bg-white/30"}`} />
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

      {/* Pricing tiers cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.label}
            className={`relative rounded-xl border p-3 text-center transition-all ${
              tier.popular ? "border-violet-300 bg-violet-50 ring-1 ring-violet-200" : "border-border bg-card"
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
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{tier.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}