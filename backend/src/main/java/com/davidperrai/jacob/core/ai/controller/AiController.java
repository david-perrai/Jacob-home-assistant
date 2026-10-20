package com.davidperrai.jacob.core.ai.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.davidperrai.jacob.common.service.SseService;
import com.davidperrai.jacob.core.ai.service.AiService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final SseService sseService;

    @PostMapping(value = "/prompt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
    public String prompt(
            @RequestParam(required = false) String q,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return aiService.handleUserPrompt(q, file);
    }

    @GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter SseEvents() {
        return sseService.createEmitter();
    }

}
