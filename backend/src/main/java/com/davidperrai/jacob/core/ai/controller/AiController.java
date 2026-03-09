package com.davidperrai.jacob.core.ai.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.davidperrai.jacob.common.service.SseService;
import com.davidperrai.jacob.core.ai.service.AiService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final SseService sseService;

    @GetMapping(value = "/prompt", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public String prompt(@RequestParam String q) {
        return aiService.handleUserPrompt(q);
    }

    @GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter SseEvents() {
        return sseService.createEmitter();
    }

}
