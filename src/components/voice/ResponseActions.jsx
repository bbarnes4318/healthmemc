import React, { useState } from "react";
import { Volume2, Square, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResponseActions({ content, label }) {
  const [speaking, setSpeaking] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleSpeak = () => {
    if (!content) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const text = typeof content === "string"
      ? content.replace(/[#*_>`-]/g, "").replace(/\n+/g, ". ").trim()
      : JSON.stringify(content, null, 2);

    const utterance = new SpeechSynthesisUtterance(text.slice(0, 3000));
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
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
        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
        onClick={handleSpeak}
        title={speaking ? "Stop playback" : "Listen to response"}
      >
        {speaking ? <Square className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
        {speaking ? "Stop" : "Listen"}
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