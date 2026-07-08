import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, AlertTriangle, Heart, Users, Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Emergency() {
  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <Link to="/">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Emergency Call */}
        <Card className="p-6 bg-red-600 text-white border-0">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold">Emergency</h1>
            <p className="text-red-100 mt-1 text-sm">If this is a medical emergency, call immediately</p>
            <a href="tel:911">
              <Button className="mt-4 bg-white text-red-700 hover:bg-red-50 font-bold text-lg px-8 py-6">
                <Phone className="w-5 h-5 mr-2" />
                Call 911
              </Button>
            </a>
          </div>
        </Card>

        {/* Emergency Instructions */}
        <Card className="p-5">
          <h2 className="font-display font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            When to Call 911
          </h2>
          <ul className="space-y-2">
            {[
              "Difficulty breathing or shortness of breath",
              "Chest pain or pressure lasting more than 2 minutes",
              "Loss of consciousness or fainting",
              "Severe allergic reaction (anaphylaxis)",
              "Signs of stroke (face drooping, arm weakness, speech difficulty)",
              "Severe bleeding that won't stop",
              "Seizures",
              "Sudden severe headache with no known cause",
              "Poisoning or drug overdose",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        {/* First Aid Quick Tips */}
        <Card className="p-5">
          <h2 className="font-display font-semibold flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-rose-600" />
            First Aid Quick Tips
          </h2>
          <div className="space-y-3">
            {[
              { title: "CPR", desc: "Push hard and fast in the center of the chest. 100-120 compressions per minute. Allow full chest recoil between compressions." },
              { title: "Choking", desc: "Perform abdominal thrusts (Heimlich maneuver). Stand behind the person and give 5 quick upward thrusts." },
              { title: "Bleeding", desc: "Apply firm, direct pressure with a clean cloth. Elevate the injured area above the heart if possible." },
              { title: "Burns", desc: "Cool the burn with cool (not cold) running water for at least 10 minutes. Do not apply ice, butter, or toothpaste." },
            ].map((tip) => (
              <div key={tip.title} className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm">{tip.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Emergency Contacts */}
        <Card className="p-5">
          <h2 className="font-display font-semibold flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-sky-600" />
            Important Numbers
          </h2>
          <div className="space-y-2">
            {[
              { name: "Emergency Services", number: "911" },
              { name: "Poison Control", number: "1-800-222-1222" },
              { name: "Suicide & Crisis Lifeline", number: "988" },
              { name: "SAMHSA Helpline", number: "1-800-662-4357" },
            ].map((contact) => (
              <a key={contact.number} href={`tel:${contact.number}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition">
                <span className="text-sm font-medium">{contact.name}</span>
                <span className="text-sm text-sky-600 font-semibold">{contact.number}</span>
              </a>
            ))}
          </div>
        </Card>

        <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            This page provides general emergency guidance. In any life-threatening situation, always call your local emergency number immediately.
          </p>
        </div>
      </motion.div>
    </div>
  );
}