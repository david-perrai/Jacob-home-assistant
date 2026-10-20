import { useEffect, useRef, useState, type TouchEvent } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import frLocale from "@fullcalendar/core/locales/fr";
import type { DatesSetArg } from "@fullcalendar/core";

export interface CalendarEvent {
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

interface AgendaProps {
  showHeading?: boolean;
  dailyNavigation?: boolean;
}

export function Agenda({
  showHeading = true,
  dailyNavigation = false,
}: AgendaProps = {}) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isToday, setIsToday] = useState(true);
  const [slideDirection, setSlideDirection] = useState<
    "previous" | "next" | null
  >(null);
  const [month, setMonth] = useState(() => {
    const currentDate = new Date();
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    const abortController = new AbortController();

    const fetchEvents = async () => {
      try {
        const response = await fetch(`/api/calendar/events?month=${month}`, {
          signal: abortController.signal,
        });
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
    if (dailyNavigation) {
      const today = new Date();
      setIsToday(
        currentStart.getFullYear() === today.getFullYear() &&
          currentStart.getMonth() === today.getMonth() &&
          currentStart.getDate() === today.getDate(),
      );
    }
  };

  const animateNavigation = (
    direction: "previous" | "next",
    navigate: () => void,
  ) => {
    setSlideDirection(direction);
    navigate();
    window.setTimeout(() => setSlideDirection(null), 280);
  };

  const navigateDay = (direction: "previous" | "next") => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    animateNavigation(direction, () => {
      if (direction === "previous") calendarApi.prev();
      else calendarApi.next();
    });
  };

  const returnToToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    const direction =
      localDateString(calendarApi.getDate().getTime()) <
      localDateString(Date.now())
        ? "next"
        : "previous";
    animateNavigation(direction, () => calendarApi.today());
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!dailyNavigation || event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }

    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) {
      return;
    }

    navigateDay(deltaX > 0 ? "previous" : "next");
  };

  return (
    <>
      {showHeading && (
        <div className="card-header">
          <span className="icon">📅</span>
          <h2>Agenda</h2>
        </div>
      )}
      {loading ? (
        <div className="agenda-status">Chargement de l'agenda...</div>
      ) : error ? (
        <div className="agenda-status error-text">{error}</div>
      ) : (
        <div
          className={[
            "agenda-calendar",
            dailyNavigation && "agenda-calendar-daily",
            dailyNavigation && isToday && "agenda-calendar-today",
            slideDirection && `agenda-calendar-slide-${slideDirection}`,
          ]
            .filter(Boolean)
            .join(" ")}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
            initialView={dailyNavigation ? "dayGridDay" : "dayGridMonth"}
            locale={frLocale}
            headerToolbar={
              dailyNavigation
                ? {
                    left: "previousDay,nextDay",
                    center: "title",
                    right: "returnToToday,dayGridDay,listDay",
                  }
                : {
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,listMonth",
                  }
            }
            customButtons={
              dailyNavigation
                ? {
                    previousDay: {
                      text: "‹",
                      hint: "Jour précédent",
                      click: () => navigateDay("previous"),
                    },
                    nextDay: {
                      text: "›",
                      hint: "Jour suivant",
                      click: () => navigateDay("next"),
                    },
                    returnToToday: {
                      text: "Aujourd'hui",
                      click: returnToToday,
                    },
                  }
                : undefined
            }
            views={{
              dayGridMonth: { buttonText: "Mois" },
              dayGridDay: { buttonText: "Jour" },
              listMonth: { buttonText: "Liste" },
              listDay: { buttonText: "Liste" },
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
