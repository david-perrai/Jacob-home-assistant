package com.davidperrai.jacob.core.shoppinglist.agent;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.davidperrai.jacob.common.dto.Response;
import com.davidperrai.jacob.common.service.SseService;
import com.davidperrai.jacob.core.shoppinglist.dto.ShoppingListItemDto;
import com.davidperrai.jacob.core.shoppinglist.entity.ShoppingList;
import com.davidperrai.jacob.core.shoppinglist.service.ShoppingListService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@AllArgsConstructor
public class ShoppingListTool {

    private final ShoppingListService shoppingListService;
    private final SseService sseService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Tool("""
            Récupère le contenu actuel de la liste de courses.
            À utiliser pour savoir ce qui est déjà présent dans la liste.
            """)
    public Response findAll() {
        List<ShoppingList> shoppingLists = shoppingListService.findAllShoppingList();
        return new Response("voici la liste de courses", shoppingLists);
    }

    @Tool("Ajoute des articles à la liste de courses.")
    public Response createShoppingList(
            @P("The list of items as a JSON string. Example: '[{\"name\": \"riz\", \"quantity\": 1}]'") String items) {
        try {
            // On force la désérialisation manuelle de la String reçue
            List<ShoppingListItemDto> itemList = objectMapper.readValue(items,
                    new TypeReference<List<ShoppingListItemDto>>() {
                    });

            itemList.forEach(item -> shoppingListService.createShoppingList(item.getName(), item.getQuantity()));

            sseService.sendEvent("shoppingList", Map.of("data", itemList, "type", "ShoppingList.add"));
            return new Response("La liste a été mise à jour", itemList);

        } catch (Exception e) {
            log.error("Erreur lors du parsing JSON des articles: {}", items, e);
            return new Response("Erreur de format d'articles", null);
        }
    }

    @Tool("""
            Supprime TOUS les articles de la liste de courses (la vide entièrement).
            À utiliser pour les commandes comme "vide la liste", "supprime tout", "efface ma liste".
            Appelez cet outil même si vous pensez que la liste peut être vide pour confirmer l'action à l'utilisateur.
            """)
    public Response deleteShoppingList() {
        log.info("Suppression de la liste de courses");
        shoppingListService.deleteShoppingList();
        sseService.sendEvent("shoppingList", Map.of("data", "", "type", "ShoppingList.delete"));
        return new Response("la liste de courses a bien été supprimée", null);
    }
}
