package com.davidperrai.jacob.core.ai.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.davidperrai.jacob.configuration.AssistantInterface;
import com.davidperrai.jacob.core.googlecalendar.agent.GoogleCalendarTool;
import com.davidperrai.jacob.core.googlemap.agent.DirectoryEntryTool;
import com.davidperrai.jacob.core.netatmo.agent.NetatmoTool;
import com.davidperrai.jacob.core.shoppinglist.agent.ShoppingListTool;
import com.davidperrai.jacob.core.tv.TvCommandIntent;
import com.davidperrai.jacob.core.tv.agent.LgtvBrokerTool;
import com.davidperrai.jacob.core.weather.agent.WeatherTool;

import dev.langchain4j.mcp.McpToolProvider;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.rag.RetrievalAugmentor;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.tool.ToolArgumentsErrorHandler;
import dev.langchain4j.service.tool.ToolExecutionErrorHandler;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

   private final ChatModel model;
   private final GoogleCalendarTool googleCalendarTool;
   private final ShoppingListTool shoppingListTool;
   private final DirectoryEntryTool directoryEntryTool;
   private final WeatherTool weatherTool;
   private final NetatmoTool netatmoTool;
   private final LgtvBrokerTool lgtvBrokerTool;
   private final McpToolProvider mcpToolProvider;
   private final RetrievalAugmentor retrievalAugmentor;

   private AssistantInterface assistant;

   @PostConstruct
   public void init() {

      // Build assistant with all components
      assistant = AiServices.builder(AssistantInterface.class)
            .chatModel(model)
            // .retrievalAugmentor(retrievalAugmentor)
            .chatMemoryProvider(memoryId -> MessageWindowChatMemory.withMaxMessages(100))
            .tools(
               googleCalendarTool,
               directoryEntryTool,
               weatherTool,
               netatmoTool,
               lgtvBrokerTool,
               shoppingListTool
            )
            .toolProvider(mcpToolProvider)           
            .toolArgumentsErrorHandler(ToolArgumentsErrorHandler.sendExceptionMessageToLlm())
            .toolExecutionErrorHandler(ToolExecutionErrorHandler.failInvocationUnlessVisibleToLlm())
            .build();

      log.info("AI Service initialized successfully");
   }

   public String handleUserPrompt(String prompt) {
      try {
          var tvCommand = TvCommandIntent.detect(prompt);
         if (tvCommand.isPresent()) {
            log.info("Executing explicit TV command: {}", tvCommand.get());
            return cleanResponse(lgtvBrokerTool.execute(tvCommand.get()).getMessage());
         }

         String today = LocalDateTime.now()
               .format(DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy HH:mm:ss", Locale.FRENCH));

         String response = assistant.chat(prompt, today, "home");
         return cleanResponse(response);
      } catch (Exception e) {
         log.error("Error processing prompt: {}", prompt, e);
         return "Désolé, une erreur est survenue lors du traitement de votre demande.";
      }

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