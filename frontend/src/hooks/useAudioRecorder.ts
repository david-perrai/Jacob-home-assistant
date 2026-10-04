import { useState, useRef, useCallback } from 'react';

const TARGET_SAMPLE_RATE = 16000;

export function useAudioRecorder(onSilenceDetected?: () => void) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioData, setAudioData] = useState<Float32Array | null>(null);
    const [recordingError, setRecordingError] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef  = useRef<AudioWorkletNode | null>(null);
    const sourceRef       = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef       = useRef<MediaStream | null>(null);
    const samplesRef      = useRef<Float32Array[]>([]);

    const flush = useCallback(() => {
        if (!samplesRef.current.length) return;

        const total = samplesRef.current.reduce((acc, b) => acc + b.length, 0);
        const merged = new Float32Array(total);
        let offset = 0;
        for (const chunk of samplesRef.current) {
            merged.set(chunk, offset);
            offset += chunk.length;
        }

        console.log(`[Audio] ${(merged.length / TARGET_SAMPLE_RATE).toFixed(2)}s capturées`);
        setAudioData(merged);
    }, []);

    const stopRecording = useCallback(() => {
        workletNodeRef.current?.disconnect();
        sourceRef.current?.disconnect();
        streamRef.current?.getTracks().forEach(t => t.stop());
        audioContextRef.current?.close();

        workletNodeRef.current  = null;
        sourceRef.current       = null;
        streamRef.current       = null;
        audioContextRef.current = null;

        flush();
        setIsRecording(false);
    }, [flush]);

    const startRecording = useCallback(async () => {
        setRecordingError(null);

        if (!window.isSecureContext) {
            setRecordingError(
                "Safari bloque l'accès au micro sur cette adresse HTTP. Ouvrez l'application en HTTPS pour utiliser la dictée.",
            );
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setRecordingError(
                "L'accès au micro n'est pas disponible dans ce navigateur. Vérifiez les permissions du site ou utilisez un navigateur à jour.",
            );
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: TARGET_SAMPLE_RATE,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
            streamRef.current = stream;
            samplesRef.current = [];

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass({ sampleRate: TARGET_SAMPLE_RATE });

            // Charge le worklet depuis /public
            await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');

            workletNodeRef.current = new AudioWorkletNode(
                audioContextRef.current,
                'audio-processor'
            );

            // Réception des messages depuis le worklet
            workletNodeRef.current.port.onmessage = (e) => {
                if (e.data.type === 'samples') {
                    samplesRef.current.push(new Float32Array(e.data.buffer));
                } else if (e.data.type === 'silence') {
                    console.log('[Audio] Silence détecté → arrêt automatique');
                    onSilenceDetected?.();
                    stopRecording();
                }
            };

            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(workletNodeRef.current);
            // Pas besoin de connecter au destination (pas de sortie audio)

            setIsRecording(true);
            setAudioData(null);

        } catch (err) {
            console.error('Erreur microphone:', err);
            workletNodeRef.current?.disconnect();
            sourceRef.current?.disconnect();
            streamRef.current?.getTracks().forEach(track => track.stop());
            void audioContextRef.current?.close();

            workletNodeRef.current = null;
            sourceRef.current = null;
            streamRef.current = null;
            audioContextRef.current = null;

            if (err instanceof DOMException && err.name === "NotAllowedError") {
                setRecordingError(
                    "L'accès au micro a été refusé. Autorisez le micro pour ce site dans les réglages de Safari, puis réessayez.",
                );
            } else if (err instanceof DOMException && err.name === "NotFoundError") {
                setRecordingError("Aucun microphone n'a été détecté sur cet appareil.");
            } else if (err instanceof Error) {
                setRecordingError(`Impossible de démarrer le micro : ${err.message}`);
            } else {
                setRecordingError("Impossible de démarrer le micro. Vérifiez les réglages de Safari.");
            }
        }
    }, [stopRecording, onSilenceDetected]);

    return { isRecording, audioData, recordingError, startRecording, stopRecording };
}