package com.davidperrai.jacob.core.recipe.dto;

import com.davidperrai.jacob.core.recipe.entity.RecipeKind;

public record RecipeSummaryResponse(Long id, String name, RecipeKind kind) {
}
