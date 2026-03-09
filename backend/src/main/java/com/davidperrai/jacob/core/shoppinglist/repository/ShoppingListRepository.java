package com.davidperrai.jacob.core.shoppinglist.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.davidperrai.jacob.core.shoppinglist.entity.ShoppingList;

@Repository
public interface ShoppingListRepository extends JpaRepository<ShoppingList, Long> {

}
