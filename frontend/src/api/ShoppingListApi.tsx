import { ShoppingItem } from "./types/ShoppingItem";

export default class ShoppingListApi {
 
    private endpoint = "/api/shoppingList";

    public async getShoppingList(): Promise<ShoppingItem[]> {
        const response = await fetch(this.endpoint);
        const result = await response.json();        
        if (result) {
            return result;
        }
        return [];
    }

    
}