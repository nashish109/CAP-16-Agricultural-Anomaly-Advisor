package com.agrisense.controller;

import com.agrisense.dto.SensorReadingDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class SensorWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/sensors/{fieldId}/subscribe")
    @SendTo("/topic/sensors/{fieldId}")
    public String subscribe(@DestinationVariable Long fieldId) {
        return "Subscribed to field " + fieldId;
    }

    public void broadcastReading(Long fieldId, SensorReadingDto reading) {
        messagingTemplate.convertAndSend("/topic/sensors/" + fieldId, reading);
    }
}
