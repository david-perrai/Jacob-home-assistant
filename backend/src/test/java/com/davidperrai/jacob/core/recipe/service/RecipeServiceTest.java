package com.davidperrai.jacob.core.recipe.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.davidperrai.jacob.core.recipe.dto.RecipeCreationRequest;
import com.davidperrai.jacob.core.recipe.dto.RecipeIngredientRequest;
import com.davidperrai.jacob.core.recipe.dto.RecipeSummaryResponse;
import com.davidperrai.jacob.core.recipe.entity.Ingredient;
import com.davidperrai.jacob.core.recipe.entity.Recipe;
import com.davidperrai.jacob.core.recipe.entity.RecipeIngredient;
import com.davidperrai.jacob.core.recipe.entity.RecipeKind;
import com.davidperrai.jacob.core.recipe.entity.RecipeStep;
import com.davidperrai.jacob.core.recipe.repository.IngredientRepository;
import com.davidperrai.jacob.core.recipe.repository.RecipeRepository;

@ExtendWith(MockitoExtension.class)
class RecipeServiceTest {

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private IngredientRepository ingredientRepository;

    @Mock
    private RecipeEmbeddingService recipeEmbeddingService;

    @InjectMocks
    private RecipeService recipeService;

    @Test
    void returnsRecipeSummariesInRepositoryOrder() {
        Recipe firstRecipe = new Recipe();
        firstRecipe.setId(1L);
        firstRecipe.setName("Crêpes");
        firstRecipe.setKind(RecipeKind.DESSERT);
        Recipe secondRecipe = new Recipe();
        secondRecipe.setId(2L);
        secondRecipe.setName("Soupe");
        secondRecipe.setKind(RecipeKind.ENTREE);
        when(recipeRepository.findAllByOrderByNameAsc()).thenReturn(List.of(firstRecipe, secondRecipe));

        var recipes = recipeService.getAllRecipes();

        assertEquals(List.of("Crêpes", "Soupe"), recipes.stream().map(recipe -> recipe.name()).toList());
        assertEquals(List.of(1L, 2L), recipes.stream().map(recipe -> recipe.id()).toList());
        assertEquals(List.of(RecipeKind.DESSERT, RecipeKind.ENTREE),
                recipes.stream().map(recipe -> recipe.kind()).toList());
    }

    @Test
    void returnsAllRecipeCategoriesInDefinedOrder() {

        var categories = recipeService.getRecipeCategories();

        assertEquals(List.of(RecipeKind.APERITIF, RecipeKind.ENTREE, RecipeKind.PLAT, RecipeKind.DESSERT), categories);
        verify(recipeRepository, never()).findAllByOrderByNameAsc();
    }

    @Test
    void returnsRecipesForRequestedCategoryInRepositoryOrder() {
        Recipe recipe = new Recipe();
        recipe.setId(1L);
        recipe.setName("Tarte");
        recipe.setKind(RecipeKind.DESSERT);
        when(recipeRepository.findAllByKindOrderByNameAsc(RecipeKind.DESSERT))
                .thenReturn(List.of(recipe));

        var recipes = recipeService.getRecipesByKind(RecipeKind.DESSERT);

        assertEquals(List.of(new RecipeSummaryResponse(1L, "Tarte", RecipeKind.DESSERT)), recipes);
    }

    @Test
    void returnsRecipeDetailsWithIngredientQuantitiesAndOrderedSteps() {
        Recipe recipe = new Recipe();
        recipe.setId(3L);
        recipe.setName("Crêpes");
        recipe.setKind(RecipeKind.DESSERT);
        recipe.setNumberOfServings(4);

        Ingredient flour = new Ingredient();
        flour.setName("Farine");
        RecipeIngredient recipeIngredient = new RecipeIngredient();
        recipeIngredient.setRecipe(recipe);
        recipeIngredient.setIngredient(flour);
        recipeIngredient.setQuantity(new BigDecimal("250"));
        recipeIngredient.setUnit("g");
        recipe.setIngredients(new ArrayList<>(List.of(recipeIngredient)));

        RecipeStep firstStep = new RecipeStep();
        firstStep.setStepNumber(1);
        firstStep.setDescription("Mélanger");
        RecipeStep secondStep = new RecipeStep();
        secondStep.setStepNumber(2);
        secondStep.setDescription("Cuire");
        recipe.setSteps(new ArrayList<>(List.of(firstStep, secondStep)));
        when(recipeRepository.findById(3L)).thenReturn(Optional.of(recipe));

        var details = recipeService.getRecipe(3L).orElseThrow();

        assertEquals("Crêpes", details.name());
        assertEquals(RecipeKind.DESSERT, details.kind());
        assertEquals(4, details.numberOfServings());
        assertEquals("Farine", details.ingredients().getFirst().name());
        assertEquals(new BigDecimal("250"), details.ingredients().getFirst().quantity());
        assertEquals("g", details.ingredients().getFirst().unit());
        assertEquals(List.of(1, 2), details.steps().stream().map(step -> step.stepNumber()).toList());
        assertEquals(List.of("Mélanger", "Cuire"), details.steps().stream().map(step -> step.description()).toList());
    }

    @Test
    void reusesExistingIngredientWhenCreatingRecipe() {
        Ingredient existingIngredient = new Ingredient();
        existingIngredient.setId(42L);
        existingIngredient.setName("Farine");
        existingIngredient.setNormalizedName("farine");
        when(ingredientRepository.findByNormalizedName("farine")).thenReturn(Optional.of(existingIngredient));
        when(recipeRepository.save(any(Recipe.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RecipeCreationRequest request = new RecipeCreationRequest();
        request.setName("Crêpes");
        request.setKind(RecipeKind.DESSERT);
        request.setNumberOfServings(4);
        RecipeIngredientRequest ingredientRequest = new RecipeIngredientRequest();
        ingredientRequest.setName("  FARINE ");
        ingredientRequest.setQuantity(new BigDecimal("250"));
        ingredientRequest.setUnit("g");
        request.setIngredients(List.of(ingredientRequest));
        request.setSteps(List.of("Mélanger", "Cuire"));

        Recipe recipe = recipeService.createRecipe(request);

        assertEquals("Crêpes", recipe.getName());
        assertEquals(RecipeKind.DESSERT, recipe.getKind());
        assertEquals(4, recipe.getNumberOfServings());
        assertSame(existingIngredient, recipe.getIngredients().getFirst().getIngredient());
        assertEquals(42L, recipe.getIngredients().getFirst().getIngredient().getId());
        assertEquals(1, recipe.getSteps().getFirst().getStepNumber());
        assertEquals(2, recipe.getSteps().getLast().getStepNumber());
        verify(ingredientRepository, never()).save(any(Ingredient.class));
        verify(recipeRepository).save(recipe);
        verify(recipeEmbeddingService).indexRecipe(recipe);
    }

    @Test
    void findsAndNormalizesAnExistingIngredientWithoutNormalizedName() {
        Ingredient existingIngredient = new Ingredient();
        existingIngredient.setId(7L);
        existingIngredient.setName("  Farine ");
        when(ingredientRepository.findByNormalizedName("farine")).thenReturn(Optional.empty());
        when(ingredientRepository.findByNormalizedIngredientName("farine"))
                .thenReturn(Optional.of(existingIngredient));
        when(ingredientRepository.save(existingIngredient)).thenReturn(existingIngredient);
        when(recipeRepository.save(any(Recipe.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RecipeCreationRequest request = new RecipeCreationRequest();
        request.setName("Crêpes");
        request.setKind(RecipeKind.DESSERT);
        request.setNumberOfServings(2);
        RecipeIngredientRequest ingredientRequest = new RecipeIngredientRequest();
        ingredientRequest.setName("FARINE");
        ingredientRequest.setQuantity(BigDecimal.ONE);
        request.setIngredients(List.of(ingredientRequest));
        request.setSteps(List.of("Mélanger"));

        Recipe recipe = recipeService.createRecipe(request);

        assertEquals(7L, recipe.getIngredients().getFirst().getIngredient().getId());
        assertEquals("farine", existingIngredient.getNormalizedName());
        verify(ingredientRepository).save(existingIngredient);
    }

    @Test
    void rejectsRecipeWithoutKind() {
        RecipeCreationRequest request = new RecipeCreationRequest();
        request.setName("Crêpes");
        request.setNumberOfServings(4);
        request.setIngredients(List.of(new RecipeIngredientRequest()));
        request.setSteps(List.of("Mélanger"));

        var exception = assertThrows(
                IllegalArgumentException.class, () -> recipeService.createRecipe(request));

        assertEquals("Le type de la recette est obligatoire.", exception.getMessage());
        verify(recipeRepository, never()).save(any(Recipe.class));
    }
}
