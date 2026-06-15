import { useState, useEffect, useCallback, useRef } from "react";
import { usePorcupine } from "@picovoice/porcupine-react";

export function useWakeWord() {
  const [isInitializing, setIsInitializing] = useState(false);

  const { keywordDetection, isLoaded, isListening, error, init, start, stop } =
    usePorcupine();

  const accessKey = import.meta.env.VITE_PICOVOICE_ACCESS_KEY;

  const initPorcupine = useCallback(async () => {
    if (!accessKey || isInitializing || isLoaded) {
      return;
    }

    setIsInitializing(true);
    try {
      await init(
        accessKey,
        {
          label: "jacob",
          publicPath: "models/jacob.ppn",
          forceWrite: true,
        },
        {
          publicPath: "models/porcupine_params_fr.pv",
        },
      );
    } catch (err) {
      console.error("Failed to initialize Porcupine:", err);
    } finally {
      setIsInitializing(false);
    }
  }, [accessKey, init, isInitializing, isLoaded]);

  // Initialisation automatique au montage
  useEffect(() => {
    initPorcupine();
  }, [initPorcupine]);

  // Détection de nouveau mot-clé
  const lastDetection = useRef<any>(null);
  const [detected, setDetected] = useState(false);
  const onDetectionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (
      keywordDetection !== null &&
      keywordDetection !== lastDetection.current
    ) {
      lastDetection.current = keywordDetection;
      setDetected(true);
      onDetectionRef.current?.();
    }
  }, [keywordDetection]);

  const clearDetection = useCallback(() => {
    setDetected(false);
  }, []);

  const onDetection = useCallback((cb: () => void) => {
    onDetectionRef.current = cb;
  }, []);

  /**
   * Auto-restart Porcupine listening when conditions are met.
   * The caller passes `canRestart` = true when the pipeline is idle.
   */
  const autoStart = useCallback(
    (canRestart: boolean) => {
      if (isLoaded && !isListening && !error && canRestart) {
        start().catch((err) => {
          console.warn(
            "Auto-start failed, probably user interaction required:",
            err,
          );
        });
      }
    },
    [isLoaded, isListening, error, start],
  );

  return {
    // state
    isLoaded,
    isListening,
    isInitializing,
    detected,
    error,
    // actions
    initPorcupine,
    start,
    stop,
    clearDetection,
    onDetection,
    autoStart,
  };
}
