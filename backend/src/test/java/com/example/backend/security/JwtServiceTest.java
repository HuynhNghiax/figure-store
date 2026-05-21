package com.example.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class JwtServiceTest {

    @Autowired
    private JwtService jwtService;

    @Test
    void generateAndValidateToken() {
        String token = jwtService.generateToken(1L, "testuser", "USER");
        assertNotNull(token);
        assertTrue(jwtService.isValid(token));
        assertEquals("testuser", jwtService.parseClaims(token).getSubject());
        assertEquals("USER", jwtService.parseClaims(token).get("role", String.class));
    }
}
