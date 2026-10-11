package com.davidperrai.jacob.configuration;


import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import dev.langchain4j.mcp.McpToolProvider;
import dev.langchain4j.mcp.client.DefaultMcpClient;
import dev.langchain4j.mcp.client.McpClient;
import dev.langchain4j.mcp.client.transport.McpTransport;
import dev.langchain4j.mcp.client.transport.stdio.StdioMcpTransport;

@Configuration
public class McpConfig {

    @Bean(destroyMethod = "close")
    McpClient braveMcpClient(
            @Value("${BRAVE_EXECUTABLE_PATH:/Applications/Brave Browser.app/Contents/MacOS/Brave Browser}")
            String braveExecutablePath) {
        McpTransport transport = new StdioMcpTransport.Builder()
                .command(List.of(
                        "npx", "-y", "@playwright/mcp@latest",
                        "--browser", "chromium",
                        "--headless",
                        "--executable-path", braveExecutablePath))
                .logEvents(true)
                .build();

        return new DefaultMcpClient.Builder()
                .key("brave")
                .transport(transport)
                .build();
    }

    @Bean
    McpToolProvider mcpToolProvider(McpClient braveMcpClient) {
        return McpToolProvider.builder()
                .mcpClients(braveMcpClient)
                .build();
    }
}