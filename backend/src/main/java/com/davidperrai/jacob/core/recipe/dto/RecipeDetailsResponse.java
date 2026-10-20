package com.davidperrai.jacob.core.recipe.dto;

import java.util.List;

import com.davidperrai.jacob.core.recipe.entity.RecipeKind;

public record RecipeDetailsResponse(
        Long id,
        String name,
        RecipeKind kind,
        int numberOfServings,
        List<RecipeIngredientResponse> ingredients,
        List<RecipeStepResponse> steps) {
}
