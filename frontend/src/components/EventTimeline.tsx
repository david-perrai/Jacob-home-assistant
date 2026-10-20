import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import type { CalendarEvent } from "./Agenda";

interface EventTimelineProps {
  onOpenAgenda: () => void;
}

function getTimestamp(date: CalendarEvent["start"] | CalendarEvent["end"]) {
  return date.date?.value ?? date.dateTime?.value;
}

function getEventsForDay(events: CalendarEvent[], date: Date) {
  const dayStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const nextDayStart = dayStart + 24 * 60 * 60 * 1000;

  return events
    .flatMap((event) => {
      const start = getTimestamp(event.start);
      if (start === undefined) return [];

      const end =
        getTimestamp(event.end) ??
        start +
        (event.start.date !== undefined
          ? 24 * 60 * 60 * 1000
          : 30 * 60 * 1000);

      return start < nextDayStart && end > dayStart
        ? [{ event, start, end }]
        : [];
    })
    .sort((first, second) => first.start - second.start);
}

function formatEventTime(start: number, end: number, isAllDay: boolean) {
  if (isAllDay) return "Toute la journée";

  const formatTime = (timestamp: number) =>
    new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp);
  const startTime = formatTime(start);
  const endTime = formatTime(end);

  return startTime === endTime ? startTime : `${startTime} - ${endTime}`;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export default function EventTimeline({ onOpenAgenda }: EventTimelineProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const month = getMonthKey(selectedDate);
  const isToday = isSameDay(selectedDate, new Date());

  useEffect(() => {
    const abortController = new AbortController();
    setIsLoading(true);

    const fetchEvents = async () => {
      try {
        const response = await fetch(`/api/calendar/events?month=${month}`, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des événements");
        }

        const data: CalendarEvent[] = await response.json();
        setEvents(data);
        setError(null);
      } catch (fetchError) {
        if (abortController.signal.aborted) return;
        setError("Impossible de charger les événements du jour.");
        console.error(fetchError);
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    };

    void fetchEvents();
    const interval = setInterval(() => void fetchEvents(), 60 * 1000);
    return () => {
      clearInterval(interval);
      abortController.abort();
    };
  }, [month]);

  const dayEvents = getEventsForDay(events, selectedDate);
  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(selectedDate);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
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

    setSelectedDate((date) => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + (deltaX < 0 ? 1 : -1));
      return nextDate;
    });
  };

  return (
    <>
      <div className="card-header timeline-header">
        <span className="icon card-heading-icon" aria-hidden="true">
          <CalendarMonthRoundedIcon />
        </span>
        <div className="timeline-heading">
          <h2>Agenda</h2>
          <p>{dateLabel}</p>
        </div>
        {!isToday && (
          <button
            type="button"
            className="timeline-today-button"
            onClick={() => setSelectedDate(new Date())}
          >
            Aujourd’hui
          </button>
        )}
      </div>

      <div
        className="timeline-day-content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading ? (
          <p className="timeline-status" role="status">
            Chargement des événements…
          </p>
        ) : error ? (
          <p className="timeline-status error-text" role="alert">
            {error}
          </p>
        ) : dayEvents.length === 0 ? (
          <p className="timeline-status">
            Aucun événement prévu {isToday ? "aujourd’hui." : "ce jour-là."}
          </p>
        ) : (
          <ol className="event-timeline">
            {dayEvents.map(({ event, start, end }) => (
              <li className="event-timeline-item" key={event.id}>
                <time
                  className="event-timeline-time"
                  dateTime={new Date(start).toISOString()}
                >
                  {formatEventTime(start, end, event.start.date !== undefined)}
                </time>
                <div className="event-timeline-content">
                  <span className="event-timeline-marker" aria-hidden="true" />
                  <p className="event-timeline-title">{event.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
      <button
        type="button"
        className="timeline-calendar-link"
        onClick={onOpenAgenda}
      >
        <span>Ouvrir le calendrier</span>
        <OpenInFullRoundedIcon aria-hidden="true" />
      </button>
    </>
  );
}
