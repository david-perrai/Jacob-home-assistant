package com.davidperrai.jacob.core.tv.dto;

public record LgtvBrokerAudioStatusResponse(
        String status,
        String command,
        AudioStatusDto response) {
}
