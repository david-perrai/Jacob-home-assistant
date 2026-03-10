package com.davidperrai.jacob.core.ai.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.davidperrai.jacob.configuration.AssistantInterface;
import com.davidperrai.jacob.core.googlemap.agent.DirectoryEntryTool;
import com.davidperrai.jacob.core.shoppinglist.agent.ShoppingListTool;

import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.service.AiServices;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

   private final OllamaChatModel model;
   private final ShoppingListTool shoppingListTool;
   private final DirectoryEntryTool directoryEntryTool;

   private AssistantInterface assistant;

   @PostConstruct
   public void init() {

      // Build assistant with all components
      assistant = AiServices.builder(AssistantInterface.class)
            .chatModel(model)
            .tools(shoppingListTool, directoryEntryTool)
            .build();

      log.info("AI Service initialized successfully");
   }

   public String handleUserPrompt(String prompt) {
      String today = LocalDateTime.now()
            .format(DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy HH:mm:ss", Locale.FRENCH));

      String response = assistant.chat(prompt, today);
      return cleanResponse(response);
   }

   private String cleanResponse(String response) {
      if (response == null) {
         return "";
      }
      // Supprime les caractères de formatage markdown courants au début des lignes
      // (tirets, étoiles, dièses suivis d'un espace)
      String cleaned = response.replaceAll("(?m)^[\\s*\\-#]+ ", "");
      // Supprime les étoiles ou tirets isolés
      cleaned = cleaned.replace("*", "").replace("- ", " ");
      // Nettoie les espaces multiples et les lignes vides excessives
      return cleaned.trim();
   }

}