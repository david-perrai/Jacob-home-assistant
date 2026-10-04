package com.davidperrai.jacob.core.netatmo.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import com.davidperrai.jacob.core.netatmo.service.NetatmoService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/netatmo")
public class NetatmoController {

    private final NetatmoService netatmoService;

    @GetMapping("/auth-url")
    public Map<String, String> getAuthUrl(@RequestParam String redirectUri) {
        String state = UUID.randomUUID().toString();
        String url = netatmoService.getAuthorizationUrl(redirectUri, state);
        return Map.of("url", url, "state", state);
    }

    @GetMapping("/callback")
    public RedirectView callback(
            @RequestParam String code, 
            @RequestParam(required = false) String redirectUri,
            HttpServletRequest request) throws Exception {
        
        String actualRedirectUri = redirectUri;
        if (actualRedirectUri == null || actualRedirectUri.isEmpty()) {
            actualRedirectUri = request.getRequestURL().toString();
        }
        netatmoService.exchangeCodeAndSave(code, actualRedirectUri);
        return new RedirectView("http://localhost:5173");
    }

    @GetMapping("/rooms")
    public Map<String, Object> getRooms() throws Exception {
        return netatmoService.getRoomsTemperatures();
    }

    @GetMapping("/status")
    public String getStatus() throws Exception {
        return netatmoService.getHomeStatusRaw();
    }
}
