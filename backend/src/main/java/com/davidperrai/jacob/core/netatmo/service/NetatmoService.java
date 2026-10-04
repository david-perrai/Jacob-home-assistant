package com.davidperrai.jacob.core.netatmo.service;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@PropertySource("file:backend/secrets.properties")
public class NetatmoService {

    @Value("${netatmo.client.id:}")
    private String clientId;

    @Value("${netatmo.client.secret:}")
    private String clientSecret;

    @Value("${netatmo.refresh.token:}")
    private String defaultRefreshToken;

    @Value("${netatmo.home.id:}")
    private String configHomeId;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private static final String TOKEN_FILE_PATH = "tokens/netatmo_token.json";

    // In-memory cache for the tokens
    private String accessToken;
    private String refreshToken;
    private long expiresAt = 0; // Epoch milliseconds

    // Holds homeId
    private String homeId;

    // Load tokens from file or configuration
    private synchronized void loadTokens() {
        if (accessToken != null && System.currentTimeMillis() < expiresAt - 60000) {
            // Already loaded and valid for at least 1 more minute
            return;
        }

        File tokenFile = new File(TOKEN_FILE_PATH);
        if (tokenFile.exists()) {
            try {
                JsonNode root = objectMapper.readTree(tokenFile);
                this.accessToken = root.path("access_token").asText(null);
                this.refreshToken = root.path("refresh_token").asText(null);
                this.expiresAt = root.path("expires_at").asLong(0);
                log.info("Loaded Netatmo tokens from file, expires at {}", expiresAt);
            } catch (IOException e) {
                log.error("Failed to read Netatmo tokens file", e);
            }
        }

        // Fallback to default refresh token if none loaded from file
        if (this.refreshToken == null || this.refreshToken.isEmpty()) {
            this.refreshToken = defaultRefreshToken;
            log.info("Using default Netatmo refresh token from configuration");
        }
    }

    private synchronized void saveTokens(String accessToken, String refreshToken, long expiresInSeconds) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresAt = System.currentTimeMillis() + (expiresInSeconds * 1000);

        File tokenFile = new File(TOKEN_FILE_PATH);
        // Ensure parent directories exist
        tokenFile.getParentFile().mkdirs();

        Map<String, Object> tokenMap = new HashMap<>();
        tokenMap.put("access_token", accessToken);
        tokenMap.put("refresh_token", refreshToken);
        tokenMap.put("expires_at", this.expiresAt);

        try {
            objectMapper.writeValue(tokenFile, tokenMap);
            log.info("Successfully saved Netatmo tokens to file");
        } catch (IOException e) {
            log.error("Failed to save Netatmo tokens to file", e);
        }
    }

    // Refresh token using the refresh_token endpoint
    public synchronized String getValidAccessToken() throws Exception {
        loadTokens();

        if (accessToken != null && System.currentTimeMillis() < expiresAt - 30000) {
            return accessToken;
        }

        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new IllegalStateException("Netatmo refresh token is not configured. Please authorize the application first.");
        }

        log.info("Refreshing Netatmo access token...");
        
        String requestBody = "grant_type=refresh_token" +
                "&refresh_token=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8) +
                "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.netatmo.com/oauth2/token"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Failed to refresh token: status={}, body={}", response.statusCode(), response.body());
            throw new RuntimeException("Failed to refresh Netatmo token: " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String newAccessToken = root.path("access_token").asText();
        String newRefreshToken = root.path("refresh_token").asText();
        long expiresInSeconds = root.path("expires_in").asLong();

        saveTokens(newAccessToken, newRefreshToken, expiresInSeconds);
        return newAccessToken;
    }

    // Explicitly initialize/set tokens from authorization code (e.g. callback endpoint)
    public synchronized void exchangeCodeAndSave(String code, String redirectUri) throws Exception {
        log.info("Exchanging Netatmo authorization code...");

        String requestBody = "grant_type=authorization_code" +
                "&code=" + URLEncoder.encode(code, StandardCharsets.UTF_8) +
                "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                "&scope=" + URLEncoder.encode("read_thermostat write_thermostat", StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.netatmo.com/oauth2/token"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Failed to exchange code: status={}, body={}", response.statusCode(), response.body());
            throw new RuntimeException("Failed to exchange code: " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String newAccessToken = root.path("access_token").asText();
        String newRefreshToken = root.path("refresh_token").asText();
        long expiresInSeconds = root.path("expires_in").asLong();

        saveTokens(newAccessToken, newRefreshToken, expiresInSeconds);
    }

    // Helper for Authorization URL
    public String getAuthorizationUrl(String redirectUri, String state) {
        return "https://api.netatmo.com/oauth2/authorize" +
                "?client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                "&scope=" + URLEncoder.encode("read_thermostat write_thermostat", StandardCharsets.UTF_8) +
                "&state=" + URLEncoder.encode(state, StandardCharsets.UTF_8);
    }

    // Get home ID from Netatmo API (homesdata)
    public String getHomeId() throws Exception {
        if (configHomeId != null && !configHomeId.isEmpty()) {
            return configHomeId;
        }
        if (this.homeId != null) {
            return this.homeId;
        }

        String token = getValidAccessToken();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.netatmo.com/api/homesdata"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Failed to get homesdata: status={}, body={}", response.statusCode(), response.body());
            throw new RuntimeException("Failed to get homesdata: " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode homes = root.path("body").path("homes");
        if (homes.isArray() && homes.size() > 0) {
            this.homeId = homes.get(0).path("id").asText();
            return this.homeId;
        }

        throw new RuntimeException("No home found in Netatmo account.");
    }

    // Get home status from Netatmo API
    public String getHomeStatusRaw() throws Exception {
        String token = getValidAccessToken();
        String currentHomeId = getHomeId();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.netatmo.com/api/homestatus?home_id=" + URLEncoder.encode(currentHomeId, StandardCharsets.UTF_8)))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Failed to get homestatus: status={}, body={}", response.statusCode(), response.body());
            throw new RuntimeException("Failed to get homestatus: " + response.body());
        }

        return response.body();
    }

    // Retrieve temperatures for all rooms in the home
    public Map<String, Object> getRoomsTemperatures() throws Exception {
        String token = getValidAccessToken();
        
        HttpRequest topologyRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.netatmo.com/api/homesdata"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();

        HttpResponse<String> topologyResponse = httpClient.send(topologyRequest, HttpResponse.BodyHandlers.ofString());
        if (topologyResponse.statusCode() != 200) {
            throw new RuntimeException("Failed to get topology: " + topologyResponse.body());
        }

        JsonNode topologyRoot = objectMapper.readTree(topologyResponse.body());
        JsonNode homes = topologyRoot.path("body").path("homes");
        
        Map<String, String> roomIdToName = new HashMap<>();
        if (homes.isArray() && homes.size() > 0) {
            JsonNode rooms = homes.get(0).path("rooms");
            if (rooms.isArray()) {
                for (JsonNode room : rooms) {
                    roomIdToName.put(room.path("id").asText(), room.path("name").asText());
                }
            }
        }

        // Now get the real-time status
        String statusJson = getHomeStatusRaw();
        JsonNode statusRoot = objectMapper.readTree(statusJson);
        JsonNode roomsStatus = statusRoot.path("body").path("home").path("rooms");

        Map<String, Object> result = new HashMap<>();
        Map<String, Object> roomsData = new HashMap<>();

        if (roomsStatus.isArray()) {
            for (JsonNode roomStatus : roomsStatus) {
                String roomId = roomStatus.path("id").asText();
                String roomName = roomIdToName.getOrDefault(roomId, "Room " + roomId);
                
                Map<String, Object> roomInfo = new HashMap<>();
                roomInfo.put("id", roomId);
                roomInfo.put("reachable", roomStatus.path("reachable").asBoolean());
                if (roomStatus.has("therm_measured_temperature")) {
                    roomInfo.put("temperature", roomStatus.path("therm_measured_temperature").asDouble());
                }
                if (roomStatus.has("therm_setpoint_temperature")) {
                    roomInfo.put("setpoint", roomStatus.path("therm_setpoint_temperature").asDouble());
                }
                
                roomsData.put(roomName, roomInfo);
            }
        }

        result.put("homeId", getHomeId());
        result.put("rooms", roomsData);
        return result;
    }

    // Set target temperature for a specific room by its name
    public void setRoomTemperature(String roomName, double temp) throws Exception {
        String token = getValidAccessToken();
        String currentHomeId = getHomeId();

        // Find roomId from roomName
        HttpRequest topologyRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.netatmo.com/api/homesdata"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();

        HttpResponse<String> topologyResponse = httpClient.send(topologyRequest, HttpResponse.BodyHandlers.ofString());
        if (topologyResponse.statusCode() != 200) {
            throw new RuntimeException("Failed to get topology: " + topologyResponse.body());
        }

        JsonNode topologyRoot = objectMapper.readTree(topologyResponse.body());
        JsonNode homes = topologyRoot.path("body").path("homes");

        String roomId = null;
        String resolvedRoomName = null;
        if (homes.isArray() && homes.size() > 0) {
            JsonNode rooms = homes.get(0).path("rooms");
            if (rooms.isArray()) {
                int bestScore = -1;
                for (JsonNode room : rooms) {
                    String name = room.path("name").asText();
                    int score = 0;

                    if (name.equals(roomName)) {
                        score += 100;
                    } else if (name.equalsIgnoreCase(roomName)) {
                        score += 50;
                    } else if (name.toLowerCase().contains(roomName.toLowerCase()) || roomName.toLowerCase().contains(name.toLowerCase())) {
                        score += 10;
                    } else {
                        continue;
                    }

                    JsonNode moduleIds = room.path("module_ids");
                    if (moduleIds.isArray() && moduleIds.size() > 0) {
                        score += 200;
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        roomId = room.path("id").asText();
                        resolvedRoomName = name;
                    }
                }
            }
        }

        if (roomId == null) {
            throw new IllegalArgumentException("Pièce non trouvée : " + roomName);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("home_id", currentHomeId);
        body.put("room_id", roomId);
        body.put("mode", "manual");
        body.put("temp", temp);

        // 2 hours duration (7200 seconds)
        long endtime = (System.currentTimeMillis() / 1000) + 7200;
        body.put("endtime", endtime);

        String jsonBody = objectMapper.writeValueAsString(body);

        HttpRequest setRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.netatmo.com/api/setroomthermpoint"))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> setResponse = httpClient.send(setRequest, HttpResponse.BodyHandlers.ofString());

        if (setResponse.statusCode() != 200) {
            log.error("Failed to set room temperature: status={}, body={}", setResponse.statusCode(), setResponse.body());
            throw new RuntimeException("Failed to set room temperature: " + setResponse.body());
        }
        log.info("Successfully set room {} ({}) temperature to {}°C", roomName, resolvedRoomName, temp);
    }
}
