import { useCallback, useEffect, useRef, useState } from "react";
import AiApi from "../api/AiApi";
import { useAudioRecorder } from "./useAudioRecorder";
import { useTextToSpeech } from "./useTextToSpeech";
import { useTranscription } from "./useTranscription";

const aiApi = new AiApi();

/**
 * Orchestre le pipeline vocal : Enregistrement → Transcription → Réponse IA → TTS
 */
export function useVoiceAssistant() {
  const audioLevelListeners = useRef(new Set<(level: number) => void>());
  const reportAudioLevel = useCallback((level: number) => {
    audioLevelListeners.current.forEach((listener) => listener(level));
  }, []);
  const subscribeToAudioLevel = useCallback(
    (listener: (level: number) => void) => {
      audioLevelListeners.current.add(listener);
      return () => {
        audioLevelListeners.current.delete(listener);
      };
    },
    [],
  );
  const {
    isRecording,
    audioData,
    recordingError,
    startRecording,
    stopRecording,
  } = useAudioRecorder(
    () => console.log("[App] Silence → arrêt déclenché"),
    reportAudioLevel,
  );
  const {
    transcription,
    sttStatus,
    transcribe,
    setTranscription,
    clearTranscription,
  } = useTranscription();
  const { speak, unlock, speechError } = useTextToSpeech();
  const [isThinking, setIsThinking] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [assistantResponse, setAssistantResponse] = useState("");

  const submitPrompt = useCallback(
    async (text: string, file?: File): Promise<boolean> => {
      const request = text.trim();
      if (!request && !file) return false;

      setAssistantResponse("");
      setTranscription(
        file ? `${request || "Fichier joint"} : ${file.name}` : request,
      );
      setPromptError(null);
      setIsThinking(true);
      try {
        const response = await aiApi.prompt(request, file);
        setAssistantResponse(response);
        speak(response);
        return true;
      } catch (error) {
        console.error("Erreur lors de la demande à l'IA :", error);
        setPromptError("Impossible d'obtenir une réponse de l'IA. Réessayez.");
        return false;
      } finally {
        setIsThinking(false);
      }
    },
    [setTranscription, speak],
  );

  // À la fin de l'enregistrement, transcrire puis demander une réponse à l'IA.
  useEffect(() => {
    if (!audioData) return;

    const processRequest = async () => {
      const text = await transcribe(audioData);
      if (!text) return;

      await submitPrompt(text);
    };

    void processRequest();
  }, [audioData, transcribe, submitPrompt]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }

    unlock();
    setAssistantResponse("");
    clearTranscription();
    setPromptError(null);
    void startRecording();
  }, [isRecording, stopRecording, clearTranscription, startRecording, unlock]);

  const submitTextPrompt = useCallback(
    (text: string, file?: File) => {
      unlock();
      return submitPrompt(text, file);
    },
    [submitPrompt, unlock],
  );

  return {
    isRecording,
    recordingError,
    speechError,
    promptError,
    transcription,
    assistantResponse,
    sttStatus,
    isThinking,
    toggleRecording,
    submitTextPrompt,
    subscribeToAudioLevel,
  };
}
