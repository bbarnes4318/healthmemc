import React, { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ear, Check, X, RefreshCw, Volume2, AlertTriangle } from "lucide-react";

const testFrequencies = [
  { freq: 250, label: "250 Hz", desc: "Low bass" },
  { freq: 500, label: "500 Hz", desc: "Low-mid" },
  { freq: 1000, label: "1 kHz", desc: "Mid" },
  { freq: 2000, label: "2 kHz", desc: "Mid-high" },
  { freq: 4000, label: "4 kHz", desc: "High" },
  { freq: 8000, label: "8 kHz", desc: "Very high" },
];

export default function HearingExam() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [ear, setEar] = useState("right");
  const audioCtxRef = useRef(null);

  const playTone = useCallback((frequency) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    setPlaying(true);

    // Ramp volume up then down for a clear beep
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.8);
    gainNode.gain.linearRampToValueAtTime(0, now + 1.0);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 1.0);

    oscillator.onended = () => setPlaying(false);
  }, []);

  const handleResult = (heard) => {
    const newResults = [...results, { ...testFrequencies[currentIndex], heard, ear }];
    setResults(newResults);

    if (currentIndex < testFrequencies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFinished(true);
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setResults([]);
    setFinished(false);
  };

  const switchEar = (newEar) => {
    setEar(newEar);
    setCurrentIndex(0);
    setResults([]);
    setFinished(false);
  };

  const heardCount = results.filter((r) => r.heard).length;
  const missedFreqs = results.filter((r) => !r.heard).map((r) => r.label);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Ear className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold">Hearing Screening Test</h3>
      </div>

      {!finished ? (
        <div>
          {/* Ear selector */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs text-muted-foreground mr-1">Testing:</span>
            {["right", "left"].map((e) => (
              <Button
                key={e}
                size="sm"
                variant={ear === e ? "default" : "outline"}
                className={`h-7 text-xs ${ear === e ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                onClick={() => switchEar(e)}
              >
                {e.charAt(0).toUpperCase() + e.slice(1)} Ear
              </Button>
            ))}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1 mb-6">
            {testFrequencies.map((f, i) => (
              <div
                key={f.freq}
                className={`h-1.5 flex-1 rounded-full transition-all ${i < currentIndex ? "bg-purple-600" : i === currentIndex ? "bg-purple-400" : "bg-gray-200"}`}
              />
            ))}
          </div>

          <div className="bg-purple-50 rounded-xl p-8 mb-4 text-center min-h-[200px] flex flex-col items-center justify-center">
            <p className="text-xs text-purple-600 mb-1">Frequency {currentIndex + 1} of {testFrequencies.length}</p>
            <p className="text-4xl font-bold text-purple-700 mb-1">{testFrequencies[currentIndex].label}</p>
            <p className="text-xs text-muted-foreground mb-6">{testFrequencies[currentIndex].desc}</p>

            <Button
              size="lg"
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-100 mb-2"
              onClick={() => playTone(testFrequencies[currentIndex].freq)}
              disabled={playing}
            >
              {playing ? (
                <><Volume2 className="w-5 h-5 mr-2 animate-pulse" /> Playing...</>
              ) : (
                <><Volume2 className="w-5 h-5 mr-2" /> Play Tone</>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground">Wear headphones for best results · Keep volume at a moderate level</p>
          </div>

          <p className="text-center text-xs text-muted-foreground mb-4">
            Did you hear the tone in your {ear} ear?
          </p>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleResult(false)} disabled={playing}>
              <X className="w-4 h-4 mr-2" /> No
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => handleResult(true)} disabled={playing}>
              <Check className="w-4 h-4 mr-2" /> Yes
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <Ear className="w-8 h-8 text-purple-600" />
          </div>
          <h4 className="font-semibold text-lg mb-1">Screening Complete</h4>
          <p className="text-sm text-muted-foreground mb-4 capitalize">{ear} ear</p>

          <div className="inline-flex items-center gap-6 bg-purple-50 rounded-xl px-6 py-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Frequencies Heard</p>
              <p className="text-3xl font-bold text-purple-700">{heardCount}/{testFrequencies.length}</p>
            </div>
          </div>

          {/* Per-frequency results */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {results.map((r, i) => (
              <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${r.heard ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {r.label} {r.heard ? "✓" : "✗"}
              </div>
            ))}
          </div>

          {missedFreqs.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">
                  You had difficulty hearing: <strong>{missedFreqs.join(", ")}</strong>. This may indicate hearing loss at those frequencies. Please consult an audiologist for a comprehensive hearing evaluation.
                </p>
              </div>
            </div>
          )}

          {missedFreqs.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left mb-6">
              <p className="text-xs text-green-800">
                You heard all test frequencies. Continue to protect your hearing by avoiding prolonged exposure to loud noises.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retake Test
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}