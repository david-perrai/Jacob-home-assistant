package com.davidperrai.jacob.core.recipe.dto;

import java.util.List;

import com.davidperrai.jacob.core.recipe.entity.RecipeKind;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RecipeCreationRequest {

    private String name;

    private RecipeKind kind;

    private int numberOfServings;

    private List<RecipeIngredientRequest> ingredients;

    private List<String> steps;
}
