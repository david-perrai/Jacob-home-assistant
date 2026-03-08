export default class AiApi {
    
    private endpoint = "/api/prompt";

    public async prompt(q: string): Promise<string> {
        const response = await fetch(this.endpoint + "?q=" + q, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.text();
    }

    
}