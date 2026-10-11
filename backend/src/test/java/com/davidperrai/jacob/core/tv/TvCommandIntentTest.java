package com.davidperrai.jacob.core.tv;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class TvCommandIntentTest {

    @Test
    void detectsTurnOffRequestWithAccents() {
        assertEquals(TvCommand.TURN_OFF, TvCommandIntent.detect("Éteins la télévision.").orElseThrow());
    }

    @Test
    void detectsVolumeDownWithoutMentioningTv() {
        assertEquals(TvCommand.VOLUME_DOWN, TvCommandIntent.detect("Baisse le volume.").orElseThrow());
    }

    @Test
    void distinguishesMuteFromVolumeDown() {
        assertEquals(TvCommand.TOGGLE_MUTE, TvCommandIntent.detect("Coupe le son de la télé.").orElseThrow());
        assertEquals(TvCommand.VOLUME_DOWN, TvCommandIntent.detect("Baisse le son de la télé.").orElseThrow());
    }

    @Test
    void doesNotExecuteNegatedOrUnrelatedRequests() {
        assertTrue(TvCommandIntent.detect("N'éteins pas la télévision.").isEmpty());
        assertTrue(TvCommandIntent.detect("Quel temps fait-il à Nantes ?").isEmpty());
    }
}
