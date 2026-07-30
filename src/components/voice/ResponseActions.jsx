import React, { useState, useEffect } from "react";
import { Volume2, Square, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fishAudio } from "@/lib/fishAudio";

export default function ResponseActions({ content, label, voiceId }) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const formattedText = typeof content === "string"
    ? content.replace(/[#*_>`-]/g, "").replace(/\n+/g, ". ").trim()
    : JSON.stringify(content, null, 2);

  useEffect(() => {
    const unsubscribe = fishAudio.subscribe(({ isSpeaking, isLoading, speakingText }) => {
      if (speakingText === formattedText) {
        setSpeaking(isSpeaking);
        setLoading(isLoading);
      } else {
        setSpeaking(false);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [formattedText]);

  const handleSpeak = () => {
    if (!content) return;

    if (speaking || loading) {
      fishAudio.stop();
      setSpeaking(false);
      setLoading(false);
      return;
    }

    fishAudio.speak(formattedText, {
      voiceId,
      onStart: () => {
        setSpeaking(true);
        setLoading(false);
      },
      onEnd: () => {
        setSpeaking(false);
        setLoading(false);
      },
      onError: () => {
        setSpeaking(false);
        setLoading(false);
      },
    });
  };

  const handleDownload = () => {
    if (!content) return;
    setGenerating(true);
    const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label || "ai-response"}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setGenerating(false);
  };

  return (
    <div className="flex items-center gap-1 mt-2">
      <Button
        variant="ghost"
        size="sm"
        className={`h-6 px-2 text-[10px] ${
          speaking ? "text-sky-600 font-medium bg-sky-50" : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={handleSpeak}
        title={speaking ? "Stop Fish Audio playback" : "Listen with Fish Audio voice"}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin text-sky-600" />
        ) : speaking ? (
          <Square className="w-3 h-3 mr-1 text-sky-600 fill-sky-600" />
        ) : (
          <Volume2 className="w-3 h-3 mr-1" />
        )}
        {loading ? "Loading..." : speaking ? "Stop" : "Listen"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
        onClick={handleDownload}
        title="Download as text file"
      >
        {generating ? <Loader2 className="w-3 h-3 mr-1" /> : <Download className="w-3 h-3 mr-1" />}
        Download
      </Button>
    </div>
  );
}