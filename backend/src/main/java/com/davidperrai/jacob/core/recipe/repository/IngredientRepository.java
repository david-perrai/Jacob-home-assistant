package com.davidperrai.jacob.core.recipe.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.davidperrai.jacob.core.recipe.entity.Ingredient;

import java.util.Optional;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    Optional<Ingredient> findByNormalizedName(String normalizedName);

    @Query("select ingredient from Ingredient ingredient where lower(trim(ingredient.name)) = :name")
    Optional<Ingredient> findByNormalizedIngredientName(@Param("name") String normalizedName);
}
