package com.davidperrai.jacob.core.recipe.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.davidperrai.jacob.core.recipe.entity.RecipeStep;

@Repository
public interface RecipeStepRepository extends JpaRepository<RecipeStep, Long> {
}
