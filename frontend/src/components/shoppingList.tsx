import { useState, useEffect, useCallback } from "react";
import ShoppingListApi from "../api/ShoppingListApi";
import { ShoppingItem } from "../api/types/ShoppingItem";

const shoppingListApi = new ShoppingListApi();

interface ShoppingListProps {
  sseEventSource: EventSource | null;
}

export default function ShoppingList({ sseEventSource }: ShoppingListProps) {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  const fetchShoppingList = useCallback(async () => {
    try {
      const list = await shoppingListApi.getShoppingList();
      setShoppingList(list);
    } catch (error) {
      console.error("Failed to fetch shopping list:", error);
    }
  }, []);

  // Fetch initial
  useEffect(() => {
    fetchShoppingList();
  }, [fetchShoppingList]);

  // Écouter les événements SSE pour les mises à jour en temps réel
  useEffect(() => {
    if (!sseEventSource) return;

    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (["ShoppingList.add", "ShoppingList.delete"].includes(data.type)) {
          fetchShoppingList();
        }
      } catch (e) {
        console.error(
          "Erreur lors du parsing de l'événement SSE (shoppingList):",
          e,
        );
      }
    };

    sseEventSource.addEventListener("shoppingList", handler);

    return () => {
      sseEventSource.removeEventListener("shoppingList", handler);
    };
  }, [sseEventSource, fetchShoppingList]);

  return (
    <section className="dashboard-card shopping-card">
      <div className="card-header">
        <span className="icon">🛒</span>
        <h2>Courses</h2>
      </div>
      <ul className="shopping-list">
        {shoppingList.length > 0 ? (
          shoppingList.map((item) => (
            <li key={item.id}>
              <span>🛒</span> {item.name}{" "}
              {item.quantity > 1 && `(x${item.quantity})`}
            </li>
          ))
        ) : (
          <li className="empty-list">Aucun article</li>
        )}
      </ul>
    </section>
  );
}
