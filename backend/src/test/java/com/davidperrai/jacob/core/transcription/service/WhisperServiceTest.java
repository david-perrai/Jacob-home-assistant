package com.davidperrai.jacob.core.transcription.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.sun.net.httpserver.HttpServer;

class WhisperServiceTest {

    @Test
    void sendsAudioAsMultipartAndReturnsWhisperText() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        AtomicReference<String> contentType = new AtomicReference<>();
        AtomicReference<byte[]> requestBody = new AtomicReference<>();
        server.createContext("/inference", exchange -> {
            contentType.set(exchange.getRequestHeaders().getFirst("Content-Type"));
            requestBody.set(exchange.getRequestBody().readAllBytes());
            byte[] response = "{\"text\":\" Bonjour Jacob.\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        try {
            WhisperService service = new WhisperService(
                    "http://127.0.0.1:" + server.getAddress().getPort());
            MockMultipartFile audio = new MockMultipartFile(
                    "audio", "recording.wav", "audio/wav", new byte[] { 1, 2, 3, 4 });

            assertEquals("Bonjour Jacob.", service.transcribe(audio));

            String body = new String(requestBody.get(), StandardCharsets.ISO_8859_1);
            assertTrue(contentType.get().startsWith("multipart/form-data; boundary="));
            assertTrue(body.contains("name=\"file\"; filename=\"recording.wav\""));
            assertTrue(body.contains("name=\"language\"\r\n\r\nfr"));
            assertTrue(body.contains("name=\"response_format\"\r\n\r\njson"));
            assertTrue(body.contains("\r\n\r\n\u0001\u0002\u0003\u0004\r\n"));
        } finally {
            server.stop(0);
        }
    }
}
