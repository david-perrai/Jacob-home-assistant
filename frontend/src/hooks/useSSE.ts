import { useEffect, useRef, useState } from 'react';

/**
 * Hook to create and manage a shared SSE EventSource connection.
 * Returns the EventSource instance so child components can subscribe to their own events.
 */
export const useSSE = () => {
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/sse');
    eventSourceRef.current = es;
    setEventSource(es);

    es.onerror = (error) => {
      console.error('Erreur SSE:', error);
      es.close();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  return eventSource;
};
