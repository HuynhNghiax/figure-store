package com.example.backend.service;

import com.example.backend.entity.User;
import com.example.backend.security.JwtService;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuthService {

    private final JwtService jwtService;

    public AuthService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public Map<String, Object> buildAuthResponse(User user, String message) {
        String token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRole());
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("email", user.getEmail());
        response.put("token", token);
        response.put("message", message);
        return response;
    }
}
