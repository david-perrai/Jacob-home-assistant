package com.davidperrai.jacob.core.googlecalendar.agent;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Component;

import com.davidperrai.jacob.common.dto.Response;
import com.davidperrai.jacob.core.googlecalendar.service.GoogleCalendarService;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class GoogleCalendarTool {

    private final GoogleCalendarService calendarService;

    private static final DateTimeFormatter EVENT_DATE_FORMAT =
            DateTimeFormatter.ofPattern("EEEE d MMMM 'à' HH:mm", Locale.FRENCH);

    @Tool("""
            Lit les cinq prochains événements de l'agenda Google Calendar, avec leur date, heure et lieu si disponible.
            À utiliser lorsque l'utilisateur demande les prochains événements, son agenda ou ses rendez-vous à venir.
            """)
    public Response getUpcomingCalendarEvents() {
        try {
            List<Event> events = calendarService.getUpcomingEvents();
            if (events == null || events.isEmpty()) {
                return new Response("Aucun événement à venir n'est prévu dans l'agenda.");
            }

            StringBuilder message = new StringBuilder("Voici les prochains événements de l'agenda :");
            for (Event event : events) {
                message.append("\n- ")
                        .append(event.getSummary() == null ? "Événement sans titre" : event.getSummary());

                String date = formatStart(event.getStart());
                if (!date.isEmpty()) {
                    message.append(" — ").append(date);
                }

                if (event.getLocation() != null && !event.getLocation().isBlank()) {
                    message.append(" — ").append(event.getLocation());
                }
            }
            return new Response(message.toString());
        } catch (Exception exception) {
            log.error("Failed to retrieve upcoming Google Calendar events", exception);
            return new Response("Impossible de récupérer les prochains événements de l'agenda pour le moment.");
        }
    }

    @Tool("""
            Crée un événement avec un titre, une date et une heure de début et de fin dans l'agenda Google.
            À utiliser uniquement lorsque l'utilisateur demande explicitement de créer ou d'ajouter un événement.
            Convertis les dates relatives en date et heure locales au format ISO 8601 sans fuseau,
            par exemple 2026-10-08T14:00. Si aucune durée n'est précisée, utilise une durée d'une heure.
            Si le titre, la date ou l'heure de début manque ou est ambigu, demande une précision au lieu de créer l'événement.
            """)
    public Response createCalendarEvent(
            @P("Titre de l'événement") String summary,
            @P("Date et heure locales de début, format ISO 8601, par exemple 2026-10-08T14:00") String startDateTime,
            @P("Date et heure locales de fin, format ISO 8601, par exemple 2026-10-08T15:00") String endDateTime) {
        try {
            LocalDateTime start = LocalDateTime.parse(startDateTime);
            LocalDateTime end = LocalDateTime.parse(endDateTime);
            Event event = calendarService.createEvent(summary, start, end);
            String date = start.format(EVENT_DATE_FORMAT);
            return new Response("L'événement « " + event.getSummary() + " » a été créé pour " + date + ".");
        } catch (DateTimeParseException | IllegalArgumentException exception) {
            log.warn("Invalid date or details when creating Google Calendar event", exception);
            return new Response("L'événement n'a pas été créé : vérifiez son titre et ses horaires.");
        } catch (Exception exception) {
            log.error("Failed to create Google Calendar event", exception);
            return new Response("Impossible de créer l'événement dans l'agenda pour le moment.");
        }
    }

    private String formatStart(EventDateTime start) {
        if (start == null) {
            return "";
        }
        if (start.getDateTime() != null) {
            return start.getDateTime().toString();
        }
        if (start.getDate() != null) {
            return start.getDate().toString() + " (toute la journée)";
        }
        return "";
    }
}
