package com.davidperrai.jacob.core.weather.agent;

import org.springframework.stereotype.Component;

import com.davidperrai.jacob.common.dto.Response;
import com.davidperrai.jacob.core.weather.service.WeatherService;

import dev.langchain4j.agent.tool.Tool;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@AllArgsConstructor
public class WeatherTool {

    private final WeatherService weatherService;

    @Tool(
            """
            Récupère la météo pour une ville donnée.
            """
    )
    public Response getWeather(String town) {

        String weather = weatherService.getUpcomingWeather(town);
        return new Response("Voici la météo pour les prochains jours", weather);
    }
}
