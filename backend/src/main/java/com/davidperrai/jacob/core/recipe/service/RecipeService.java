package com.davidperrai.jacob.core.recipe.service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.davidperrai.jacob.core.recipe.dto.RecipeCreationRequest;
import com.davidperrai.jacob.core.recipe.dto.RecipeDetailsResponse;
import com.davidperrai.jacob.core.recipe.dto.RecipeIngredientRequest;
import com.davidperrai.jacob.core.recipe.dto.RecipeIngredientResponse;
import com.davidperrai.jacob.core.recipe.dto.RecipeSearchResultResponse;
import com.davidperrai.jacob.core.recipe.dto.RecipeStepResponse;
import com.davidperrai.jacob.core.recipe.dto.RecipeSummaryResponse;
import com.davidperrai.jacob.core.recipe.entity.Ingredient;
import com.davidperrai.jacob.core.recipe.entity.Recipe;
import com.davidperrai.jacob.core.recipe.entity.RecipeIngredient;
import com.davidperrai.jacob.core.recipe.entity.RecipeKind;
import com.davidperrai.jacob.core.recipe.entity.RecipeStep;
import com.davidperrai.jacob.core.recipe.repository.IngredientRepository;
import com.davidperrai.jacob.core.recipe.repository.RecipeRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final RecipeEmbeddingService recipeEmbeddingService;

    @Transactional(readOnly = true)
    public List<RecipeSummaryResponse> getAllRecipes() {
        return toSummaries(recipeRepository.findAllByOrderByNameAsc());
    }

    @Transactional(readOnly = true)
    public List<RecipeKind> getRecipeCategories() {
        return Arrays.stream(RecipeKind.values())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RecipeSummaryResponse> getRecipesByKind(RecipeKind kind) {
        return toSummaries(recipeRepository.findAllByKindOrderByNameAsc(kind));
    }

    @Transactional(readOnly = true)
    public List<RecipeSearchResultResponse> searchRecipes(String query, int limit) {
        return recipeEmbeddingService.search(query, limit);
    }

    private List<RecipeSummaryResponse> toSummaries(List<Recipe> recipes) {
        return recipes.stream()
                .map(recipe -> new RecipeSummaryResponse(recipe.getId(), recipe.getName(), recipe.getKind()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<RecipeDetailsResponse> getRecipe(Long id) {
        return recipeRepository.findById(id).map(recipe -> new RecipeDetailsResponse(
                recipe.getId(),
                recipe.getName(),
                recipe.getKind(),
                recipe.getNumberOfServings(),
                recipe.getIngredients().stream()
                        .map(ingredient -> new RecipeIngredientResponse(
                                ingredient.getIngredient().getName(),
                                ingredient.getQuantity(),
                                ingredient.getUnit()))
                        .toList(),
                recipe.getSteps().stream()
                        .map(step -> new RecipeStepResponse(step.getStepNumber(), step.getDescription()))
                        .toList()));
    }

    @Transactional
    public Recipe createRecipe(RecipeCreationRequest request) {
        validate(request);

        Recipe recipe = new Recipe();
        recipe.setName(request.getName().trim());
        recipe.setKind(request.getKind());
        recipe.setNumberOfServings(request.getNumberOfServings());

        Set<String> ingredientNames = new HashSet<>();
        for (RecipeIngredientRequest ingredientRequest : request.getIngredients()) {
            String normalizedName = normalizeName(ingredientRequest.getName());
            if (!ingredientNames.add(normalizedName)) {
                throw new IllegalArgumentException(
                        "L'ingrédient « " + ingredientRequest.getName().trim() + " » est indiqué plusieurs fois.");
            }

            Ingredient ingredient = ingredientRepository.findByNormalizedName(normalizedName)
                    .or(() -> ingredientRepository.findByNormalizedIngredientName(normalizedName))
                    .map(existingIngredient -> updateNormalizedName(existingIngredient, normalizedName))
                    .orElseGet(() -> createIngredient(ingredientRequest.getName().trim(), normalizedName));

            RecipeIngredient recipeIngredient = new RecipeIngredient();
            recipeIngredient.setRecipe(recipe);
            recipeIngredient.setIngredient(ingredient);
            recipeIngredient.setQuantity(ingredientRequest.getQuantity());
            recipeIngredient.setUnit(trimToNull(ingredientRequest.getUnit()));
            recipe.getIngredients().add(recipeIngredient);
        }

        int stepNumber = 1;
        for (String description : request.getSteps()) {
            RecipeStep step = new RecipeStep();
            step.setRecipe(recipe);
            step.setStepNumber(stepNumber++);
            step.setDescription(description.trim());
            recipe.getSteps().add(step);
        }

        Recipe savedRecipe = recipeRepository.save(recipe);
        recipeEmbeddingService.indexRecipe(savedRecipe);
        return savedRecipe;
    }

    private Ingredient createIngredient(String name, String normalizedName) {
        Ingredient ingredient = new Ingredient();
        ingredient.setName(name);
        ingredient.setNormalizedName(normalizedName);
        return ingredientRepository.save(ingredient);
    }

    private Ingredient updateNormalizedName(Ingredient ingredient, String normalizedName) {
        if (ingredient.getNormalizedName() == null) {
            ingredient.setNormalizedName(normalizedName);
            return ingredientRepository.save(ingredient);
        }
        return ingredient;
    }

    private void validate(RecipeCreationRequest request) {
        if (request == null || request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Le nom de la recette est obligatoire.");
        }
        if (request.getKind() == null) {
            throw new IllegalArgumentException("Le type de la recette est obligatoire.");
        }
        if (request.getNumberOfServings() <= 0) {
            throw new IllegalArgumentException("Le nombre de portions doit être supérieur à zéro.");
        }
        if (request.getIngredients() == null || request.getIngredients().isEmpty()) {
            throw new IllegalArgumentException("La recette doit contenir au moins un ingrédient.");
        }
        if (request.getSteps() == null || request.getSteps().isEmpty()) {
            throw new IllegalArgumentException("La recette doit contenir au moins une étape.");
        }

        for (RecipeIngredientRequest ingredient : request.getIngredients()) {
            if (ingredient == null || ingredient.getName() == null || ingredient.getName().isBlank()) {
                throw new IllegalArgumentException("Chaque ingrédient doit avoir un nom.");
            }
            if (ingredient.getQuantity() == null || ingredient.getQuantity().signum() <= 0) {
                throw new IllegalArgumentException(
                        "La quantité de l'ingrédient « " + ingredient.getName() + " » doit être supérieure à zéro.");
            }
        }

        for (String step : request.getSteps()) {
            if (step == null || step.isBlank()) {
                throw new IllegalArgumentException("La description de chaque étape est obligatoire.");
            }
        }
    }

    private String normalizeName(String name) {
        return name.trim().toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
