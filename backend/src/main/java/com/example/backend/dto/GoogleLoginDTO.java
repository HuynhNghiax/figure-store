package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginDTO {
    @NotBlank(message = "Google credential không được để trống")
    private String credential;
}
