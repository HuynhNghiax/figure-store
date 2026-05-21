package com.example.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterDTO {
    
    @NotBlank(message = "Tên đăng nhập không được để trống đâu Nghĩa ơi!")
    @Size(min = 3, message = "Tên đăng nhập phải từ 3 ký tự trở lên!")
    private String username;

    @NotBlank(message = "Email không được để trống!")
    @Email(message = "Email không đúng định dạng rồi, kiểm tra lại đi!")
    private String email;

    @NotBlank(message = "Mật khẩu không được bỏ trống!")
    @Size(min = 6, message = "Mật khẩu bảo mật phải từ 6 ký tự trở lên!")
    private String password;
}