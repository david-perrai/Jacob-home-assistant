import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import frLocale from "@fullcalendar/core/locales/fr";
import type { DatesSetArg } from "@fullcalendar/core";

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

function localDateString(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toCalendarEvent(event: CalendarEvent) {
  const startTimestamp = event.start.date?.value ?? event.start.dateTime?.value;
  if (startTimestamp === undefined) return null;

  const isAllDay = event.start.date !== undefined;
  const endTimestamp = event.end.date?.value ?? event.end.dateTime?.value;
  const toCalendarDate = (timestamp: number) =>
    isAllDay ? localDateString(timestamp) : new Date(timestamp);

  return {
    id: event.id,
    title: event.summary,
    start: toCalendarDate(startTimestamp),
    ...(endTimestamp !== undefined && { end: toCalendarDate(endTimestamp) }),
    allDay: isAllDay,
    url: event.htmlLink || undefined,
  };
}

export function Agenda() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const currentDate = new Date();
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    const abortController = new AbortController();

    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `/api/calendar/events?month=${month}`,
          { signal: abortController.signal },
        );
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération de l'agenda");
        }
        const data: CalendarEvent[] = await response.json();
        setEvents(data);
        setError(null);
      } catch (err) {
        if (abortController.signal.aborted) return;
        setError("Impossible de charger l'agenda");
        console.error(err);
      } finally {
        if (!abortController.signal.aborted) setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 60 * 1000);
    return () => {
      clearInterval(interval);
      abortController.abort();
    };
  }, [month]);

  const handleDatesSet = (dateInfo: DatesSetArg) => {
    const currentStart = dateInfo.view.currentStart;
    setMonth(
      `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  return (
    <>
      <div className="card-header">
        <span className="icon">📅</span>
        <h2>Agenda</h2>
      </div>
      {loading ? (
        <div className="agenda-status">Chargement de l'agenda...</div>
      ) : error ? (
        <div className="agenda-status error-text">{error}</div>
      ) : (
        <div className="agenda-calendar">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            locale={frLocale}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,listMonth",
            }}
            views={{
              dayGridMonth: { buttonText: "Mois" },
              listMonth: { buttonText: "Liste" },
            }}
            events={events.flatMap((event) => {
              const calendarEvent = toCalendarEvent(event);
              return calendarEvent ? [calendarEvent] : [];
            })}
            datesSet={handleDatesSet}
            fixedWeekCount={false}
            dayMaxEventRows={3}
            height="auto"
            eventDisplay="block"
            navLinks
          />
        </div>
      )}
    </>
  );
}
