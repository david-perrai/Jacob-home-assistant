package com.davidperrai.jacob.core.shoppinglist.agent;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.davidperrai.jacob.common.dto.Response;
import com.davidperrai.jacob.common.service.SseService;
import com.davidperrai.jacob.core.shoppinglist.entity.ShoppingList;
import com.davidperrai.jacob.core.shoppinglist.service.ShoppingListService;

import dev.langchain4j.agent.tool.Tool;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@AllArgsConstructor
public class ShoppingListTool {

    private final ShoppingListService shoppingListService;
    private final SseService sseService;

    @Tool("""
            Récupère le contenu actuel de la liste de courses.
            À utiliser pour savoir ce qui est déjà présent dans la liste.
            """)
    public Response findAll() {
        List<ShoppingList> shoppingLists = shoppingListService.findAllShoppingList();
        return new Response("voici la liste de courses", shoppingLists);
    }

    @Tool("""
            Ajoute un nouvel article avec sa quantité à la liste de courses.
            """)
    public Response createShoppingList(String name, int quantity) {
        ShoppingList shoppingList = shoppingListService.createShoppingList(name, quantity);
        sseService.sendEvent("shoppingList", Map.of("data", shoppingList, "type", "ShoppingList.add"));
        return new Response("la liste de courses a bien été créée", shoppingList);
    }

    @Tool("""
            Supprime TOUS les articles de la liste de courses (la vide entièrement).
            À utiliser pour les commandes comme "vide la liste", "supprime tout", "efface ma liste".
            Appelez cet outil même si vous pensez que la liste peut être vide pour confirmer l'action à l'utilisateur.
            """)
    public Response deleteShoppingList() {
        shoppingListService.deleteShoppingList();
        sseService.sendEvent("shoppingList", Map.of("data", null, "type", "ShoppingList.delete"));
        return new Response("la liste de courses a bien été supprimée", null);
    }
}
