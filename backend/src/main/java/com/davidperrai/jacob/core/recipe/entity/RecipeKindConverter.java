package com.davidperrai.jacob.core.recipe.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class RecipeKindConverter implements AttributeConverter<RecipeKind, String> {

    @Override
    public String convertToDatabaseColumn(RecipeKind kind) {
        return kind == null ? null : kind.getValue();
    }

    @Override
    public RecipeKind convertToEntityAttribute(String value) {
        return value == null ? null : RecipeKind.fromValue(value);
    }
}
