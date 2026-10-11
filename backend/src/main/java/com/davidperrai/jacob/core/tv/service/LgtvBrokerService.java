package com.davidperrai.jacob.core.tv.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.davidperrai.jacob.core.tv.dto.AudioStatusDto;
import com.davidperrai.jacob.core.tv.dto.LgtvBrokerAudioStatusResponse;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class LgtvBrokerService {

    private final RestClient restClient;

    public LgtvBrokerService(
            @Value("${lgtv-broker.base-url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public void executeCommand(String command) {
        executeCommand(command, null);
    }

    public void executeCommand(String command, String option) {
        log.info("Sending LG TV command to broker: {}", command);
        Map<String, String> body = option == null
                ? Map.of("command", command)
                : Map.of("command", command, "option", option);
        restClient.post()
                .uri("/command")
                .body(body)
                .retrieve()
                .toBodilessEntity();               
    }

    public AudioStatusDto getAudioStatus() {
        log.info("Retrieving LG TV audio status from broker");
        LgtvBrokerAudioStatusResponse response = restClient.get()
                .uri("/audioStatus")
                .retrieve()
                .body(LgtvBrokerAudioStatusResponse.class);
        if (response == null || response.response() == null || !response.response().returnValue()) {
            throw new IllegalStateException("Le broker LG TV a retourné un statut audio invalide");
        }
        return response.response();
    }
}
