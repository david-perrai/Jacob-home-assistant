package com.davidperrai.jacob.core.shoppinglist.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.davidperrai.jacob.core.shoppinglist.entity.ShoppingList;
import com.davidperrai.jacob.core.shoppinglist.repository.ShoppingListRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ShoppingListService {

    private final ShoppingListRepository shoppingListRepository;

    @Transactional(readOnly = true)
    public List<ShoppingList> findAllShoppingList() {
        return shoppingListRepository.findAll();
    }

    public ShoppingList createShoppingList(String name, int quantity) {
        ShoppingList shoppingList = new ShoppingList();
        shoppingList.setName(name);
        shoppingList.setQuantity(quantity);
        shoppingListRepository.save(shoppingList);
        return shoppingList;
    }

    public void deleteShoppingList() {
        shoppingListRepository.deleteAll();
    }

}
