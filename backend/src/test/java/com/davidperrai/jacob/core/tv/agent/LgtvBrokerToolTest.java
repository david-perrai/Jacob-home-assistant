package com.davidperrai.jacob.core.tv.agent;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;

import com.davidperrai.jacob.core.tv.TvCommand;
import com.davidperrai.jacob.core.tv.service.LgtvBrokerService;

class LgtvBrokerToolTest {

    @Test
    void mapsEveryTvIntentToItsBrokerCommand() {
        LgtvBrokerService service = mock(LgtvBrokerService.class);
        LgtvBrokerTool tool = new LgtvBrokerTool(service);

        tool.execute(TvCommand.PAUSE);
        verify(service).executeCommand("pause");

        tool.execute(TvCommand.PLAY);
        verify(service).executeCommand("play");

        tool.execute(TvCommand.TURN_OFF);
        verify(service).executeCommand("turnoff");

        tool.execute(TvCommand.VOLUME_UP);
        verify(service).executeCommand("volumePlus");

        tool.execute(TvCommand.VOLUME_DOWN);
        verify(service).executeCommand("volumeMinus");

        tool.execute(TvCommand.TOGGLE_MUTE);
        verify(service).executeCommand("mute");
    }
}
