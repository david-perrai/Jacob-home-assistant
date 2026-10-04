import { useCallback, useEffect, useState } from "react";
import AiApi from "../api/AiApi";
import { useAudioRecorder } from "./useAudioRecorder";
import { useTextToSpeech } from "./useTextToSpeech";
import { useTranscription } from "./useTranscription";

const aiApi = new AiApi();

/**
 * Orchestre le pipeline vocal : Enregistrement → Transcription → Réponse IA → TTS
 */
export function useVoiceAssistant() {
  const {
    isRecording,
    audioData,
    recordingError,
    startRecording,
    stopRecording,
  } = useAudioRecorder(() => console.log("[App] Silence → arrêt déclenché"));
  const {
    transcription,
    sttStatus,
    transcribe,
    clearTranscription,
  } = useTranscription();
  const { speak, unlock, speechError } = useTextToSpeech();
  const [isThinking, setIsThinking] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  // À la fin de l'enregistrement, transcrire puis demander une réponse à l'IA.
  useEffect(() => {
    if (!audioData) return;

    const processRequest = async () => {
      const text = await transcribe(audioData);
      if (!text) return;

      setIsThinking(true);
      setPromptError(null);
      try {
        const response = await aiApi.prompt(text);
        speak(response);
      } catch (error) {
        console.error("Erreur lors de la demande à l'IA :", error);
        setPromptError("Impossible d'obtenir une réponse de l'IA. Réessayez.");
      } finally {
        setIsThinking(false);
      }
    };

    void processRequest();
  }, [audioData, transcribe, speak]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }

    unlock();
    clearTranscription();
    setPromptError(null);
    void startRecording();
  }, [isRecording, stopRecording, clearTranscription, startRecording, unlock]);

  return {
    isRecording,
    recordingError,
    speechError,
    promptError,
    transcription,
    sttStatus,
    isThinking,
    toggleRecording,
  };
}
