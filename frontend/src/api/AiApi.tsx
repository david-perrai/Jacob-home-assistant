
export default class AiApi {

  private endpoint = "/api/prompt";

  public async prompt(q: string, file?: File): Promise<string> {
    const formData = new FormData();
    if (q.trim()) {
      formData.append("q", q.trim());
    }
    if (file) {
      formData.append("file", file);
    }

    const response = await fetch(this.endpoint, {
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
      throw new Error(`Échec de la demande (${response.status}) : ${message}`);
    }

    return responseBody;
  }
}