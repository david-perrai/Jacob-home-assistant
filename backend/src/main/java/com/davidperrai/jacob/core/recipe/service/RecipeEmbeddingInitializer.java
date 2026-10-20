package com.davidperrai.jacob.core.recipe.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RecipeEmbeddingInitializer implements ApplicationRunner {

    private final RecipeEmbeddingService recipeEmbeddingService;

    @Override
    public void run(ApplicationArguments args) {
        recipeEmbeddingService.indexExistingRecipes();
    }
}
