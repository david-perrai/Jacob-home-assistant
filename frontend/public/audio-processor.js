class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._silenceThreshold = 0.01;
        this._silenceDuration = 1200; // ms
        this._silenceStart = null;
        this._stopped = false;
    }

    process(inputs) {
        const input = inputs[0]?.[0];
        if (!input || this._stopped) return true;

        // Envoie les samples au thread principal
        this.port.postMessage({ type: 'samples', buffer: input.slice() });

        // Détection silence
        const rms = Math.sqrt(input.reduce((s, v) => s + v * v, 0) / input.length);

        if (rms < this._silenceThreshold) {
            if (this._silenceStart === null) {
                this._silenceStart = currentTime;
            } else if ((currentTime - this._silenceStart) * 1000 > this._silenceDuration) {
                if (!this._stopped) {
                    this._stopped = true;
                    this.port.postMessage({ type: 'silence' });
                }
            }
        } else {
            this._silenceStart = null; // reset si parole détectée
        }

        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);