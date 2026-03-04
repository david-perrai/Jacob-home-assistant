
import { pipeline, env } from '@xenova/transformers';

// Configuration pour le web worker
env.allowLocalModels = false;
env.useBrowserCache = true;

class TranscriptionPipeline {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-base'; // Passage au modèle base pour plus de précision
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { 
                progress_callback,
                revision: 'main',
            });
        }
        return this.instance;
    }
}

// Écoute des messages du thread principal
self.addEventListener('message', async (event) => {
    const { audio } = event.data;

    try {
        const transcriber = await TranscriptionPipeline.getInstance((progress) => {
            self.postMessage({ status: 'progress', progress });
        });

        // Envoi du statut de démarrage de transcription
        self.postMessage({ status: 'transcribing' });

        const output = await transcriber(audio, {
            chunk_length_s: 30,
            stride_length_s: 5,
            language: 'french',
            task: 'transcribe',
            return_timestamps: false,
            // Options pour améliorer la qualité
            repetition_penalty: 1.2,
            no_repeat_ngram_size: 3,
        });

        // Envoi du résultat final
        self.postMessage({
            status: 'complete',
            output: output.text
        });

    } catch (error) {
        self.postMessage({
            status: 'error',
            error: error.message
        });
    }
});
