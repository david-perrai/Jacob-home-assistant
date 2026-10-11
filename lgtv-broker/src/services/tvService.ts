import createLgTv from "lgtv2";

export const validCommands = [
  "pause",
  "play",
  "turnoff",
  "setVolume",
  "audioStatus",
  "mute",
  "launchApp",
  "listApps",
] as const;

export type Command = (typeof validCommands)[number];

export interface AudioStatus {
  returnValue: true;
  scenario: string;
  volume: number;
  mute: boolean;
}

interface TvServiceLogger {
  error: (error: Error) => void;
  warn: (message: string) => void;
}

export class TvService {
  private readonly tv: ReturnType<typeof createLgTv>;

  constructor(url: string, logger: TvServiceLogger) {
    this.tv = createLgTv({ url });

    this.tv.on("error", logger.error);
    this.tv.on("prompt", logger.warn);
  }

  async executeCommand(command: Command, option?: string): Promise<unknown> {
    await this.waitForConnection();

    console.log(`Executing command: ${command} with option: ${option}`);
    switch (command) {
      case "pause":
        return this.request("ssap://media.controls/pause");
      case "play":
        return this.request("ssap://media.controls/play");
      case "turnoff":
        return this.request("ssap://system/turnOff");
      case "setVolume":
        if (!option) throw new Error("Volume value is required for setVolume command");
        const volumeValue = parseInt(option, 10);
        return this.request("ssap://audio/setVolume", { volume: volumeValue });
      case "audioStatus":
        return this.getAudioStatus();
      case "listApps":
        return this.request("ssap://com.webos.applicationManager/listLaunchPoints");        
      case "launchApp":
        return this.request("ssap://system.launcher/launch", {
          id: `${option}`,
          contentId: 'spiderman'
        });
      case "mute": {
        const status = await this.request("ssap://audio/getStatus");        
        if (
          !status ||
          typeof status !== "object" ||
          !("mute" in status) ||
          typeof status.mute !== "boolean"
        ) {
          throw new Error("La TV n'a pas retourné son état audio");
        }
        return this.request("ssap://audio/setMute", {
          mute: !status.mute,
        });
      }
    }
  }

  async getAudioStatus(): Promise<AudioStatus> {
    await this.waitForConnection();
    const response = await this.request("ssap://audio/getStatus");

    if (!response || typeof response !== "object") {
      throw new Error("La TV a retourné un état audio invalide");
    }

    const status = response as Record<string, unknown>;
    const mute = status.mute ?? status.muted;
    if (
      typeof status.volume !== "number" ||
      typeof mute !== "boolean" ||
      (status.returnValue !== undefined && status.returnValue !== true)
    ) {
      throw new Error("La TV a retourné un état audio incomplet");
    }

    return {
      returnValue: true,
      scenario: typeof status.scenario === "string" ? status.scenario : "unknown",
      volume: status.volume,
      mute,
    };
  }

  disconnect() {
    this.tv.disconnect();
  }

  private waitForConnection(): Promise<void> {
    if (this.tv.connection) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        finish(new Error("Délai dépassé en attendant la connexion au téléviseur"));
      }, 15_000);

      const onConnect = () => finish();
      const onError = (error: Error) => finish(error);

      const finish = (error?: Error) => {
        clearTimeout(timeout);
        this.tv.off("connect", onConnect);
        this.tv.off("error", onError);
        if (error) reject(error);
        else resolve();
      };

      this.tv.on("connect", onConnect);
      this.tv.on("error", onError);
    });
  }

  private request(uri: string, payload?: Record<string, unknown>) {
    return new Promise<unknown>((resolve, reject) => {
      const callback = (error: Error | null, response?: unknown) => {
        if (error) reject(error);
        else resolve(response);
      };

      if (payload) this.tv.request(uri, payload, callback);
      else this.tv.request(uri, callback);
    });
  }
}
