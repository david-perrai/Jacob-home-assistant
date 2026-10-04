package com.davidperrai.jacob.core.googlecalendar.agent;

import java.util.List;

import org.springframework.stereotype.Component;

import com.davidperrai.jacob.common.dto.Response;
import com.davidperrai.jacob.core.googlecalendar.service.GoogleCalendarService;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;

import dev.langchain4j.agent.tool.Tool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class GoogleCalendarTool {

    private final GoogleCalendarService calendarService;

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
