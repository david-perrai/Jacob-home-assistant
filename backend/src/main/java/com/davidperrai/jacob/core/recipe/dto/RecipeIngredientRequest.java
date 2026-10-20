package com.davidperrai.jacob.core.recipe.dto;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RecipeIngredientRequest {

    private String name;

    private BigDecimal quantity;

    private String unit;
}
