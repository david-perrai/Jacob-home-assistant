package com.davidperrai.jacob.core.recipe.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.davidperrai.jacob.core.recipe.dto.RecipeDetailsResponse;
import com.davidperrai.jacob.core.recipe.dto.RecipeSearchResultResponse;
import com.davidperrai.jacob.core.recipe.dto.RecipeSummaryResponse;
import com.davidperrai.jacob.core.recipe.entity.RecipeKind;
import com.davidperrai.jacob.core.recipe.service.RecipeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/recipes")
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping("/search")
    public List<RecipeSearchResultResponse> searchRecipes(
            @RequestParam String query,
            @RequestParam(defaultValue = "${recipe-search.max-results:5}") int limit) {
        try {
            return recipeService.searchRecipes(query, limit);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage(), exception);
        }
    }

    @GetMapping
    public List<RecipeSummaryResponse> getAllRecipes() {
        return recipeService.getAllRecipes();
    }

    @GetMapping("/categories")
    public List<RecipeKind> getRecipeCategories() {
        return recipeService.getRecipeCategories();
    }

    @GetMapping("/categories/{kind}")
    public List<RecipeSummaryResponse> getRecipesByCategory(@PathVariable String kind) {
        try {
            return recipeService.getRecipesByKind(RecipeKind.fromValue(kind));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Catégorie de recettes inconnue.", exception);
        }
    }

    @GetMapping("/{id}")
    public RecipeDetailsResponse getRecipe(@PathVariable Long id) {
        return recipeService.getRecipe(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recette introuvable."));
    }
}
