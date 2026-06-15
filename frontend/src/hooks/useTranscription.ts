import { useState, useEffect, useCallback } from "react";
import TranscriptionService from "../api/TranscriptionService";

export type SttStatus = "idle" | "loading" | "transcribing" | "complete" | "error";

export function useTranscription() {
  const [transcription, setTranscription] = useState("");
  const [sttStatus, setSttStatus] = useState<SttStatus>("idle");
  const [loadProgress, setLoadProgress] = useState(0);

  // Chargement du modèle Whisper au montage
  useEffect(() => {
    const initTranscription = async () => {
      setSttStatus("loading");
      try {
        await TranscriptionService.getInstance((progress) => {
          if (progress.status === "progress") {
            setLoadProgress(progress.progress || 0);
          }
        });
        setSttStatus("idle");
      } catch (err: any) {
        console.error("Transcription init error:", err);
        setSttStatus("error");
      }
    };

    initTranscription();
  }, []);

  const transcribe = useCallback(async (audioData: Float32Array): Promise<string> => {
    setSttStatus("transcribing");
    try {
      const text = await TranscriptionService.transcribe(audioData);
      setTranscription(text);
      setSttStatus("complete");
      return text;
    } catch (err: any) {
      console.error("Transcription error:", err);
      setSttStatus("error");
      return "";
    }
  }, []);

  const clearTranscription = useCallback(() => {
    setTranscription("");
  }, []);

  return {
    transcription,
    sttStatus,
    loadProgress,
    transcribe,
    clearTranscription,
  };
}
