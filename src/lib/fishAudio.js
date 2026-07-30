// Fish Audio (fish.audio) TTS Service & Voice Engine

export const FISH_AUDIO_VOICES = [
  {
    id: "dr-alex",
    name: "Dr. Alex",
    title: "Medical Specialist",
    gender: "male",
    description: "Clear, clinical, and reassuring medical professional tone.",
    referenceId: "7f92f8afb8ec43bf81429cc1c9199cb1",
    fallbackPitch: 0.95,
    fallbackRate: 0.95,
    avatar: "👨‍⚕️",
  },
  {
    id: "nurse-serena",
    name: "Serena",
    title: "Compassionate Nurse",
    gender: "female",
    description: "Warm, empathetic, and gentle caregiving tone.",
    referenceId: "e283b7f1a9244bbcb4901f4c7f53a1a9",
    fallbackPitch: 1.1,
    fallbackRate: 0.95,
    avatar: "👩‍⚕️",
  },
  {
    id: "coach-marcus",
    name: "Marcus",
    title: "Fitness & PT Coach",
    gender: "male",
    description: "Energetic, motivating, and clear instructional tone.",
    referenceId: "c389f410a21d4924a689b910e527b14d",
    fallbackPitch: 1.0,
    fallbackRate: 1.05,
    avatar: "🏋️‍♂️",
  },
  {
    id: "guide-elena",
    name: "Elena",
    title: "Calm Wellness Guide",
    gender: "female",
    description: "Soothing, relaxed, and mindful tone.",
    referenceId: "a99824f1124b4c738ab7105b6328a901",
    fallbackPitch: 1.05,
    fallbackRate: 0.9,
    avatar: "🧘‍♀️",
  },
  {
    id: "dr-david",
    name: "Dr. David",
    title: "Executive Physician",
    gender: "male",
    description: "Authoritative, calm, and thorough physician tone.",
    referenceId: "56920ab4c12d480bb123995f0011bb99",
    fallbackPitch: 0.9,
    fallbackRate: 0.95,
    avatar: "🩺",
  },
];

const STORAGE_KEY_VOICE = "fish_audio_active_voice";
const STORAGE_KEY_API_KEY = "fish_audio_api_key";
const STORAGE_KEY_RATE = "fish_audio_speech_rate";

class FishAudioEngine {
  constructor() {
    this.currentAudio = null;
    this.currentUtterance = null;
    this.speakingText = null;
    this.isSpeaking = false;
    this.isLoading = false;
    this.listeners = new Set();
    this.audioCache = new Map();
  }

  getActiveVoiceId() {
    return localStorage.getItem(STORAGE_KEY_VOICE) || "dr-alex";
  }

  setActiveVoiceId(id) {
    localStorage.setItem(STORAGE_KEY_VOICE, id);
    this.notify();
  }

  getActiveVoice() {
    const id = this.getActiveVoiceId();
    return FISH_AUDIO_VOICES.find((v) => v.id === id) || FISH_AUDIO_VOICES[0];
  }

  getApiKey() {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || import.meta.env.VITE_FISH_AUDIO_API_KEY || "";
  }

  setApiKey(key) {
    if (key) {
      localStorage.setItem(STORAGE_KEY_API_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY_API_KEY);
    }
    this.notify();
  }

  getRate() {
    const r = localStorage.getItem(STORAGE_KEY_RATE);
    return r ? parseFloat(r) : 1.0;
  }

  setRate(rate) {
    localStorage.setItem(STORAGE_KEY_RATE, rate.toString());
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Send immediate initial state
    listener({
      isSpeaking: this.isSpeaking,
      isLoading: this.isLoading,
      speakingText: this.speakingText,
      activeVoice: this.getActiveVoice(),
    });
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener({
        isSpeaking: this.isSpeaking,
        isLoading: this.isLoading,
        speakingText: this.speakingText,
        activeVoice: this.getActiveVoice(),
      });
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.isLoading = false;
    this.speakingText = null;
    this.notify();
  }

  async speak(text, options = {}) {
    if (!text || typeof text !== "string") return;

    const cleanedText = text
      .replace(/[#*_>`-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanedText) return;

    // If currently speaking this exact text, toggle stop
    if (this.isSpeaking && this.speakingText === cleanedText) {
      this.stop();
      return;
    }

    this.stop();

    this.isLoading = true;
    this.speakingText = cleanedText;
    this.notify();

    const voice = options.voiceId
      ? FISH_AUDIO_VOICES.find((v) => v.id === options.voiceId) || this.getActiveVoice()
      : this.getActiveVoice();
    const apiKey = this.getApiKey();
    const rate = options.rate || this.getRate();

    if (apiKey) {
      try {
        const cacheKey = `${voice.id}_${rate}_${cleanedText.slice(0, 100)}`;
        let blobUrl = this.audioCache.get(cacheKey);

        if (!blobUrl) {
          // Send request through /api/fish-tts serverless proxy to bypass browser CORS blocks
          let response;
          try {
            response = await fetch("/api/fish-tts", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey.trim()}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: cleanedText.slice(0, 2000),
                reference_id: voice.referenceId || null,
                format: "mp3",
              }),
            });
          } catch (netErr) {
            // Direct fallback if proxy is unavailable
            response = await fetch("https://api.fish.audio/v1/tts", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey.trim()}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: cleanedText.slice(0, 2000),
                reference_id: voice.referenceId || null,
                format: "mp3",
                normalize: true,
              }),
            });
          }

          if (!response.ok) {
            const errBody = await response.text().catch(() => "");
            console.error(`Fish Audio API HTTP ${response.status}:`, errBody);
            throw new Error(`Fish Audio API error ${response.status}: ${errBody}`);
          }

          const audioBlob = await response.blob();
          blobUrl = URL.createObjectURL(audioBlob);
          this.audioCache.set(cacheKey, blobUrl);
        }

        const audio = new Audio(blobUrl);
        audio.playbackRate = rate;
        this.currentAudio = audio;

        audio.onplay = () => {
          this.isLoading = false;
          this.isSpeaking = true;
          this.notify();
          if (options.onStart) options.onStart();
        };

        audio.onended = () => {
          this.isSpeaking = false;
          this.isLoading = false;
          this.speakingText = null;
          this.currentAudio = null;
          this.notify();
          if (options.onEnd) options.onEnd();
        };

        audio.onerror = (err) => {
          console.warn("Fish Audio audio element playback error, falling back:", err);
          this.fallbackSpeak(cleanedText, voice, rate, options);
        };

        await audio.play();
        return;
      } catch (err) {
        console.error("Fish Audio API request failed. Falling back to browser speech synthesis:", err);
      }
    }

    // Fallback to browser SpeechSynthesis calibrated with Fish Audio persona settings
    this.fallbackSpeak(cleanedText, voice, rate, options);
  }

  fallbackSpeak(text, voice, rate, options = {}) {
    if (!window.speechSynthesis) {
      this.isLoading = false;
      this.isSpeaking = false;
      this.speakingText = null;
      this.notify();
      if (options.onError) options.onError(new Error("Speech synthesis not supported"));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.slice(0, 3000));
    utterance.rate = (voice.fallbackRate || 1.0) * rate;
    utterance.pitch = voice.fallbackPitch || 1.0;

    // Pick best matching system voice based on gender/preference if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (voice.gender === "male"
            ? v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("alex") || v.name.toLowerCase().includes("george")
            : v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("victoria"))
      );
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => {
      this.isLoading = false;
      this.isSpeaking = true;
      this.notify();
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isLoading = false;
      this.speakingText = null;
      this.currentUtterance = null;
      this.notify();
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (err) => {
      this.isSpeaking = false;
      this.isLoading = false;
      this.speakingText = null;
      this.currentUtterance = null;
      this.notify();
      if (options.onError) options.onError(err);
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}

export const fishAudio = new FishAudioEngine();
