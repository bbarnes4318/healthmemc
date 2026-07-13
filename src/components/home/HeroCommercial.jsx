import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

const VIDEO_URL = "https://media.base44.com/videos/public/6a4dfc16013374d3269a9096/8d754cc1f_Health_Me_Commercial.mp4";

export default function HeroCommercial() {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  return (
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
        <div className="text-white">
          <p className="text-xs font-medium opacity-80 tracking-wide">Health Me Medical Center</p>
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
  );
}