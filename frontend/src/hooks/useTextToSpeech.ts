import { useCallback, useState } from "react";

export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text: string, lang = "fr-FR") => {
    // window.speechSynthesis.cancel(); // stoppe si déjà en cours
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking };
}