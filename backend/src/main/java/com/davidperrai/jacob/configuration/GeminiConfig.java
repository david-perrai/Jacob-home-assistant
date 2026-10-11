package com.davidperrai.jacob.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;

@Configuration
public class GeminiConfig {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model-name:gemini-3.5-flash-lite}")
    private String modelName;

    @Bean
    public ChatModel chatModel() {
        if (apiKey.isBlank()) {
            throw new IllegalStateException(
                    "Gemini API key is missing. Set the GEMINI_API_KEY environment variable.");
        }

        return GoogleAiGeminiChatModel.builder()
                .temperature(0.0)
                .returnThinking(true)
                .sendThinking(true)
                .logRequests(true)
                .logResponses(true)  
                .apiKey(apiKey)
                .modelName(modelName)
                .build();
    }
}
