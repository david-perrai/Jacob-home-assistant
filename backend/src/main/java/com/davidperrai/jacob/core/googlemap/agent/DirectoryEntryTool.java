package com.davidperrai.jacob.core.googlemap.agent;

import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import org.springframework.stereotype.Component;

import com.davidperrai.jacob.common.dto.Response;
import com.davidperrai.jacob.common.service.SseService;
import com.davidperrai.jacob.core.googlemap.entity.DirectoryEntry;
import com.davidperrai.jacob.core.googlemap.service.DirectoryEntryService;

import dev.langchain4j.agent.tool.Tool;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@AllArgsConstructor
public class DirectoryEntryTool {

    private final DirectoryEntryService directoryEntryService;
    private final SseService sseService;

    // @Tool("""
    // permet de faire naviguer l'utilisateur vers une adresse à partir du prénom
    // d'un contact.
    // exemple de phrase : "navigue vers l'adresse de max" "je voudrais aller chez
    // max" "affiche moi l'adresse de chez max"
    // """)
    // public Response navigateToADirectoryEntry(String surname) {
    // List<DirectoryEntry> directoryEntries =
    // directoryEntryService.findDirectoryEntryBySurname(surname);
    // if (directoryEntries.isEmpty()) {
    // return new Response("je n'ai pas trouvé d'entrée dans l'annuaire pour le
    // prénom " + surname, null);
    // }

    // sseService.sendEvent("directoryEntry",
    // Map.of("data", directoryEntries.get(0).getAddress(), "type",
    // "DirectoryEntry.navigateTo"));
    // return new Response("je proccède à la navigation vers l'adresse de ",
    // directoryEntries.get(0).getSurname());
    // }

    @Tool("""
                permet de faire naviguer l'utilisateur vers une adresse à partir d'une adresse saisie.
                exemple de phrase : "navigue vers l'adresse 12 rue de la paix" "je voudrais aller à la rue de la paix" "affiche moi l'adresse de la rue de la paix"
            """)
    public Response navigateToAnAddresse(String addresse) {

        sseService.sendEvent("directoryEntry",
                Map.of("data", addresse, "type", "DirectoryEntry.navigateTo"));
        return new Response("je proccède à la navigation vers l'adresse de ", addresse);
    }

}
