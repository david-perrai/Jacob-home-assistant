package com.davidperrai.jacob.core.recipe.dto;

import java.math.BigDecimal;

public record RecipeIngredientResponse(String name, BigDecimal quantity, String unit) {
}
