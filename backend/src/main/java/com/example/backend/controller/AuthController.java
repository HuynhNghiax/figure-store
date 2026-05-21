package com.example.backend.controller;

import com.example.backend.dto.GoogleLoginDTO;
import com.example.backend.dto.LoginRequestDTO;
import com.example.backend.dto.RegisterDTO;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.AuthService;
import com.example.backend.service.GoogleAuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final GoogleAuthService googleAuthService;
    private final String mailFrom;

    public AuthController(
            UserRepository userRepository,
            JavaMailSender mailSender,
            PasswordEncoder passwordEncoder,
            AuthService authService,
            GoogleAuthService googleAuthService,
            @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}") String mailFrom) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.googleAuthService = googleAuthService;
        this.mailFrom = mailFrom;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDTO registerDTO) {
        if (userRepository.findByUsername(registerDTO.getUsername()).isPresent()) {
            return ResponseEntity.status(400).body(Map.of("message", "Tên tài khoản này đã tồn tại!"));
        }
        if (userRepository.findByEmail(registerDTO.getEmail()).isPresent()) {
            return ResponseEntity.status(400).body(Map.of("message", "Email này đã được sử dụng!"));
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        User user = new User();
        user.setUsername(registerDTO.getUsername());
        user.setEmail(registerDTO.getEmail());
        user.setPassword(passwordEncoder.encode(registerDTO.getPassword()));
        user.setOtp(otp);
        user.setEnabled(false);
        user.setRole("USER");
        userRepository.save(user);

        try {
            sendOtpEmail(user.getEmail(), otp, "FIGHUB - MÃ XÁC THỰC TÀI KHOẢN");
            return ResponseEntity.ok().body(Map.of("message", "Mã xác thực đã được gửi về Gmail của bạn!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi gửi Mail, hãy kiểm tra App Password!"));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> data) {
        String username = data.get("username");
        String otp = data.get("otp");
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getOtp() != null && user.getOtp().equals(otp)) {
                user.setEnabled(true);
                user.setOtp(null);
                userRepository.save(user);
                return ResponseEntity.ok().body(Map.of("message", "Kích hoạt tài khoản thành công! Hãy đăng nhập."));
            }
        }
        return ResponseEntity.status(400).body(Map.of("message", "Mã xác thực không chính xác!"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO loginDTO) {
        Optional<User> userOpt = userRepository.findByUsername(loginDTO.getUsername());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!user.isEnabled()) {
                return ResponseEntity.status(403).body(Map.of("message", "Tài khoản chưa được kích hoạt OTP!"));
            }
            if (passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
                return ResponseEntity.ok(authService.buildAuthResponse(user, "Đăng nhập thành công!"));
            }
        }
        return ResponseEntity.status(401).body(Map.of("message", "Sai tài khoản hoặc mật khẩu!"));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleLoginDTO dto) {
        try {
            User user = googleAuthService.authenticateGoogleToken(dto.getCredential());
            return ResponseEntity.ok(authService.buildAuthResponse(user, "Đăng nhập Google thành công!"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Xác thực Google thất bại!"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> data) {
        String username = data.get("username");
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập tên tài khoản!"));
        }
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("message", "Không tìm thấy tài khoản!"));
        }
        User user = userOpt.get();
        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtp(otp);
        userRepository.save(user);
        try {
            sendOtpEmail(user.getEmail(), otp, "FIGHUB - MÃ KHÔI PHỤC MẬT KHẨU");
            return ResponseEntity.ok().body(Map.of("message", "Mã khôi phục đã được gửi về email của bạn!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi gửi Mail!"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> data) {
        String username = data.get("username");
        String otp = data.get("otp");
        String newPassword = data.get("newPassword");
        if (username == null || otp == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thông tin không hợp lệ hoặc mật khẩu quá ngắn!"));
        }
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getOtp() != null && user.getOtp().equals(otp)) {
                user.setPassword(passwordEncoder.encode(newPassword));
                user.setOtp(null);
                userRepository.save(user);
                return ResponseEntity.ok().body(Map.of("message", "Đổi mật khẩu thành công! Hãy đăng nhập lại."));
            }
        }
        return ResponseEntity.status(400).body(Map.of("message", "Mã OTP không chính xác!"));
    }

    private void sendOtpEmail(String email, String otp, String subject) {
        SimpleMailMessage message = new SimpleMailMessage();
        if (mailFrom != null && !mailFrom.isBlank()) message.setFrom(mailFrom);
        message.setTo(email);
        message.setSubject(subject);
        message.setText("Mã xác thực của bạn là: " + otp + "\nVui lòng không chia sẻ mã này với bất kỳ ai.");
        mailSender.send(message);
    }
}
