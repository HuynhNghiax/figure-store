package com.example.backend.controller;

import com.example.backend.dto.GoogleLoginDTO;
import com.example.backend.dto.LoginRequestDTO;
import com.example.backend.dto.RegisterDTO;
import com.example.backend.entity.ResetToken;
import com.example.backend.entity.User;
import com.example.backend.repository.ResetTokenRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.SecurityUtils;
import com.example.backend.service.AuthService;
import com.example.backend.service.EmailService;
import com.example.backend.service.GoogleAuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final GoogleAuthService googleAuthService;
    private final ResetTokenRepository resetTokenRepository;
    private final EmailService emailService;
    private final String frontendUrl;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthService authService,
            GoogleAuthService googleAuthService,
            ResetTokenRepository resetTokenRepository,
            EmailService emailService,
            @Value("${app.frontend-url}") String frontendUrl) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.googleAuthService = googleAuthService;
        this.resetTokenRepository = resetTokenRepository;
        this.emailService = emailService;
        this.frontendUrl = frontendUrl;
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
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        user.setEnabled(false);
        user.setRole("USER");
        userRepository.save(user);

        // Gửi email bất đồng bộ (@Async) — không block luồng HTTP
        emailService.sendOtpEmail(user.getEmail(), otp, "FIGHUB - MÃ XÁC THỰC TÀI KHOẢN");
        return ResponseEntity.ok().body(Map.of("message", "Mã xác thực đã được gửi về Gmail của bạn!"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> data) {
        String username = data.get("username");
        String otp = data.get("otp");
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getOtp() != null && user.getOtp().equals(otp)) {
                if (user.getOtpExpiry() != null && user.getOtpExpiry().isBefore(LocalDateTime.now())) {
                    return ResponseEntity.status(400).body(Map.of("message", "Mã xác thực đã hết hạn! Vui lòng đăng ký lại."));
                }
                user.setEnabled(true);
                user.setOtp(null);
                user.setOtpExpiry(null);
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
        String email = data.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập email!"));
        }
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("message", "Không tìm thấy tài khoản với email này!"));
        }
        User user = userOpt.get();

        String token = UUID.randomUUID().toString();
        ResetToken resetToken = new ResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(5));
        resetToken.setUsed(false);
        resetTokenRepository.save(resetToken);

        // Gửi email bất đồng bộ (@Async) — không block luồng HTTP
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        emailService.sendResetPasswordEmail(user.getEmail(), resetLink);
        return ResponseEntity.ok().body(Map.of("message", "Link khôi phục mật khẩu đã được gửi về email của bạn! Link có hiệu lực trong 5 phút."));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> data,
                                            @RequestHeader("Authorization") String authHeader) {
        String oldPassword = data.get("oldPassword");
        String newPassword = data.get("newPassword");
        if (oldPassword == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu phải có ít nhất 6 ký tự!"));
        }
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Không tìm thấy tài khoản!"));
        }
        User user = userOpt.get();
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.status(400).body(Map.of("message", "Mật khẩu cũ không chính xác!"));
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok().body(Map.of("message", "Đổi mật khẩu thành công!"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> data) {
        String token = data.get("token");
        String newPassword = data.get("newPassword");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token không hợp lệ!"));
        }
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu phải có ít nhất 6 ký tự!"));
        }

        Optional<ResetToken> tokenOpt = resetTokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("message", "Link khôi phục không hợp lệ hoặc đã được sử dụng!"));
        }

        ResetToken resetToken = tokenOpt.get();
        if (resetToken.isUsed()) {
            return ResponseEntity.status(400).body(Map.of("message", "Link khôi phục này đã được sử dụng! Vui lòng yêu cầu link mới."));
        }
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(400).body(Map.of("message", "Link khôi phục đã hết hạn! Vui lòng yêu cầu link mới."));
        }

        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok().body(Map.of("message", "Đổi mật khẩu thành công! Hãy đăng nhập lại."));
    }
}