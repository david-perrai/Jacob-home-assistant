package com.davidperrai.jacob.core.tv.agent;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;

import com.davidperrai.jacob.common.dto.Response;
import com.davidperrai.jacob.core.tv.TvCommand;
import com.davidperrai.jacob.core.tv.service.LgtvBrokerService;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class LgtvBrokerTool {

    private final LgtvBrokerService lgtvBrokerService;

    @Tool("""
            Met en pause la lecture en cours sur le téléviseur.
            À utiliser lorsque l'utilisateur demande de mettre la TV ou le média en pause.
            """)
    public Response pauseTv() {
        return execute(TvCommand.PAUSE);
    }

    @Tool("""
            Reprend la lecture sur le téléviseur.
            À utiliser lorsque l'utilisateur demande de reprendre ou relancer la lecture.
            """)
    public Response playTv() {
        return execute(TvCommand.PLAY);
    }

    @Tool("""
            Éteint le téléviseur.
            À utiliser uniquement lorsque l'utilisateur demande explicitement d'éteindre la TV.
            """)
    public Response turnOffTv() {
        return execute(TvCommand.TURN_OFF);
    }

    @Tool("""
            Permet de positionner le volume de la télévision à un niveau spécifique.
            À utiliser lorsque l'utilisateur demande de régler le volume à un niveau précis.            
            """)
    public Response setVolumeTv(@P("Le niveau de volume souhaité (0-100)") int volumeLevel) {
             try {
            lgtvBrokerService.executeCommand( "setVolume", String.valueOf(volumeLevel));
            return new Response("Le volume du téléviseur a été réglé à " + volumeLevel + ".");
        } catch (RestClientException exception) {            
            return new Response("Le volume du téléviseur n'a pas pu être réglé.");
        }
    }


    @Tool("""
            Bascule le son du téléviseur entre muet et actif.
            À utiliser lorsque l'utilisateur demande de couper ou rétablir le son, ou d'activer/désactiver le mode muet.
            """)
    public Response toggleMuteTv() {
        return execute(TvCommand.TOGGLE_MUTE);
    }

    @Tool("""
            Lance une application sur le téléviseur.
            Utilise le nom ou l'identifiant de l'application fourni par l'utilisateur.
            """)
    public Response launchApp(@P("Nom ou identifiant de l'application à lancer") String applicationName) {
        log.info("Launching LG TV application: {}", applicationName);

        String appId = switch (applicationName.toLowerCase()) {
            case "disney", "disney plus" -> "com.disney.disneyplus-prod";
            case "maison", "homeconnect" -> "com.webos.app.homeconnect";
            case "youtube" -> "youtube.leanback.v4";
            default -> applicationName;
        };
        try {
            lgtvBrokerService.executeCommand("launchApp", appId.toLowerCase());
            return new Response("L'application " + appId + " est lancée sur le téléviseur.");
        } catch (RestClientException exception) {
            log.error("Failed to launch LG TV application: {}", appId, exception);
            return new Response("L'application n'a pas pu être lancée sur le téléviseur.");
        }
    }

    public Response execute(TvCommand command) {
        String brokerCommand = switch (command) {
            case PAUSE -> "pause";
            case PLAY -> "play";
            case TURN_OFF -> "turnoff";
            case VOLUME_UP -> "volumePlus";
            case VOLUME_DOWN -> "volumeMinus";
            case TOGGLE_MUTE -> "mute";
        };
        String successMessage = switch (command) {
            case PAUSE -> "La lecture a été mise en pause.";
            case PLAY -> "La lecture a repris.";
            case TURN_OFF -> "Le téléviseur s'éteint.";
            case VOLUME_UP -> "Le volume du téléviseur a été augmenté.";
            case VOLUME_DOWN -> "Le volume du téléviseur a été diminué.";
            case TOGGLE_MUTE -> "Le mode muet du téléviseur a été basculé.";
        };

        try {
            lgtvBrokerService.executeCommand(brokerCommand);
            return new Response(successMessage);
        } catch (RestClientException exception) {
            log.error("Failed to execute LG TV command: {}", brokerCommand, exception);
            return new Response("La commande TV n'a pas pu être exécutée.");
        }
    }
}
