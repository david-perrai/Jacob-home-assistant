package com.davidperrai.jacob.core.transcription.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class WhisperService {

    private final URI inferenceUri;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public WhisperService(@Value("${whisper.base-url:http://localhost:8081}") String baseUrl) {
        this.inferenceUri = URI.create(baseUrl.replaceAll("/+$", "") + "/inference");
    }

    public String transcribe(MultipartFile audio) throws IOException {
        if (audio.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Audio file is empty");
        }

        String boundary = "----JacobWhisper" + UUID.randomUUID().toString().replace("-", "");
        byte[] requestBody = createMultipartBody(boundary, audio.getBytes());
        HttpRequest request = HttpRequest.newBuilder(inferenceUri)
                .timeout(Duration.ofSeconds(120))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(requestBody))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Whisper server returned HTTP " + response.statusCode());
            }

            String text = objectMapper.readTree(response.body()).path("text").asText(null);
            if (text == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Whisper server returned an invalid response");
            }
            return text.trim();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Whisper transcription was interrupted",
                    exception);
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Whisper server request failed",
                    exception);
        }
    }

    private byte[] createMultipartBody(String boundary, byte[] audio) throws IOException {
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        writeUtf8(body, "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"file\"; filename=\"recording.wav\"\r\n"
                + "Content-Type: audio/wav\r\n\r\n");
        body.write(audio);
        writeUtf8(body, "\r\n--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"language\"\r\n\r\n"
                + "fr\r\n--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"response_format\"\r\n\r\n"
                + "json\r\n--" + boundary + "--\r\n");
        return body.toByteArray();
    }

    private void writeUtf8(ByteArrayOutputStream output, String value) throws IOException {
        output.write(value.getBytes(StandardCharsets.UTF_8));
    }
}
