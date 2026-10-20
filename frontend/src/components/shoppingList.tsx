import { Alert } from "@mui/material";
import ShoppingBasketRoundedIcon from "@mui/icons-material/ShoppingBasketRounded";
import { useCallback, useEffect, useState } from "react";
import ShoppingListApi from "../api/ShoppingListApi";
import { ShoppingItem } from "../api/types/ShoppingItem";

const shoppingListApi = new ShoppingListApi();

interface ShoppingListProps {
  sseEventSource: EventSource | null;
}

export default function ShoppingList({ sseEventSource }: ShoppingListProps) {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchShoppingList = useCallback(async () => {
    try {
      const list = await shoppingListApi.getShoppingList();
      setShoppingList(list);
    } catch (error) {
      console.error("Failed to fetch shopping list:", error);
    }
  }, []);

  const handleDelete = async (id: number) => {
    setDeletingItemId(id);
    setDeleteError(null);
    try {
      await shoppingListApi.deleteShoppingListItem(id);
      setShoppingList((items) => items.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete shopping list item:", error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer cet article.",
      );
    } finally {
      setDeletingItemId(null);
    }
  };

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
      <div className="card-header shopping-card-header">
        <span className="icon card-heading-icon" aria-hidden="true">
          <ShoppingBasketRoundedIcon />
        </span>
        <div>
          <h2>Courses</h2>
          <p>À ne pas oublier</p>
        </div>
      </div>
      {deleteError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {deleteError}
        </Alert>
      )}
      <ul
        className={
          shoppingList.length > 10
            ? "shopping-list shopping-list-two-columns"
            : "shopping-list"
        }
      >
        {shoppingList.length > 0 ? (
          shoppingList.map((item) => (
            <li className="shopping-item" key={item.id}>
              <span className="shopping-item-name">
                {item.name} {item.quantity > 1 && `(x${item.quantity})`}
              </span>
              <button
                type="button"
                className="shopping-item-delete"
                aria-label={`Supprimer ${item.name}`}
                title={`Supprimer ${item.name}`}
                disabled={deletingItemId !== null}
                onClick={() => void handleDelete(item.id)}
              >
                ×
              </button>
            </li>
          ))
        ) : (
          <li className="empty-list">Aucun article</li>
        )}
      </ul>
    </section>
  );
}
