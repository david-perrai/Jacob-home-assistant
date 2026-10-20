package com.davidperrai.jacob.core.recipe.dto;

import com.davidperrai.jacob.core.recipe.entity.RecipeKind;

public record RecipeSearchResultResponse(Long id, String name, RecipeKind kind, double similarity) {
}
