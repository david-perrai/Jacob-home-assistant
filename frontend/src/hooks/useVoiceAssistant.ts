import { useCallback, useEffect } from "react";
import AiApi from "../api/AiApi";
import { useAudioRecorder } from "./useAudioRecorder";
import { useTextToSpeech } from "./useTextToSpeech";
import { useTranscription } from "./useTranscription";

const aiApi = new AiApi();

/**
 * Orchestre le pipeline vocal : Enregistrement → Transcription → Réponse IA → TTS
 */
export function useVoiceAssistant() {
  const { isRecording, audioData, startRecording, stopRecording } =
    useAudioRecorder(() => console.log("[App] Silence → arrêt déclenché"));
  const {
    transcription,
    sttStatus,
    transcribe,
    clearTranscription,
  } = useTranscription();
  const { speak } = useTextToSpeech();

  // À la fin de l'enregistrement, transcrire puis demander une réponse à l'IA.
  useEffect(() => {
    if (audioData) {
      transcribe(audioData).then((text) => {
        if (text) {
          aiApi.prompt(text).then((response) => {
            speak(response);
          });
        }
      });
    }
  }, [audioData, transcribe, speak]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }

    clearTranscription();
    void startRecording();
  }, [isRecording, stopRecording, clearTranscription, startRecording]);

  return {
    isRecording,
    transcription,
    sttStatus,
    toggleRecording,
  };
}
