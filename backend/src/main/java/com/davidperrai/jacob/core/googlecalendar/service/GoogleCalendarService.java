package com.davidperrai.jacob.core.googlecalendar.service;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.util.DateTime;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.CalendarList;
import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.Event;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Service;

import com.google.api.client.json.gson.GsonFactory;

@Service
@PropertySource("file:backend/secrets.properties")
public class GoogleCalendarService {

        @Value("${google.calendar.id}")
        private String calendarId;

        private static final String TOKENS_DIRECTORY_PATH = "tokens";
        private static final GsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

        // Scope pour lire les événements
        private static final List<String> SCOPES = Collections.singletonList(CalendarScopes.CALENDAR_READONLY);

        public List<Event> getUpcomingEvents() throws IOException, GeneralSecurityException {
                final NetHttpTransport HTTP_TRANSPORT = new NetHttpTransport();

                // Charger le fichier credentials.json depuis les resources
                InputStream in = GoogleCalendarService.class.getResourceAsStream("/client_secret.json");
                GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in));

                // Configurer le stockage local du jeton
                GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                                HTTP_TRANSPORT, JSON_FACTORY, clientSecrets, SCOPES)
                                .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(TOKENS_DIRECTORY_PATH)))
                                .setAccessType("offline")
                                .build();

                LocalServerReceiver receiver = new LocalServerReceiver.Builder().setPort(8888).build();
                Credential credential = new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");

                // Créer le service Calendar
                Calendar service = new Calendar.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential)
                                .setApplicationName("jacob")
                                .build();

                // Récupérer les 5 prochains événements
                DateTime now = new DateTime(System.currentTimeMillis());
                // utiliser primary pour le compte principale ou l'adresse email du compte
                // partagé
                return service.events().list(calendarId)
                                .setMaxResults(5)
                                .setTimeMin(now)
                                .setOrderBy("startTime")
                                .setSingleEvents(true)
                                .execute()
                                .getItems();
        }
}