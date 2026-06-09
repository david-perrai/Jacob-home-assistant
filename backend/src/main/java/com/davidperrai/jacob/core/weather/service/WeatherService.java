package com.davidperrai.jacob.core.weather.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

import org.springframework.stereotype.Service;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class WeatherService {

    public String getUpcomingWeather(String town) {
        try {
            String encodedTown = URLEncoder.encode(town, StandardCharsets.UTF_8.toString());
            String url = "http://api.weatherapi.com/v1/current.json?key=e2acaf1e167e4734ab5205509260903&q=" + encodedTown + "&aqi=no&lang=fr";
            
            HttpClient httpClient = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.body();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return "";
    }
}