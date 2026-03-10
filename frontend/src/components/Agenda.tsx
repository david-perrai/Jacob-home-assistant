import { useState, useEffect } from 'react';

interface CalendarEvent {
    id: string;
    summary: string;
    start: {
        date?: { value: number };
        dateTime?: { value: number };
    };
    end: {
        date?: { value: number };
        dateTime?: { value: number };
    };
    eventType: string;
    htmlLink: string;
}

export function Agenda() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('/api/calendar/events');
                if (!response.ok) throw new Error('Erreur lors de la récupération de l\'agenda');
                const data = await response.json();
                setEvents(data);
            } catch (err) {
                setError("Impossible de charger l'agenda");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
        // Refresh every hour
        const interval = setInterval(fetchEvents,  60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const formatDate = (event: CalendarEvent) => {
        const timestamp = event.start.date?.value || event.start.dateTime?.value;
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short'
        });
    };

    if (loading) return <div className="agenda-status">Chargement de l'agenda...</div>;
    if (error) return <div className="agenda-status error-text">{error}</div>;

    return (
        <>
            <div className="card-header">
                <span className="icon">📅</span>
                <h2>Agenda</h2>
            </div>
            <div className="agenda-content">
                <ul className="event-list">
                    {events.length > 0 ? (
                        events.map((event) => (
                            <li key={event.id} className="event-item">
                                <span className="event-date">{formatDate(event)}</span>
                                <span className="event-summary" title={event.summary}>
                                    {event.summary}
                                </span>
                            </li>
                        ))
                    ) : (
                        <li className="empty-list">Aucun événement prévu</li>
                    )}
                </ul>
            </div>
        </>
    );
}