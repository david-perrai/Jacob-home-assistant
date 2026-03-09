import { useEffect } from 'react';



const shoppingListEventListener = (onShoppingListUpdate: () => void) => (event: MessageEvent) => {
  try {
    const data = JSON.parse(event.data);
    if (['ShoppingList.add', 'ShoppingList.delete'].includes(data.type)) {
      onShoppingListUpdate();
    }
  } catch (e) {
    console.error('Erreur lors du parsing de l\'événement SSE (shoppingList):', e);
  }
}

const directoryEntryEventListener = (onNavigation: (url: string) => void) => (event: MessageEvent) => {
  try {
    const data = JSON.parse(event.data);
    if (['DirectoryEntry.navigateTo'].includes(data.type)) {
      // Actually, for a simple iframe without API key (embed mode), we can use:
      const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(data.data)}&output=embed`;
      onNavigation(embedUrl);
    }
  } catch (e) {
    console.error('Erreur lors du parsing de l\'événement SSE (directoryEntry):', e);
  }
}



/**
 * Hook to handle Server-Sent Events (SSE) for real-time updates.
 * 
 * @param onShoppingListUpdate Callback called when a shopping list update event is received.
 * @param onNavigation Callback called when a navigation event is received.
 */
export const useSSE = (onShoppingListUpdate: () => void, onNavigation: (url: string) => void) => {
  useEffect(() => {
    const eventSource = new EventSource('/api/sse');

    // Handle shopping list updates
    eventSource.addEventListener('shoppingList', shoppingListEventListener(onShoppingListUpdate));

    // Handle directory entry updates (navigation)
    eventSource.addEventListener('directoryEntry', directoryEntryEventListener(onNavigation));

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('Erreur SSE:', error);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [onShoppingListUpdate, onNavigation]);
};
