import React, { useState, useEffect } from "react";
import { Volume2, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fishAudio } from "@/lib/fishAudio";
import FishAudioSettingsModal from "@/components/voice/FishAudioSettingsModal";

export default function VoiceSelectorButton({ className }) {
  const [activeVoice, setActiveVoice] = useState(fishAudio.getActiveVoice());
  const [modalOpen, setModalOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(fishAudio.isSpeaking);

  useEffect(() => {
    const unsubscribe = fishAudio.subscribe(({ activeVoice, isSpeaking }) => {
      setActiveVoice(activeVoice);
      setIsSpeaking(isSpeaking);
    });
    return unsubscribe;
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setModalOpen(true)}
        className={`h-9 px-2.5 rounded-lg border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-slate-700 gap-1.5 transition-all text-xs ${className || ""}`}
        title="Fish Audio Voice Settings"
      >
        <span className="text-sm shrink-0">{activeVoice.avatar}</span>
        <span className="font-medium hidden sm:inline text-slate-800">{activeVoice.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold uppercase tracking-wider hidden md:inline">
          Fish.audio
        </span>
        {isSpeaking ? (
          <Volume2 className="w-3.5 h-3.5 text-sky-600 animate-pulse ml-0.5" />
        ) : (
          <Settings className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        )}
      </Button>

      <FishAudioSettingsModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
