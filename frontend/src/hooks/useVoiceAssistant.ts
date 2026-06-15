import { useEffect, useCallback } from "react";
import { useWakeWord } from "./useWakeWord";
import { useAudioRecorder } from "./useAudioRecorder";
import { useTranscription } from "./useTranscription";
import { useTextToSpeech } from "./useTextToSpeech";
import AiApi from "../api/AiApi";

const aiApi = new AiApi();

/**
 * Orchestre le pipeline vocal complet :
 * Wake word (Porcupine) → Enregistrement → Transcription (Whisper) → Réponse IA → TTS
 */
export function useVoiceAssistant() {
  const wakeWord = useWakeWord();
  const { isRecording, audioData, startRecording, stopRecording } =
    useAudioRecorder(() => console.log("[App] Silence → arrêt déclenché"));
  const {
    transcription,
    sttStatus,
    loadProgress,
    transcribe,
    clearTranscription,
  } = useTranscription();
  const { speak } = useTextToSpeech();

  // Auto-restart Porcupine quand le pipeline est au repos
  useEffect(() => {
    const canRestart =
      !isRecording &&
      (sttStatus === "idle" ||
        sttStatus === "complete" ||
        sttStatus === "error");

    wakeWord.autoStart(canRestart);
  }, [
    wakeWord.isLoaded,
    wakeWord.isListening,
    wakeWord.error,
    isRecording,
    sttStatus,
  ]);

  // Quand le mot-clé est détecté → préparer l'enregistrement
  useEffect(() => {
    wakeWord.onDetection(() => {
      clearTranscription();
      speak("Oui j'écoute ?");

      // Arrêter Porcupine pour libérer le micro, puis lancer l'enregistrement
      wakeWord.stop().then(() => {
        setTimeout(() => {
          startRecording();
        }, 700);
      });
    });
  }, [
    wakeWord.onDetection,
    wakeWord.stop,
    startRecording,
    clearTranscription,
    speak,
  ]);

  // Quand l'enregistrement se termine (audioData reçu) → transcrire + IA
  useEffect(() => {
    if (audioData) {
      transcribe(audioData).then((text) => {
        if (text) {
          wakeWord.clearDetection();
          aiApi.prompt(text).then((response) => {
            speak(response);
          });
        }
      });
    }
  }, [audioData]);

  const stopAudioSession = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  return {
    // Wake word state
    isLoaded: wakeWord.isLoaded,
    isListening: wakeWord.isListening,
    isInitializing: wakeWord.isInitializing,
    keywordDetected: wakeWord.detected,
    error: wakeWord.error,

    // Recording state
    isRecording,

    // Transcription state
    transcription,
    sttStatus,
    loadProgress,

    // Actions
    initPorcupine: wakeWord.initPorcupine,
    start: wakeWord.start,
    stop: wakeWord.stop,
    stopAudioSession,
  };
}
