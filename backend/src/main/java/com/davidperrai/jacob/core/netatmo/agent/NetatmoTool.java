package com.davidperrai.jacob.core.netatmo.agent;

import org.springframework.stereotype.Component;

import com.davidperrai.jacob.common.dto.Response;
import com.davidperrai.jacob.common.service.SseService;
import com.davidperrai.jacob.core.netatmo.service.NetatmoService;

import dev.langchain4j.agent.tool.Tool;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Component
@Slf4j
@AllArgsConstructor
public class NetatmoTool {

    private final NetatmoService netatmoService;
    private final SseService sseService;

    @Tool(
        """
        Récupère la température mesurée et de consigne par le thermostat Netatmo dans les différentes pièces de la maison.
        """
    )
    public Response getHomeTemperatures() {
        try {
            Map<String, Object> data = netatmoService.getRoomsTemperatures();
            
            @SuppressWarnings("unchecked")
            Map<String, Map<String, Object>> rooms = (Map<String, Map<String, Object>>) data.get("rooms");
            
            if (rooms == null || rooms.isEmpty()) {
                return new Response("Aucune information de température n'a pu être récupérée pour le moment.", null);
            }

            StringBuilder sb = new StringBuilder("Voici les températures relevées :\n");
            for (Map.Entry<String, Map<String, Object>> entry : rooms.entrySet()) {
                String roomName = entry.getKey();
                Map<String, Object> info = entry.getValue();
                Double temp = (Double) info.get("temperature");
                if (temp != null) {
                    sb.append("- ").append(roomName).append(" : ").append(temp).append("°C");
                    Double setpoint = (Double) info.get("setpoint");
                    if (setpoint != null) {
                        sb.append(" (consigne : ").append(setpoint).append("°C)");
                    }
                    sb.append("\n");
                }
            }

            return new Response(sb.toString(), data);
        } catch (Exception e) {
            log.error("Error checking Netatmo temperatures in tool", e);
            return new Response("Erreur lors de la récupération des températures Netatmo : " + e.getMessage(), null);
        }
    }

    @Tool(
        """
        Définit la température souhaitée (température de consigne) pour le salon.
        """
    )
    public Response setRoomTemperature(double temperature) {
        String roomName = "Salon";
        try {
            netatmoService.setRoomTemperature(roomName, temperature);
            sseService.sendEvent("netatmo", Map.of("type", "Netatmo.temperature.set"));
            return new Response("La température de consigne pour " + roomName + " a été réglée avec succès à " + temperature + "°C.", null);
        } catch (Exception e) {
            log.error("Error setting Netatmo temperature in tool for room {}", roomName, e);
            return new Response("Erreur lors du réglage de la température de consigne pour " + roomName + " : " + e.getMessage(), null);
        }
    }
}
