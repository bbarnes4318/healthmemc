import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, X, Volume2, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const routeCommands = {
  "home": "/", "dashboard": "/dashboard", "health dashboard": "/dashboard",
  "ai doctor": "/ai-doctor", "doctor": "/ai-doctor",
  "ai nurse": "/ai-nurse", "nurse": "/ai-nurse",
  "specialists": "/specialists",
  "pharmacy": "/pharmacy",
  "records": "/records", "medical records": "/records",
  "wellness": "/wellness",
  "appointments": "/appointment-dashboard", "appointment dashboard": "/appointment-dashboard",
  "appointment history": "/appointment-history", "visit history": "/appointment-history",
  "emergency": "/emergency", "emergency room": "/emergency-room",
  "baby care": "/newborn-care", "newborn": "/newborn-care", "newborn care": "/newborn-care",
  "profile": "/profile", "settings": "/settings",
  "dental": "/dental-care", "dental care": "/dental-care",
  "physical therapy": "/physical-therapy",
  "eye doctor": "/eye-doctor",
  "ear nose": "/ear-nose-doctor", "ent": "/ear-nose-doctor",
  "dermatology": "/dermatology",
  "senior care": "/senior-care",
  "assisted living": "/assisted-living",
  "pet care": "/pet-care", "veterinary": "/pet-care",
  "sports medicine": "/sports-medicine",
  "fitness": "/fitness-center", "fitness center": "/fitness-center",
  "wellness spa": "/wellness-spa", "spa": "/wellness-spa",
  "insurance": "/insurance-tracker", "insurance tracker": "/insurance-tracker",
  "forum": "/medical-forum", "medical forum": "/medical-forum",
  "family": "/family-management", "family management": "/family-management",
  "caregiver": "/caregiver-dashboard", "caregiver dashboard": "/caregiver-dashboard",
  "immunization": "/immunization",
  "surgical recovery": "/surgical-recovery", "recovery": "/surgical-recovery",
  "trends": "/wellness-trends", "wellness trends": "/wellness-trends",
  "doctor directory": "/doctor-directory", "find doctor": "/doctor-directory",
  "about": "/about", "about us": "/about",
  "personal physician": "/personal-physician", "physician": "/personal-physician",
  "virtual consultations": "/virtual-consultations", "virtual visits": "/virtual-consultations",
};

const logCommands = {
  "new feeding": "/newborn-care", "log feeding": "/newborn-care", "add feeding": "/newborn-care",
  "new sleep": "/newborn-care", "log sleep": "/newborn-care", "add sleep": "/newborn-care",
  "new diaper": "/newborn-care", "log diaper": "/newborn-care", "add diaper": "/newborn-care",
  "new milestone": "/newborn-care", "log milestone": "/newborn-care", "add milestone": "/newborn-care",
  "new vaccine": "/newborn-care", "log vaccine": "/newborn-care", "add vaccine": "/newborn-care",
  "new growth": "/newborn-care", "log growth": "/newborn-care", "log weight": "/newborn-care", "log height": "/newborn-care",
  "new specialist": "/newborn-care", "add specialist": "/newborn-care", "add doctor": "/newborn-care",
  "new appointment": "/appointment-dashboard", "schedule appointment": "/appointment-dashboard",
  "new medication": "/pharmacy", "add medication": "/pharmacy", "log medication": "/pharmacy",
  "new record": "/records", "add record": "/records", "upload record": "/records",
  "new vital": "/dashboard", "log vital": "/dashboard", "add vital": "/dashboard",
  "new journal": "/wellness", "log journal": "/wellness", "wellness journal": "/wellness",
  "new goal": "/wellness", "set goal": "/wellness",
};

const commandHints = [
  "Go to dashboard", "Open pharmacy", "New feeding", "Log sleep",
  "New milestone", "Log weight", "Open baby care", "New medication",
];

export default function VoiceCommandMode() {
  const [active, setActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setSupported(false); return; }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);

      if (event.results[event.results.length - 1].isFinal) {
        processCommand(text.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error("Voice command error:", event.error);
      if (event.error === "no-speech") {
        setFeedback("No speech detected. Try again.");
      } else {
        setFeedback("Error: " + event.error);
      }
    };

    recognition.onend = () => {
      setActive(false);
    };

    recognitionRef.current = recognition;
    return () => { try { recognition.stop(); } catch (e) {} };
  }, []);

  const processCommand = useCallback((text) => {
    const lower = text.toLowerCase().trim();

    // Check for navigation commands
    for (const [phrase, path] of Object.entries(routeCommands)) {
      if (lower.includes("go to " + phrase) || lower.includes("open " + phrase) ||
          lower.includes("show " + phrase) || lower.includes("navigate to " + phrase) ||
          lower === phrase) {
        setFeedback(`Navigating to ${phrase}...`);
        navigate(path);
        setTimeout(() => { setFeedback(""); setTranscript(""); }, 2000);
        return;
      }
    }

    // Check for log commands
    for (const [phrase, path] of Object.entries(logCommands)) {
      if (lower.includes(phrase)) {
        setFeedback(`Opening ${phrase}...`);
        navigate(path);
        setTimeout(() => { setFeedback(""); setTranscript(""); }, 2000);
        return;
      }
    }

    // Check for call emergency
    if (lower.includes("call 911") || lower.includes("call emergency") || lower.includes("emergency call")) {
      setFeedback("Calling 911...");
      window.location.href = "tel:911";
      return;
    }

    setFeedback(`Command not recognized: "${text}". Try "go to dashboard" or "new feeding".`);
  }, [navigate]);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (active) {
      recognitionRef.current.stop();
      setActive(false);
    } else {
      setTranscript("");
      setFeedback("");
      try {
        recognitionRef.current.start();
        setActive(true);
      } catch (e) { console.error(e); }
    }
  };

  if (!supported) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggle}
        className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          active
            ? "bg-red-600 text-white animate-pulse scale-110"
            : "bg-sky-600 text-white hover:bg-sky-700 hover:scale-105"
        }`}
        title="Voice command mode"
      >
        {active ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>

      {/* Voice overlay */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-5 z-50 w-80 max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl shadow-xl border border-border p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-red-600 animate-pulse" />
                </div>
                <span className="text-sm font-semibold">Listening...</span>
              </div>
              <button onClick={toggle} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {transcript && (
              <div className="p-3 bg-sky-50 rounded-lg mb-3">
                <p className="text-xs text-muted-foreground mb-1">You said:</p>
                <p className="text-sm font-medium">"{transcript}"</p>
              </div>
            )}

            {feedback && (
              <div className="p-3 bg-emerald-50 rounded-lg mb-3 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-700 font-medium">{feedback}</p>
              </div>
            )}

            {!transcript && !feedback && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Try saying:</p>
                <div className="flex flex-wrap gap-1.5">
                  {commandHints.map((hint) => (
                    <span key={hint} className="text-[10px] px-2 py-1 bg-muted rounded-full text-muted-foreground">
                      "{hint}"
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}