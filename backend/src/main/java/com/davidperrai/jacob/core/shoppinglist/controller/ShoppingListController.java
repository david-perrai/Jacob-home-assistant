package com.davidperrai.jacob.core.shoppinglist.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.davidperrai.jacob.core.shoppinglist.entity.ShoppingList;
import com.davidperrai.jacob.core.shoppinglist.service.ShoppingListService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/shoppingList")
public class ShoppingListController {

    private final ShoppingListService shoppingListService;

    @GetMapping("")
    public List<ShoppingList> getAllShoppingLists() {
        return shoppingListService.findAllShoppingList();
    }

    @PostMapping("/{id}/delete")
    public void deleteShoppingList(@PathVariable Long id) {
        shoppingListService.deleteShoppingList(id);
    }
}
