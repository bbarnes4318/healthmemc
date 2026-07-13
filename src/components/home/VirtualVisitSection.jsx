import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Video, Stethoscope, HeartPulse, Smile, Brain, Dumbbell,
  Eye, Ear, Sparkles, Activity, ChevronRight, Shield, Dog, Bone
} from "lucide-react";

const featuredServices = [
  { title: "Virtual Doctor", desc: "Diagnosis & treatment advice", icon: Stethoscope, color: "from-sky-500 to-blue-600", route: "/ai-doctor" },
  { title: "Virtual Nurse", desc: "Care guidance & symptom triage", icon: HeartPulse, color: "from-rose-500 to-pink-600", route: "/ai-nurse" },
  { title: "Virtual Physician", desc: "Ongoing health companion", icon: Activity, color: "from-indigo-500 to-blue-600", route: "/personal-physician" },
  { title: "Virtual Specialist", desc: "Cardiology, neuro & more", icon: Brain, color: "from-violet-500 to-purple-600", route: "/specialists" },
  { title: "Virtual Dentist", desc: "Oral health & dental care", icon: Smile, color: "from-cyan-500 to-teal-600", route: "/dental-care" },
  { title: "Virtual Eye Doctor", desc: "Vision & eye exams", icon: Eye, color: "from-blue-500 to-cyan-600", route: "/eye-doctor" },
  { title: "Virtual ENT", desc: "Ear, nose & throat care", icon: Ear, color: "from-teal-500 to-green-600", route: "/ear-nose-doctor" },
  { title: "Virtual Dermatologist", desc: "Skin condition analysis", icon: Sparkles, color: "from-pink-500 to-rose-600", route: "/dermatology" },
  { title: "Virtual Fitness Coach", desc: "6 AI-powered trainers", icon: Dumbbell, color: "from-emerald-500 to-teal-600", route: "/fitness-center" },
  { title: "Virtual PT", desc: "Rehab & recovery planning", icon: Bone, color: "from-orange-500 to-amber-600", route: "/physical-therapy" },
  { title: "Virtual Veterinarian", desc: "Pet health consultations", icon: Dog, color: "from-purple-500 to-indigo-600", route: "/pet-care" },
  { title: "Virtual Senior Care", desc: "Specialized elder care", icon: Shield, color: "from-amber-500 to-orange-600", route: "/senior-care" },
];

export default function VirtualVisitSection() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-6 bg-gradient-to-br from-sky-600 to-indigo-700 text-white border-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold">Virtual Visits & Services</h2>
                <p className="text-xs text-sky-100">AI-powered health professionals — available 24/7</p>
              </div>
            </div>
            <Link to="/virtual-consultations" className="hidden sm:block">
              <Button size="sm" className="bg-white text-sky-700 hover:bg-sky-50">
                All Services <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 mt-4">
            {featuredServices.map((service, i) => {
              const Icon = service.icon;
              return (
                <Link key={service.route} to={service.route}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.03 * i }}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-3 transition-all hover:-translate-y-0.5 cursor-pointer border border-white/10"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center mb-2`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs font-semibold leading-tight">{service.title}</p>
                    <p className="text-[10px] text-sky-100 mt-0.5 line-clamp-1">{service.desc}</p>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <Link to="/virtual-consultations" className="sm:hidden flex-1">
              <Button size="sm" className="w-full bg-white text-sky-700 hover:bg-sky-50">
                View All Services <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
            <p className="text-[10px] text-sky-100">
              Choose your consultant's appearance before each session · Not a substitute for in-person care
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}