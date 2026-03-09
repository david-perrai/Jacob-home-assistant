package com.davidperrai.jacob.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Setter
@Getter
public class Response {

    private String message;
    private Object data;

    public Response(String message) {
        this.message = message;
        this.data = null;
    }

}
