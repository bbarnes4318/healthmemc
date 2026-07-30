import React, { useState, useEffect } from "react";
import { Volume2, Key, Check, Play, Square, Sparkles, Sliders, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fishAudio, FISH_AUDIO_VOICES } from "@/lib/fishAudio";

export default function FishAudioSettingsModal({ open, onOpenChange }) {
  const [activeVoiceId, setActiveVoiceId] = useState(fishAudio.getActiveVoiceId());
  const [apiKey, setApiKey] = useState(fishAudio.getApiKey());
  const [rate, setRate] = useState(fishAudio.getRate());
  const [speakingSampleId, setSpeakingSampleId] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveVoiceId(fishAudio.getActiveVoiceId());
      setApiKey(fishAudio.getApiKey());
      setRate(fishAudio.getRate());
    }
  }, [open]);

  useEffect(() => {
    const unsubscribe = fishAudio.subscribe(({ isSpeaking, speakingText }) => {
      if (!isSpeaking) {
        setSpeakingSampleId(null);
      }
    });
    return unsubscribe;
  }, []);

  const handlePreview = (voice) => {
    if (speakingSampleId === voice.id) {
      fishAudio.stop();
      setSpeakingSampleId(null);
      return;
    }

    setSpeakingSampleId(voice.id);
    const sampleText = `Hello! I am ${voice.name}, your ${voice.title} at Health Me Medical Center. How can I support your wellbeing today?`;
    fishAudio.speak(sampleText, {
      voiceId: voice.id,
      rate,
      onEnd: () => setSpeakingSampleId(null),
      onError: () => setSpeakingSampleId(null),
    });
  };

  const handleSave = () => {
    fishAudio.setActiveVoiceId(activeVoiceId);
    fishAudio.setApiKey(apiKey.trim());
    fishAudio.setRate(rate);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display font-bold text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-sm">
              🐟
            </div>
            Fish Audio Voice Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select high-fidelity Fish Audio AI voices for medical consultation, greetings, and exercise instructions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-3">
          {/* Voice Models Selection */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 block">
              Active Fish Audio Persona
            </Label>
            <div className="grid grid-cols-1 gap-2.5">
              {FISH_AUDIO_VOICES.map((voice) => {
                const isSelected = activeVoiceId === voice.id;
                const isPreviewing = speakingSampleId === voice.id;

                return (
                  <div
                    key={voice.id}
                    onClick={() => setActiveVoiceId(voice.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-sky-500 bg-sky-50/60 shadow-sm ring-1 ring-sky-500"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0 p-1 bg-white rounded-lg border border-slate-100 shadow-2xs">
                        {voice.avatar}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-slate-900 leading-none">
                            {voice.name}
                          </h4>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                            {voice.title}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {voice.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-white text-slate-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(voice);
                        }}
                        title={isPreviewing ? "Stop Sample" : "Play Sample"}
                      >
                        {isPreviewing ? (
                          <Square className="w-4 h-4 text-red-500 fill-red-500" />
                        ) : (
                          <Play className="w-4 h-4 text-sky-600 fill-sky-600 ml-0.5" />
                        )}
                      </Button>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? "bg-sky-600 border-sky-600 text-white" : "border-slate-300"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Speech Speed Control */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-600" /> Speech Rate
              </Label>
              <span className="text-xs font-medium text-slate-600">{rate}x</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground font-medium">0.8x</span>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="flex-1 accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <span className="text-[10px] text-muted-foreground font-medium">1.4x</span>
            </div>
          </div>

          {/* API Key Configuration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="fish-api-key" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" /> Fish Audio API Key
              </Label>
              <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">
                Required for Fish.Audio
              </Badge>
            </div>
            <div className="flex gap-2">
              <Input
                id="fish-api-key"
                type="password"
                placeholder="Paste your Fish.Audio API Key here..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="text-xs font-mono flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs shrink-0"
                onClick={() => {
                  fishAudio.setApiKey(apiKey.trim());
                  handlePreview(FISH_AUDIO_VOICES[0]);
                }}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-sky-600" /> Test Key
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Your API key is saved locally in your browser to authorize direct Fish.Audio TTS synthesis.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white min-w-[100px]" onClick={handleSave}>
            {savedSuccess ? (
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" /> Saved!
              </span>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
