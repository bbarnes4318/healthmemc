import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VoiceInputButton({ value, onChange, className, disabled }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        const baseText = valueRef.current || "";
        const separator = baseText && !baseText.endsWith(" ") ? " " : "";
        onChangeRef.current(baseText + separator + finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch (e) { /* noop */ }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current || disabled) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleListening}
      disabled={disabled}
      className={`shrink-0 ${listening ? "bg-red-50 border-red-300 text-red-600 animate-pulse" : ""} ${className || ""}`}
      title={listening ? "Stop voice input" : "Start voice input"}
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </Button>
  );
}