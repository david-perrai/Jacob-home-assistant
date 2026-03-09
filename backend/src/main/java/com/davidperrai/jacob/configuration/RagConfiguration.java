package com.davidperrai.jacob.configuration;

import org.springframework.context.annotation.Configuration;

import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class RagConfiguration {

    // @Value("${ollama.base-url}")
    // private String ollamaBaseUrl;

    // @Value("${ollama.embedding-model}")
    // private String embeddingModelName;

    // @Bean
    // public EmbeddingModel embeddingModel() {
    // log.info("Initializing Ollama Embedding Model: {} at {}", embeddingModelName,
    // ollamaBaseUrl);

    // return OllamaEmbeddingModel.builder()
    // .baseUrl(ollamaBaseUrl)
    // .modelName(embeddingModelName)
    // .build();
    // }
}
