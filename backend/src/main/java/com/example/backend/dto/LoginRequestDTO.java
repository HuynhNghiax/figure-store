package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequestDTO {

    @NotBlank(message = "Tài khoản đăng nhập không được để trống!")
    private String username;

    @NotBlank(message = "Mật khẩu đăng nhập không được để trống!")
    private String password;
}