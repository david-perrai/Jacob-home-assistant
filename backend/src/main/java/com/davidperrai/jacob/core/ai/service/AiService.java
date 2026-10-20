package com.davidperrai.jacob.core.ai.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.davidperrai.jacob.configuration.AssistantInterface;
import com.davidperrai.jacob.core.googlecalendar.agent.GoogleCalendarTool;
import com.davidperrai.jacob.core.googlemap.agent.DirectoryEntryTool;
import com.davidperrai.jacob.core.netatmo.agent.NetatmoTool;
import com.davidperrai.jacob.core.recipe.agent.RecipeTool;
import com.davidperrai.jacob.core.shoppinglist.agent.ShoppingListTool;
import com.davidperrai.jacob.core.tv.TvCommandIntent;
import com.davidperrai.jacob.core.tv.agent.LgtvBrokerTool;
import com.davidperrai.jacob.core.weather.agent.WeatherTool;

import dev.langchain4j.data.message.Content;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.PdfFileContent;
import dev.langchain4j.data.message.TextContent;
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
   private final RecipeTool recipeTool;
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
               shoppingListTool,
               recipeTool
            )
            .toolProvider(mcpToolProvider)           
            .toolArgumentsErrorHandler(ToolArgumentsErrorHandler.sendExceptionMessageToLlm())
            .toolExecutionErrorHandler(ToolExecutionErrorHandler.failInvocationUnlessVisibleToLlm())
            .build();

      log.info("AI Service initialized successfully");
   }

   public String handleUserPrompt(String prompt) {
      return handleUserPrompt(prompt, null);
   }

   public String handleUserPrompt(String prompt, MultipartFile file) {
      List<Content> userContents = createUserContents(prompt, file);
      try {
         if (file == null) {
            var tvCommand = TvCommandIntent.detect(prompt);
            if (tvCommand.isPresent()) {
               log.info("Executing explicit TV command: {}", tvCommand.get());
               return cleanResponse(lgtvBrokerTool.execute(tvCommand.get()).getMessage());
            }
         }

         String today = LocalDateTime.now()
               .format(DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy HH:mm:ss", Locale.FRENCH));

         String response = assistant.chat(userContents, today, "home");
         return cleanResponse(response);
      } catch (Exception e) {
         log.error("Error processing prompt: {}", prompt, e);
         return "Désolé, une erreur est survenue lors du traitement de votre demande.";
      }

   }

   private List<Content> createUserContents(String prompt, MultipartFile file) {
      String request = prompt == null ? "" : prompt.trim();
      if ((request.isEmpty()) && (file == null || file.isEmpty())) {
         throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Une demande ou un fichier est requis.");
      }

      if (file == null) {
         return List.of(TextContent.from(request));
      }
      if (file.isEmpty()) {
         throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le fichier est vide.");
      }

      String filename = file.getOriginalFilename();
      if (filename == null || filename.isBlank()) {
         throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nom du fichier est manquant.");
      }
      filename = filename.replace('\\', '/');
      filename = filename.substring(filename.lastIndexOf('/') + 1);
      int dotIndex = filename.lastIndexOf('.');
      String extension = dotIndex < 0 ? "" : filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);

      if (extension.equals("pdf")) {
         String userPrompt = request.isEmpty()
               ? "Analyse le fichier joint et réponds en fonction de son contenu."
               : request;
         byte[] fileBytes = readFile(file);
         return List.of(
               TextContent.from(userPrompt),
               PdfFileContent.from(Base64.getEncoder().encodeToString(fileBytes), "application/pdf"));
      }
      if (extension.equals("txt")) {
         String fileText = new String(readFile(file), StandardCharsets.UTF_8);
         if (fileText.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le fichier texte est vide.");
         }
         String userPrompt = request.isEmpty()
               ? "Analyse le fichier joint et réponds en fonction de son contenu."
               : request;
         return List.of(
               TextContent.from(userPrompt),
               TextContent.from("Contenu du fichier " + filename + " :\n" + fileText));
      }

      String imageMimeType = imageMimeType(extension);
      if (imageMimeType != null) {
         String userPrompt = request.isEmpty()
               ? "Décris l'image jointe et réponds en fonction de son contenu."
               : request;
         return List.of(
               TextContent.from(userPrompt),
               ImageContent.from(Base64.getEncoder().encodeToString(readFile(file)), imageMimeType));
      }

      throw new ResponseStatusException(
            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
            "Seuls les fichiers PDF, TXT, JPEG, PNG et WebP sont acceptés.");
   }

   private String imageMimeType(String extension) {
      return switch (extension) {
         case "jpg", "jpeg" -> "image/jpeg";
         case "png" -> "image/png";
         case "webp" -> "image/webp";
         default -> null;
      };
   }

   private byte[] readFile(MultipartFile file) {
      try {
         return file.getBytes();
      } catch (IOException exception) {
         throw new ResponseStatusException(
               HttpStatus.INTERNAL_SERVER_ERROR,
               "Impossible de lire le fichier envoyé.",
               exception);
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