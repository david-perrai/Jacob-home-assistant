export interface IngestionResponse {
  filename: string;
  message: string;
}

export default class RagApi {
  static async uploadDocument(file: File): Promise<IngestionResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/rag/documents", {
      method: "POST",
      body: formData,
    });
    const responseBody = await response.text();

    if (!response.ok) {
      let message = responseBody || response.statusText;
      try {
        const errorBody: { message?: string; detail?: string } = JSON.parse(responseBody);
        message = errorBody.message ?? errorBody.detail ?? message;
      } catch {
        // The server may return a plain-text error.
      }
      throw new Error(`Échec de l'import (${response.status}) : ${message}`);
    }

    return JSON.parse(responseBody) as IngestionResponse;
  }
}
