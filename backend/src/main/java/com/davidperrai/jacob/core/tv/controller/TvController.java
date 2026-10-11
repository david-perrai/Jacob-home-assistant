package com.davidperrai.jacob.core.tv.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.davidperrai.jacob.core.tv.dto.AudioStatusDto;
import com.davidperrai.jacob.core.tv.service.LgtvBrokerService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/tv")
@RequiredArgsConstructor
public class TvController {

    private final LgtvBrokerService lgtvBrokerService;

    @GetMapping("/audioStatus")
    public AudioStatusDto getAudioStatus() {
        return lgtvBrokerService.getAudioStatus();
    }
}
