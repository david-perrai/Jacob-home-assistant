package com.davidperrai.jacob.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import dev.langchain4j.model.ollama.OllamaChatModel;

@Configuration
public class OllamaConfig {

    @Value("${ollama.base-url}")
    private String baseUrl;

    @Value("${ollama.model-name}")
    private String modelName;

    @Bean
    public OllamaChatModel chatLanguageModel() {
        return OllamaChatModel.builder()
                .baseUrl(baseUrl)
                .temperature(0.0)
                .logRequests(true)
                .logResponses(true)
                .modelName(modelName)
                .build();
    }

}