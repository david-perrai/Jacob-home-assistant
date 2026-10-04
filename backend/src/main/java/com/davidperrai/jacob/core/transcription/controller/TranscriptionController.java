package com.davidperrai.jacob.core.transcription.controller;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.davidperrai.jacob.core.transcription.service.WhisperService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class TranscriptionController {

    private final WhisperService whisperService;

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
    public String transcribe(@RequestPart("audio") MultipartFile audio) throws IOException {
        return whisperService.transcribe(audio);
    }
}
