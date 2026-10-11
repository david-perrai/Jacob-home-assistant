package com.davidperrai.jacob.core.tv.dto;

public record AudioStatusDto(
        boolean returnValue,
        String scenario,
        int volume,
        boolean mute) {
}
