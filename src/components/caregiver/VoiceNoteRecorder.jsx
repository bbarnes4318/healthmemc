import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Loader2, AudioLines, Users } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://media.base44.com/images/public/6a4dfc16013374d3269a9096/3f23b1c41_generated_image.png";

export default function VoiceNoteRecorder() {
  const { currentMemberId, currentMemberName, members } = useFamilyMember();
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [user, setUser] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const timerIntervalRef = useRef(null);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const loadNotes = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const data = await base44.entities.AudioNote.list("-created_date", 50);
      setNotes(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadNotes(); }, [currentMemberId]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        try { mediaRecorderRef.current.stop(); } catch (e) { /* noop */ }
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recordingTimeRef.current = 0;
      setRecordSeconds(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        const duration = recordingTimeRef.current;
        await uploadAndSave(audioBlob, duration);
      };

      timerIntervalRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordSeconds(recordingTimeRef.current);
      }, 1000);

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    } catch (e) {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to record voice notes.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const uploadAndSave = async (audioBlob, duration) => {
    setUploading(true);
    try {
      const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const audioUrl = uploadResult.file_url;

      let transcript = "";
      try {
        const transcriptionResult = await base44.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
        transcript = typeof transcriptionResult === "string" ? transcriptionResult : "";
      } catch (e) {
        console.error("Transcription failed:", e);
      }

      await base44.entities.AudioNote.create({
        audio_url: audioUrl,
        transcript: transcript || undefined,
        family_member_id: currentMemberId || undefined,
        author_name: user?.full_name || "Family Member",
        duration_seconds: duration || undefined,
      });

      toast({ title: "Voice note saved", description: transcript ? "Transcript available" : undefined });
      loadNotes();
    } catch (e) {
      toast({ title: "Failed to save voice note", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.AudioNote.delete(id);
      if (playingId === id) {
        if (audioRef.current) audioRef.current.pause();
        setPlayingId(null);
      }
      loadNotes();
      toast({ title: "Voice note deleted" });
    } catch (e) { console.error(e); }
  };

  const playNote = (note) => {
    if (!audioRef.current) return;
    if (playingId === note.id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = note.audio_url;
      audioRef.current.play();
      setPlayingId(note.id);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getMemberName = (note) => {
    if (!note.family_member_id) return "General";
    const member = members.find((m) => m.id === note.family_member_id);
    return member ? member.name : "Family Member";
  };

  return (
    <Card className="p-5">
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        className="hidden"
      />
      <div className="flex items-center gap-2 mb-4">
        <AudioLines className="w-4 h-4 text-violet-600" />
        <h3 className="text-sm font-semibold">Family Voice Notes</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Leave short audio updates about {currentMemberName}'s daily status for other family members and caregivers.
      </p>

      {/* Record Button */}
      <div className="flex items-center justify-center gap-3 py-4 bg-violet-50/50 rounded-xl mb-4">
        {!recording ? (
          <Button
            onClick={startRecording}
            className="bg-violet-600 hover:bg-violet-700"
            disabled={uploading}
          >
            <Mic className="w-4 h-4 mr-2" />
            Record Voice Note
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-600">Recording... {formatTime(recordSeconds)}</span>
            </div>
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="sm"
            >
              <Square className="w-3.5 h-3.5 mr-1.5" />
              Stop
            </Button>
          </div>
        )}
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
            Processing...
          </div>
        )}
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-6">
          <Mic className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No voice notes yet</p>
          <p className="text-xs text-muted-foreground mt-1">Record a note to share updates with your family</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          <AnimatePresence>
            {notes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: 0.03 * i }}
              >
                <Card className="p-3 flex items-start gap-3">
                  <button
                    onClick={() => playNote(note)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition ${
                      playingId === note.id
                        ? "bg-violet-600 text-white"
                        : "bg-violet-100 text-violet-600 hover:bg-violet-200"
                    }`}
                  >
                    {playingId === note.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold">{note.author_name || "Unknown"}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {note.created_date ? format(new Date(note.created_date), "MMM d, h:mm a") : ""}
                      </span>
                    </div>
                    {note.family_member_id && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Users className="w-2.5 h-2.5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">For: {getMemberName(note)}</span>
                      </div>
                    )}
                    {note.duration_seconds > 0 && (
                      <span className="text-[10px] text-muted-foreground">{formatTime(note.duration_seconds)}</span>
                    )}
                    {note.transcript && (
                      <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">"{note.transcript}"</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-700 shrink-0"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}