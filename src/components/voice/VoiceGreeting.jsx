import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "voice_greeting_dismissed";

export default function VoiceGreeting({ userName }) {
  const [enabled, setEnabled] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const spokenRef = useRef(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY) === "true";
    if (dismissed) return;

    const greeting = buildGreeting(userName);

    const timer = setTimeout(() => {
      if (!window.speechSynthesis || spokenRef.current) return;
      spokenRef.current = true;
      const utterance = new SpeechSynthesisUtterance(greeting);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpoken(true);
      utterance.onerror = () => setSpoken(true);
      window.speechSynthesis.speak(utterance);
      setEnabled(true);
    }, 1200);

    return () => {
      clearTimeout(timer);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [userName]);

  const buildGreeting = (name) => {
    const hour = new Date().getHours();
    let timeGreeting;
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 18) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";

    const firstName = name ? name.split(" ")[0] : "there";

    const options = [
      `${timeGreeting}, ${firstName}. Welcome to Health Me Medical Center. Your health companion is ready. How can I help you today?`,
      `${timeGreeting}, ${firstName}. Welcome back to your health platform. Stay on top of your wellness today.`,
      `${timeGreeting}, ${firstName}. Great to see you. Remember to log your daily health updates and stay on track with your recovery.`,
      `${timeGreeting}, ${firstName}. Your health dashboard is ready. Check your medications, appointments, and wellness goals today.`,
    ];
    return options[Math.floor(Math.random() * options.length)];
  };

  const handleDismiss = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    sessionStorage.setItem(STORAGE_KEY, "true");
    setEnabled(false);
    setSpoken(true);
  };

  if (!enabled && !spoken) return null;

  if (!spoken) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white shadow-lg rounded-full pl-4 pr-2 py-2 border border-teal-200">
        <Volume2 className="w-4 h-4 text-teal-600 animate-pulse" />
        <span className="text-xs text-muted-foreground">Greeting you...</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleDismiss}>
          <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return null;
}