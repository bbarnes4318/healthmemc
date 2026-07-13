import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Stethoscope, HeartPulse, Dog, Smile, Eye, Ear, Brain,
  Dumbbell, Activity, Bone, Baby, Shield, Video, ArrowLeft, Sparkles
} from "lucide-react";
import VirtualAvatarSelector from "@/components/shared/VirtualAvatarSelector";

const virtualServices = [
  {
    id: "doctor",
    title: "Virtual Doctor",
    desc: "General health consultations, diagnosis guidance, and treatment advice",
    icon: Stethoscope,
    color: "from-sky-500 to-blue-600",
    route: "/ai-doctor",
    serviceName: "Doctor",
  },
  {
    id: "nurse",
    title: "Virtual Nurse",
    desc: "Care guidance, symptom triage, and wellness monitoring",
    icon: HeartPulse,
    color: "from-rose-500 to-pink-600",
    route: "/ai-nurse",
    serviceName: "Nurse",
  },
  {
    id: "dentist",
    title: "Virtual Dentist",
    desc: "Dental health, oral care guidance, and procedure information",
    icon: Smile,
    color: "from-cyan-500 to-teal-600",
    route: "/dental-care",
    serviceName: "Dentist",
  },
  {
    id: "vet",
    title: "Virtual Veterinarian",
    desc: "Pet health consultations, medication guidance, and care planning",
    icon: Dog,
    color: "from-purple-500 to-indigo-600",
    route: "/pet-care",
    serviceName: "Veterinarian",
  },
  {
    id: "specialist",
    title: "Virtual Specialist",
    desc: "Connect with specialists across cardiology, orthopedics, neurology & more",
    icon: Brain,
    color: "from-violet-500 to-purple-600",
    route: "/specialists",
    serviceName: "Specialist",
  },
  {
    id: "fitness",
    title: "Virtual Fitness Instructor",
    desc: "AI-powered fitness coaching with 6 specialized trainers",
    icon: Dumbbell,
    color: "from-emerald-500 to-teal-600",
    route: "/fitness-center",
    serviceName: "Fitness Instructor",
  },
  {
    id: "pt",
    title: "Virtual Physical Therapist",
    desc: "Rehabilitation guidance, exercise tracking, and recovery planning",
    icon: Bone,
    color: "from-orange-500 to-amber-600",
    route: "/physical-therapy",
    serviceName: "Physical Therapist",
  },
  {
    id: "physician",
    title: "Virtual Personal Physician",
    desc: "Your ongoing AI health companion with full medical context",
    icon: Activity,
    color: "from-indigo-500 to-blue-600",
    route: "/personal-physician",
    serviceName: "Personal Physician",
  },
  {
    id: "eye",
    title: "Virtual Eye Doctor",
    desc: "Vision health, eye exam tracking, and optical guidance",
    icon: Eye,
    color: "from-blue-500 to-cyan-600",
    route: "/eye-doctor",
    serviceName: "Eye Doctor",
  },
  {
    id: "ent",
    title: "Virtual ENT Specialist",
    desc: "Ear, nose, and throat health consultations",
    icon: Ear,
    color: "from-teal-500 to-green-600",
    route: "/ear-nose-doctor",
    serviceName: "ENT Specialist",
  },
  {
    id: "dermatology",
    title: "Virtual Dermatologist",
    desc: "Skin condition analysis and dermatological guidance",
    icon: Sparkles,
    color: "from-pink-500 to-rose-600",
    route: "/dermatology",
    serviceName: "Dermatologist",
  },
  {
    id: "senior",
    title: "Virtual Senior Care",
    desc: "Specialized care guidance for seniors and aging adults",
    icon: Shield,
    color: "from-amber-500 to-orange-600",
    route: "/senior-care",
    serviceName: "Senior Care Specialist",
  },
];

export default function VirtualConsultations() {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold">Virtual Consultations</h1>
          <p className="text-muted-foreground mt-1 text-sm">Speak virtually with AI-powered health professionals — choose your consultant's appearance</p>
        </div>

        {selectedService ? (
          <VirtualAvatarSelector
            serviceName={selectedService.serviceName}
            onSelect={() => {
              window.location.href = selectedService.route;
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {virtualServices.map((service, i) => {
                const Icon = service.icon;
                return (
                  <motion.div key={service.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => setSelectedService(service)}>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-3`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="font-display font-bold text-sm">{service.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{service.desc}</p>
                      <div className="flex items-center gap-1 mt-3 text-xs text-sky-600 font-medium">
                        <Video className="w-3.5 h-3.5" /> Start Consultation
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-start gap-2 p-4 bg-sky-50 rounded-xl border border-sky-200">
              <Video className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
              <p className="text-xs text-sky-800">
                All virtual consultations are AI-powered and available 24/7. Choose your consultant's gender and race/ethnicity before each session for a personalized experience. These services provide general guidance and are not a substitute for in-person medical care.
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}