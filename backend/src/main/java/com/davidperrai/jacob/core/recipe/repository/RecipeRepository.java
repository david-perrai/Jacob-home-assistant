package com.davidperrai.jacob.core.recipe.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.davidperrai.jacob.core.recipe.entity.Recipe;
import com.davidperrai.jacob.core.recipe.entity.RecipeKind;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    List<Recipe> findAllByOrderByNameAsc();

    List<Recipe> findAllByKindOrderByNameAsc(RecipeKind kind);

}
