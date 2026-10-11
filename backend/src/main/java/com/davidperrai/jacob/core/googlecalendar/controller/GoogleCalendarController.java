package com.davidperrai.jacob.core.googlecalendar.controller;

import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.davidperrai.jacob.core.googlecalendar.service.GoogleCalendarService;
import com.google.api.services.calendar.model.Event;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/calendar")
public class GoogleCalendarController {

    private final GoogleCalendarService calendarService;

    @GetMapping("/events")
    public List<Event> getEvents(@RequestParam(required = false) YearMonth month) throws Exception {
        YearMonth requestedMonth = month == null
                ? YearMonth.now(ZoneId.systemDefault())
                : month;
        return calendarService.getEventsForMonth(requestedMonth);
    }
}