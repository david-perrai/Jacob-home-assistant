export type RecipeKind = "apéritif" | "entrée" | "plat" | "dessert";

export interface RecipeSummary {
  id: number;
  name: string;
  kind: RecipeKind;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string | null;
}

export interface RecipeStep {
  stepNumber: number;
  description: string;
}

export interface RecipeDetails extends RecipeSummary {
  numberOfServings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export default class RecipeApi {
  private readonly endpoint = "/api/recipes";

  public async getRecipeCategories(): Promise<RecipeKind[]> {
    const response = await fetch(`${this.endpoint}/categories`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    return response.json();
  }

  public async getRecipesByKind(kind: RecipeKind): Promise<RecipeSummary[]> {
    const response = await fetch(
      `${this.endpoint}/categories/${encodeURIComponent(kind)}`,
    );
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    return response.json();
  }

  public async getRecipes(): Promise<RecipeSummary[]> {
    const response = await fetch(this.endpoint);
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    return response.json();
  }

  public async getRecipe(id: number): Promise<RecipeDetails> {
    const response = await fetch(`${this.endpoint}/${id}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    return response.json();
  }
}
