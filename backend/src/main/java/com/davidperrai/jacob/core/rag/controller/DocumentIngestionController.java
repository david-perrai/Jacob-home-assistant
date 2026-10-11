package com.davidperrai.jacob.core.rag.controller;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.davidperrai.jacob.core.rag.service.DocumentIngestionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class DocumentIngestionController {

    private final DocumentIngestionService documentIngestionService;

    @PostMapping(value = "/rag/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public IngestionResponse ingest(@RequestPart("file") MultipartFile file) throws IOException {
        String filename = documentIngestionService.ingest(file);
        return new IngestionResponse(filename, "Le document a été vectorisé avec succès.");
    }

    public record IngestionResponse(String filename, String message) {
    }
}
