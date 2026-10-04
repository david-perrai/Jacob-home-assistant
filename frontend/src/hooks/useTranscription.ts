import { useState, useCallback } from "react";
import TranscriptionService from "../api/TranscriptionService";

export type SttStatus = "idle" | "transcribing" | "complete" | "error";

export function useTranscription() {
  const [transcription, setTranscription] = useState("");
  const [sttStatus, setSttStatus] = useState<SttStatus>("idle");

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
    transcribe,
    clearTranscription,
  };
}
