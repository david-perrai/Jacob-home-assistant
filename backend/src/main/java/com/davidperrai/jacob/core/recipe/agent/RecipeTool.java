package com.davidperrai.jacob.core.recipe.agent;

import java.util.Map;

import org.springframework.stereotype.Component;

import com.davidperrai.jacob.common.dto.Response;
import com.davidperrai.jacob.core.recipe.dto.RecipeCreationRequest;
import com.davidperrai.jacob.core.recipe.entity.Recipe;
import com.davidperrai.jacob.core.recipe.service.RecipeService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@AllArgsConstructor
@Slf4j
public class RecipeTool {

    private final RecipeService recipeService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Tool("""
            Crée une recette à partir de son nom, du nombre de portions, de ses ingrédients
            (nom, quantité et unité), de son type et de ses étapes dans l'ordre donné.
            Le type est obligatoire et doit être l'une des valeurs suivantes :
            "apéritif", "entrée", "plat" ou "dessert". si tu ne sais pas prend "plat" comme type par défaut.
            À utiliser lorsque l'utilisateur demande explicitement d'enregistrer ou de créer une recette.
            """)
    public Response createRecipe(
            @P("""
                    Recette au format JSON, par exemple :
                    {"name":"Crêpes","kind":"dessert","numberOfServings":4,
                    "ingredients":[{"name":"Farine","quantity":250,"unit":"g"},
                    {"name":"Lait","quantity":500,"unit":"ml"}],
                    "steps":["Mélanger les ingrédients","Faire cuire les crêpes"]}
                    """) String recipeJson) {
        try {
            RecipeCreationRequest request = objectMapper.readValue(recipeJson, RecipeCreationRequest.class);
            Recipe recipe = recipeService.createRecipe(request);
            return new Response("La recette a été créée.",
                    Map.of("id", recipe.getId(), "name", recipe.getName(),
                            "kind", recipe.getKind().getValue(),
                            "numberOfServings", recipe.getNumberOfServings()));
        } catch (JsonProcessingException e) {
            log.warn("Format JSON invalide pour la création d'une recette.", e);
            return new Response("Impossible de créer la recette : le format des données est invalide.");
        } catch (IllegalArgumentException e) {
            log.warn("Données invalides pour la création d'une recette : {}", e.getMessage());
            return new Response("Impossible de créer la recette : " + e.getMessage());
        }
    }

    @Tool("""
            Recherche les recettes enregistrées qui correspondent le mieux à la demande de l'utilisateur,
            même si elle est approximative ou décrit seulement des ingrédients (par exemple des cookies
            ou une recette avec des légumes). Utilise cet outil pour retrouver ou suggérer une recette
            existante ; ne l'utilise pas pour créer une recette.
            """)
    public Response searchRecipes(
            @P("La demande de l'utilisateur décrivant la recette recherchée ou les ingrédients souhaités.") String query) {
        try {
            var recipes = recipeService.searchRecipes(query, 5);
            return new Response(recipes.isEmpty()
                    ? "Aucune recette enregistrée ne correspond à cette demande."
                    : "Voici les recettes enregistrées les plus proches de la demande.",
                    recipes.stream()
                            .map(recipe -> Map.of(
                                    "id", recipe.id(),
                                    "name", recipe.name(),
                                    "kind", recipe.kind().getValue(),
                                    "similarity", recipe.similarity()))
                            .toList());
        } catch (IllegalArgumentException exception) {
            log.warn("Demande invalide pour la recherche de recettes : {}", exception.getMessage());
            return new Response("Impossible de rechercher une recette : " + exception.getMessage());
        }
    }
}
