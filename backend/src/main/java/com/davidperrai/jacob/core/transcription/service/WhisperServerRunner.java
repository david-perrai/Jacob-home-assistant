package com.davidperrai.jacob.core.transcription.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;

@Component
public class WhisperServerRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(WhisperServerRunner.class);
    private static final Duration SHUTDOWN_TIMEOUT = Duration.ofSeconds(2);

    private final boolean enabled;
    private final String executable;
    private final Path configuredModelPath;
    private final AtomicBoolean stopping = new AtomicBoolean();
    private volatile Process process;

    public WhisperServerRunner(
            @Value("${whisper.server.enabled:true}") boolean enabled,
            @Value("${whisper.server.executable:whisper-server}") String executable,
            @Value("${whisper.server.model-path:models/ggml-small-q5_1.bin}") String modelPath) {
        this.enabled = enabled;
        this.executable = executable;
        this.configuredModelPath = Path.of(modelPath);
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("Automatic Whisper server startup is disabled");
            return;
        }

        Path modelPath = resolveModelPath();
        if (!Files.isRegularFile(modelPath)) {
            throw new IllegalStateException("Whisper model not found: " + modelPath
                    + ". Set WHISPER_MODEL_PATH to the model file location.");
        }

        ProcessBuilder processBuilder = new ProcessBuilder(
                executable,
                "--host", "127.0.0.1",
                "--port", "8081",
                "--language", "fr",
                "--model", modelPath.toString());
        processBuilder.inheritIO();

        try {
            process = processBuilder.start();
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Unable to start whisper-server. Ensure whisper.cpp is installed and available in PATH.",
                    exception);
        }

        log.info("Started whisper-server (pid {}) with model {}", process.pid(), modelPath);
        process.onExit().thenAccept(exitedProcess -> {
            if (!stopping.get()) {
                log.error("whisper-server exited unexpectedly with code {}", exitedProcess.exitValue());
            }
        });
    }

    private Path resolveModelPath() {
        if (configuredModelPath.isAbsolute()) {
            return configuredModelPath;
        }

        Path workingDirectory = Path.of(System.getProperty("user.dir"));
        Path modelPath = workingDirectory.resolve(configuredModelPath).normalize();
        if (Files.isRegularFile(modelPath)) {
            return modelPath;
        }

        Path backendModelPath = workingDirectory.resolve("backend")
                .resolve(configuredModelPath)
                .normalize();
        return Files.isRegularFile(backendModelPath) ? backendModelPath : modelPath;
    }

    @PreDestroy
    public void stop() {
        stopping.set(true);
        Process runningProcess = process;
        if (runningProcess == null || !runningProcess.isAlive()) {
            return;
        }

        runningProcess.destroy();
        try {
            if (!runningProcess.waitFor(SHUTDOWN_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS)) {
                runningProcess.destroyForcibly();
            }
        } catch (InterruptedException exception) {
            runningProcess.destroyForcibly();
            Thread.currentThread().interrupt();
        }
    }
}
