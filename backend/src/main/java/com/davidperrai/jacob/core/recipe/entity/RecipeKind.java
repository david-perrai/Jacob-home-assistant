package com.davidperrai.jacob.core.recipe.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RecipeKind {
    APERITIF("apéritif"),
    ENTREE("entrée"),
    PLAT("plat"),
    DESSERT("dessert");

    private final String value;

    RecipeKind(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static RecipeKind fromValue(String value) {
        for (RecipeKind kind : values()) {
            if (kind.value.equals(value)) {
                return kind;
            }
        }
        throw new IllegalArgumentException("Type de recette inconnu : " + value);
    }
}
