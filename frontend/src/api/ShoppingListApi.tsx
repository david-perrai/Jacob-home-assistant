import { ShoppingItem } from "./types/ShoppingItem";

export default class ShoppingListApi {
 
    private endpoint = "/api/shoppingList";

    public async getShoppingList(): Promise<ShoppingItem[]> {
        const response = await fetch(this.endpoint);
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }
        const result = await response.json();        
        if (result) {
            return result;
        }
        return [];
    }

    public async deleteShoppingListItem(id: number): Promise<void> {
        const response = await fetch(`${this.endpoint}/${id}/delete`, {
            method: "POST",
        });
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }
    }
    
}