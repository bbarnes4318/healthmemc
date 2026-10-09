import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Sparkles,
  Stethoscope,
  Pill,
  FileText,
  HeartPulse,
  Users,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const VIDEO_URL = "https://media.base44.com/videos/public/6a4dfc16013374d3269a9096/27ffc0b9d_Extended_Commercial.mp4";

const CAPABILITIES = [
  { icon: Stethoscope, label: "AI-guided care" },
  { icon: Pill, label: "Medications" },
  { icon: FileText, label: "Records & labs" },
  { icon: HeartPulse, label: "Vitals & trends" },
  { icon: Users, label: "Family care" },
];

export default function HeroCommercial() {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  return (
    <div className="w-full space-y-4">
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-xl min-h-[430px] sm:min-h-[500px]"
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />

        <div className="relative z-10 flex min-h-[430px] sm:min-h-[500px] flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 max-w-3xl">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-sky-100 backdrop-blur-sm mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Your connected health command center
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-white leading-[1.02]">
            Your health, finally in one place.
          </h1>
          <p className="mt-5 max-w-2xl text-sm sm:text-lg leading-relaxed text-slate-200">
            Get AI-guided health support, organize medications and records, follow labs and vitals, coordinate family care, and keep recovery moving—all from one connected Health Me workspace.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/ai-doctor">
              <Button size="lg" className="bg-sky-500 text-white hover:bg-sky-400 font-semibold shadow-lg shadow-sky-950/30">
                Start an AI-Guided Visit
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                Explore Health Me
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-300">
            AI-assisted guidance is not a substitute for emergency services or hands-on care from a qualified healthcare professional.
          </p>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {CAPABILITIES.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur-sm">
                <item.icon className="w-4 h-4 text-sky-300 mb-2" />
                <p className="text-[11px] font-medium leading-tight text-white">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </motion.section>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-sm font-display font-bold text-sky-700">24/7</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">AI-guided health access</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-sm font-display font-bold text-sky-700">One workspace</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Care, records, meds & trends</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-sm font-display font-bold text-sky-700">Family-ready</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Profiles & caregiver tools</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-sm font-display font-bold text-sky-700">Connected</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">From question to follow-through</p>
        </div>
      </div>
    </div>
  );
}
