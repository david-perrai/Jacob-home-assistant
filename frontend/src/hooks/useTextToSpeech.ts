import { useCallback, useRef, useState } from "react";

export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const unlockedRef = useRef(false);
  const unlockUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const unlock = useCallback((lang = "fr-FR") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechError(
        "La synthèse vocale n'est pas prise en charge par ce navigateur.",
      );
      return;
    }

    setSpeechError(null);
    if (unlockUtteranceRef.current) return;
    if (unlockedRef.current) {
      window.speechSynthesis.cancel();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(".");
      utterance.lang = lang;
      utterance.volume = 0;
      utterance.onend = () => {
        unlockUtteranceRef.current = null;
        unlockedRef.current = true;
      };
      utterance.onerror = (event) => {
        unlockUtteranceRef.current = null;
        setSpeechError(
          `La synthèse vocale n'a pas pu être activée : ${event.error}.`,
        );
      };
      unlockUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.resume();
    } catch (error) {
      unlockUtteranceRef.current = null;
      console.error("Impossible d'activer la synthèse vocale :", error);
      setSpeechError(
        "Impossible d'activer la synthèse vocale sur cet appareil.",
      );
    }
  }, []);

  const speak = useCallback((text: string, lang = "fr-FR") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechError(
        "La synthèse vocale n'est pas prise en charge par ce navigateur.",
      );
      return;
    }

    const synthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const language = lang.toLowerCase();
    const languagePrefix = language.split("-")[0];
    const voices = synthesis.getVoices();
    utterance.voice =
      voices.find((voice) => voice.lang.toLowerCase() === language) ??
      voices.find((voice) =>
        voice.lang.toLowerCase().startsWith(`${languagePrefix}-`),
      ) ??
      null;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (event) => {
      setSpeaking(false);
      setSpeechError(`La synthèse vocale a échoué : ${event.error}.`);
    };

    setSpeechError(null);
    try {
      if (!unlockUtteranceRef.current) {
        synthesis.cancel();
      }
      synthesis.speak(utterance);
    } catch (error) {
      console.error("Erreur de synthèse vocale :", error);
      setSpeaking(false);
      setSpeechError("La synthèse vocale n'a pas pu démarrer.");
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  return { speak, stop, unlock, speaking, speechError };
}
