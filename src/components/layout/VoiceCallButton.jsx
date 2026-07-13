import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VoiceCallButton({ contacts }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setSupported(true);
  }, []);

  const findContact = useCallback((spoken) => {
    if (!spoken || contacts.length === 0) return null;
    const lower = spoken.toLowerCase().trim();

    // Exact / partial name match
    let best = null;
    let bestScore = 0;
    for (const c of contacts) {
      const nameLower = (c.name || "").toLowerCase();
      if (!nameLower) continue;
      // Full name match
      if (lower.includes(nameLower)) {
        return { contact: c, confidence: "exact" };
      }
      // First or last name match
      const parts = nameLower.split(/\s+/);
      for (const part of parts) {
        if (part.length > 2 && lower.includes(part)) {
          const score = part.length;
          if (score > bestScore) {
            bestScore = score;
            best = c;
          }
        }
      }
    }
    if (best) return { contact: best, confidence: "partial" };
    return null;
  }, [contacts]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    setTranscript("");
    setMatchResult(null);
    setListening(true);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      const match = findContact(text);
      if (match) {
        setMatchResult({ ...match, spoken: text });
        // Auto-initiate call
        window.location.href = `tel:${match.contact.phone}`;
      } else {
        setMatchResult({ contact: null, spoken: text, confidence: "none" });
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error !== "no-speech") {
        setMatchResult({ contact: null, spoken: "", confidence: "error", error: event.error });
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  }, [findContact]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  if (!supported) return null;

  return (
    <>
      <button
        onClick={listening ? stopListening : startListening}
        disabled={contacts.length === 0}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition shrink-0 ${
          listening
            ? "bg-red-600 text-white animate-pulse"
            : "bg-red-600/10 text-red-700 border border-red-300 hover:bg-red-600/20"
        } disabled:opacity-40`}
        title="Say a contact name to call"
      >
        {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        {listening ? "Listening..." : "Voice Call"}
      </button>

      {/* Voice feedback overlay */}
      <AnimatePresence>
        {(listening || matchResult) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
            onClick={() => { setMatchResult(null); setTranscript(""); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center"
            >
              {listening ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <Mic className="w-8 h-8 text-red-600 animate-pulse" />
                  </div>
                  <p className="font-semibold text-gray-800 mb-1">Listening...</p>
                  <p className="text-xs text-muted-foreground">Say a doctor or contact name</p>
                </>
              ) : matchResult?.contact ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="font-semibold text-gray-800 mb-1">Calling {matchResult.contact.name}</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Matched: "{matchResult.spoken}"
                  </p>
                  <a
                    href={`tel:${matchResult.contact.phone}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {matchResult.contact.phone}
                  </a>
                </>
              ) : matchResult?.confidence === "none" ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <Mic className="w-8 h-8 text-amber-600" />
                  </div>
                  <p className="font-semibold text-gray-800 mb-1">No match found</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Heard: "{matchResult.spoken}"
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Try saying a name from your contacts list
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <Mic className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="font-semibold text-gray-800 mb-1">Microphone error</p>
                  <p className="text-xs text-muted-foreground">Please try again</p>
                </>
              )}
              <button
                onClick={() => { setMatchResult(null); setTranscript(""); }}
                className="mt-4 text-xs text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}