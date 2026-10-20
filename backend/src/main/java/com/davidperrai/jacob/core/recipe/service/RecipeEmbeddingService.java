package com.davidperrai.jacob.core.recipe.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.davidperrai.jacob.core.recipe.dto.RecipeSearchResultResponse;
import com.davidperrai.jacob.core.recipe.entity.Recipe;
import com.davidperrai.jacob.core.recipe.repository.RecipeRepository;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.model.embedding.EmbeddingModel;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecipeEmbeddingService {

    private final JdbcTemplate jdbcTemplate;
    private final EmbeddingModel embeddingModel;
    private final RecipeRepository recipeRepository;

    @Value("${rag.embedding-dimension:1024}")
    private int embeddingDimension;

    @Value("${recipe-search.max-results:5}")
    private int maxResults;

    @PostConstruct
    void createEmbeddingTable() {
        if (embeddingDimension <= 0) {
            throw new IllegalStateException("La dimension des embeddings doit être supérieure à zéro.");
        }
        if (maxResults <= 0) {
            throw new IllegalStateException("Le nombre maximal de résultats doit être supérieur à zéro.");
        }
        jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS recipe_embeddings (
                    recipe_id BIGINT PRIMARY KEY REFERENCES recipe(id) ON DELETE CASCADE,
                    embedding vector(%d) NOT NULL,
                    content TEXT NOT NULL
                )
                """.formatted(embeddingDimension));
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS recipe_embeddings_embedding_idx
                ON recipe_embeddings USING hnsw (embedding vector_cosine_ops)
                """);
    }

    @Transactional
    public void indexExistingRecipes() {
        for (Recipe recipe : recipeRepository.findAllByOrderByNameAsc()) {
            indexRecipe(recipe);
        }
    }

    public void indexRecipe(Recipe recipe) {
        String content = recipeContent(recipe);
        Embedding embedding = embeddingModel.embed(content).content();
        if (embedding.dimension() != embeddingDimension) {
            throw new IllegalStateException(
                    "Le modèle a renvoyé un embedding de dimension " + embedding.dimension()
                            + " au lieu de " + embeddingDimension + ".");
        }

        jdbcTemplate.update("""
                INSERT INTO recipe_embeddings (recipe_id, embedding, content)
                VALUES (?, ?::vector, ?)
                ON CONFLICT (recipe_id) DO UPDATE
                SET embedding = EXCLUDED.embedding, content = EXCLUDED.content
                """, recipe.getId(), toVectorLiteral(embedding), content);
    }

    @Transactional(readOnly = true)
    public List<RecipeSearchResultResponse> search(String query, int limit) {
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("La recherche de recette ne peut pas être vide.");
        }
        if (limit < 1 || limit > maxResults) {
            throw new IllegalArgumentException(
                    "Le nombre de résultats doit être compris entre 1 et " + maxResults + ".");
        }

        Embedding queryEmbedding = embeddingModel.embed(query.trim()).content();
        if (queryEmbedding.dimension() != embeddingDimension) {
            throw new IllegalStateException(
                    "Le modèle a renvoyé un embedding de dimension " + queryEmbedding.dimension()
                            + " au lieu de " + embeddingDimension + ".");
        }

        List<RecipeMatch> matches = jdbcTemplate.query("""
                SELECT recipe_id, 1 - (embedding <=> ?::vector) AS similarity
                FROM recipe_embeddings
                ORDER BY embedding <=> ?::vector, recipe_id
                LIMIT ?
                """,
                (resultSet, rowNumber) -> new RecipeMatch(
                        resultSet.getLong("recipe_id"),
                        resultSet.getDouble("similarity")),
                toVectorLiteral(queryEmbedding),
                toVectorLiteral(queryEmbedding),
                limit);

        if (matches.isEmpty()) {
            return List.of();
        }

        List<Long> recipeIds = new ArrayList<>();
        for (RecipeMatch match : matches) {
            recipeIds.add(match.recipeId());
        }

        Map<Long, Recipe> recipesById = new HashMap<>();
        for (Recipe recipe : recipeRepository.findAllById(recipeIds)) {
            recipesById.put(recipe.getId(), recipe);
        }

        return matches.stream()
                .filter(match -> recipesById.containsKey(match.recipeId()))
                .map(match -> {
                    Recipe recipe = recipesById.get(match.recipeId());
                    return new RecipeSearchResultResponse(
                            recipe.getId(), recipe.getName(), recipe.getKind(), match.similarity());
                })
                .toList();
    }

    private String recipeContent(Recipe recipe) {
        String ingredients = recipe.getIngredients().stream()
                .map(recipeIngredient -> String.join(" ",
                        recipeIngredient.getQuantity().stripTrailingZeros().toPlainString(),
                        recipeIngredient.getUnit() == null ? "" : recipeIngredient.getUnit(),
                        recipeIngredient.getIngredient().getName()).trim())
                .collect(Collectors.joining(", "));
        String steps = recipe.getSteps().stream()
                .map(step -> step.getDescription())
                .collect(Collectors.joining(" "));

        return "Recette : %s. Catégorie : %s. Portions : %d. Ingrédients : %s. Préparation : %s"
                .formatted(recipe.getName(), recipe.getKind().getValue(), recipe.getNumberOfServings(),
                        ingredients, steps);
    }

    private String toVectorLiteral(Embedding embedding) {
        float[] vector = embedding.vector();
        StringBuilder literal = new StringBuilder("[");
        for (int index = 0; index < vector.length; index++) {
            if (index > 0) {
                literal.append(',');
            }
            literal.append(vector[index]);
        }
        return literal.append(']').toString();
    }

    private record RecipeMatch(Long recipeId, double similarity) {
    }
}
