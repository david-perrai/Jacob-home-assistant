package com.davidperrai.jacob.core.rag.service;

import java.io.IOException;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.document.parser.apache.tika.ApacheTikaDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocumentIngestionService {

    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;

    @Value("${rag.chunk-size:500}")
    private int chunkSize;

    @Value("${rag.chunk-overlap:100}")
    private int chunkOverlap;

    private final ApacheTikaDocumentParser documentParser = new ApacheTikaDocumentParser();

    public String ingest(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le fichier est vide.");
        }

        String filename = cleanFilename(file.getOriginalFilename());
        String extension = extensionOf(filename);
        if (!extension.equals("pdf") && !extension.equals("txt")) {
            throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Seuls les fichiers PDF et TXT sont acceptés.");
        }

        Document parsedDocument;
        try (var inputStream = file.getInputStream()) {
            parsedDocument = documentParser.parse(inputStream);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Le contenu du fichier n'a pas pu être lu.",
                    exception);
        }

        String text = parsedDocument.text();
        if (text == null || text.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aucun texte n'a été extrait du fichier.");
        }

        Metadata metadata = parsedDocument.metadata().copy()
                .put(Document.FILE_NAME, filename)
                .put("source", filename);
        Document document = Document.from(text, metadata);

        EmbeddingStoreIngestor.builder()
                .embeddingModel(embeddingModel)
                .embeddingStore(embeddingStore)
                .documentSplitter(DocumentSplitters.recursive(chunkSize, chunkOverlap))
                .build()
                .ingest(document);

        return filename;
    }

    private String cleanFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nom du fichier est manquant.");
        }
        String filename = originalFilename.replace('\\', '/');
        return filename.substring(filename.lastIndexOf('/') + 1);
    }

    private String extensionOf(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex < 0 ? "" : filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }
}
