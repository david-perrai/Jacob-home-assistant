import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

class TranscriptionService {
    static task = 'automatic-speech-recognition';
    static model = 'onnx-community/whisper-small';
    static instance: any = null;

    static async getInstance(progress_callback: ((progress: any) => void) | null = null) {
        if (this.instance === null) {
            const adapter = await navigator?.gpu?.requestAdapter();
            const device  = adapter ? 'webgpu' : 'wasm';

            console.log(`[TranscriptionService] device=${device}`);

            this.instance = await pipeline(this.task as any, this.model, {
                device,
                dtype: {
                    encoder_model: 'fp32',        
                    decoder_model_merged: 'fp32',     
                },                                  
                progress_callback: progress_callback || undefined,
            } as any);
        }
        return this.instance;
    }

    static async transcribe(
        audio: any,
        progress_callback: ((progress: any) => void) | null = null
    ): Promise<string> {
        const transcriber = await this.getInstance(progress_callback);

        const start = performance.now();

        const output = await transcriber(audio, {
            chunk_length_s: 10,         
            stride_length_s: 2,         
            language: 'french',
            task: 'transcribe',
            return_timestamps: false,   
            num_beams: 5,               
            temperature: 0, 
            repetition_penalty: 1.3,
            no_repeat_ngram_size: 3,
        });

        console.log(`[Latence] ${((performance.now() - start) / 1000).toFixed(2)}s`);

        return typeof output === 'string' ? output : (output as any).text;
    }
}

export default TranscriptionService;