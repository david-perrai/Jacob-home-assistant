declare module "lgtv2" {
  import { EventEmitter } from "node:events";

  interface LgTv extends EventEmitter {
    connection: boolean;
    request(
      uri: string,
      callback: (error: Error | null, response?: unknown) => void,
    ): void;
    request(
      uri: string,
      payload: Record<string, unknown>,
      callback: (error: Error | null, response?: unknown) => void,
    ): void;
    disconnect(): void;
  }

  function createLgTv(options: { url: string }): LgTv;

  export = createLgTv;
}
