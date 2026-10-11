package com.davidperrai.jacob.core.googlecalendar.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Service;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.Events;

@Service
@PropertySource("file:backend/secrets.properties")
public class GoogleCalendarService {

        @Value("${google.calendar.id}")
        private String calendarId;

        // Separate token storage so Google prompts for consent to the new write scope.
        private static final String TOKENS_DIRECTORY_PATH = "tokens-calendar-events";
        private static final GsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
        private static final DateTimeFormatter RFC3339_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

        private static final List<String> SCOPES = Collections.singletonList(CalendarScopes.CALENDAR_EVENTS);

        public List<Event> getUpcomingEvents() throws IOException, GeneralSecurityException {
                Calendar service = getCalendarService();

                // Récupérer les 5 prochains événements
                DateTime now = new DateTime(System.currentTimeMillis());
                // utiliser primary pour le compte principale ou l'adresse email du compte
                // partagé
                return service.events().list(calendarId)
                                .setMaxResults(10)
                                .setTimeMin(now)
                                .setOrderBy("startTime")
                                .setSingleEvents(true)
                                .execute()
                                .getItems();
        }

        public List<Event> getEventsForMonth(YearMonth month) throws IOException, GeneralSecurityException {
                ZoneId zone = ZoneId.systemDefault();
                DateTime monthStart = DateTime.parseRfc3339(
                                month.atDay(1).atStartOfDay(zone).format(RFC3339_FORMATTER));
                DateTime nextMonthStart = DateTime.parseRfc3339(
                                month.plusMonths(1).atDay(1).atStartOfDay(zone).format(RFC3339_FORMATTER));

                Calendar service = getCalendarService();
                List<Event> events = new ArrayList<>();
                String pageToken = null;
                do {
                        Events page = service.events().list(calendarId)
                                        .setTimeMin(monthStart)
                                        .setTimeMax(nextMonthStart)
                                        .setMaxResults(2500)
                                        .setOrderBy("startTime")
                                        .setSingleEvents(true)
                                        .setPageToken(pageToken)
                                        .execute();
                        if (page.getItems() != null) {
                                events.addAll(page.getItems());
                        }
                        pageToken = page.getNextPageToken();
                } while (pageToken != null);

                return events;
        }

        public Event createEvent(String summary, LocalDateTime start, LocalDateTime end)
                        throws IOException, GeneralSecurityException {
                if (summary == null || summary.isBlank()) {
                        throw new IllegalArgumentException("Event summary must not be blank");
                }
                if (start == null || end == null || !end.isAfter(start)) {
                        throw new IllegalArgumentException("Event end must be after its start");
                }

                ZoneId zone = ZoneId.systemDefault();
                Event event = new Event()
                                .setSummary(summary.trim())
                                .setStart(toEventDateTime(start, zone))
                                .setEnd(toEventDateTime(end, zone));

                return getCalendarService().events().insert(calendarId, event).execute();
        }

        private EventDateTime toEventDateTime(LocalDateTime dateTime, ZoneId zone) {
                DateTime value = DateTime.parseRfc3339(
                                dateTime.atZone(zone).format(RFC3339_FORMATTER));
                return new EventDateTime()
                                .setDateTime(value)
                                .setTimeZone(zone.getId());
        }

        private Calendar getCalendarService() throws IOException, GeneralSecurityException {
                final NetHttpTransport HTTP_TRANSPORT = new NetHttpTransport();
                InputStream in = GoogleCalendarService.class.getResourceAsStream("/client_secret.json");
                GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in));

                GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                                HTTP_TRANSPORT, JSON_FACTORY, clientSecrets, SCOPES)
                                .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(TOKENS_DIRECTORY_PATH)))
                                .setAccessType("offline")
                                .build();

                LocalServerReceiver receiver = new LocalServerReceiver.Builder().setPort(8888).build();
                Credential credential = new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");

                return new Calendar.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential)
                                .setApplicationName("jacob")
                                .build();
        }
}