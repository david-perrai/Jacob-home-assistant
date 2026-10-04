declare module "openwakeword-wasm-browser" {
  export interface WakeWordEngineOptions {
    keywords?: string[];
    modelFiles?: Record<string, string>;
    baseAssetUrl?: string;
    ortWasmPath?: string;
    frameSize?: number;
    sampleRate?: number;
    vadHangoverFrames?: number;
    detectionThreshold?: number;
    cooldownMs?: number;
    executionProviders?: string[];
    embeddingWindowSize?: number;
    debug?: boolean;
  }

  export interface DetectEvent {
    keyword: string;
    score: number;
    at: number;
  }

  export class WakeWordEngine {
    constructor(options?: WakeWordEngineOptions);
    on(event: "detect", handler: (e: DetectEvent) => void): () => void;
    on(event: "ready", handler: () => void): () => void;
    on(event: "error", handler: (err: unknown) => void): () => void;
    on(event: "speech-start", handler: () => void): () => void;
    on(event: "speech-end", handler: () => void): () => void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    load(): Promise<void>;
    start(options?: { deviceId?: string; gain?: number }): Promise<void>;
    stop(): Promise<void>;
    setActiveKeywords(keywords: string[]): void;
  }

  export const MODEL_FILE_MAP: Record<string, string>;

  export default WakeWordEngine;
}
