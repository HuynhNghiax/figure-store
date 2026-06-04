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
import com.example.backend.service.GoogleAuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final GoogleAuthService googleAuthService;
    private final ResetTokenRepository resetTokenRepository;
    private final String mailFrom;
    private final String frontendUrl;

    public AuthController(
            UserRepository userRepository,
            JavaMailSender mailSender,
            PasswordEncoder passwordEncoder,
            AuthService authService,
            GoogleAuthService googleAuthService,
            ResetTokenRepository resetTokenRepository,
            @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}") String mailFrom,
            @Value("${app.frontend-url}") String frontendUrl) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.googleAuthService = googleAuthService;
        this.resetTokenRepository = resetTokenRepository;
        this.mailFrom = mailFrom;
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
        String email = data.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập email!"));
        }
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("message", "Không tìm thấy tài khoản với email này!"));
        }
        User user = userOpt.get();

        // Tạo token duy nhất, hết hạn sau 5 phút
        String token = UUID.randomUUID().toString();
        ResetToken resetToken = new ResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(5));
        resetToken.setUsed(false);
        resetTokenRepository.save(resetToken);

        // Gửi link reset qua email
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        try {
            sendResetEmail(user.getEmail(), resetLink);
            return ResponseEntity.ok().body(Map.of("message", "Link khôi phục mật khẩu đã được gửi về email của bạn! Link có hiệu lực trong 5 phút."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi gửi Mail!"));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> data, @RequestHeader("Authorization") String authHeader) {
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

        // Kiểm tra đã sử dụng chưa
        if (resetToken.isUsed()) {
            return ResponseEntity.status(400).body(Map.of("message", "Link khôi phục này đã được sử dụng! Vui lòng yêu cầu link mới."));
        }

        // Kiểm tra hết hạn chưa
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(400).body(Map.of("message", "Link khôi phục đã hết hạn! Vui lòng yêu cầu link mới."));
        }

        // Đánh dấu token đã dùng
        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);

        // Đổi mật khẩu
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok().body(Map.of("message", "Đổi mật khẩu thành công! Hãy đăng nhập lại."));
    }

    private void sendOtpEmail(String email, String otp, String subject) {
        SimpleMailMessage message = new SimpleMailMessage();
        if (mailFrom != null && !mailFrom.isBlank()) message.setFrom(mailFrom);
        message.setTo(email);
        message.setSubject(subject);
        message.setText("Mã xác thực của bạn là: " + otp + "\nVui lòng không chia sẻ mã này với bất kỳ ai.");
        mailSender.send(message);
    }

    private void sendResetEmail(String email, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        if (mailFrom != null && !mailFrom.isBlank()) message.setFrom(mailFrom);
        message.setTo(email);
        message.setSubject("FIGHUB - KHÔI PHỤC MẬT KHẨU");
        message.setText(
            "Bạn đã yêu cầu khôi phục mật khẩu FigHub.\n\n" +
            "Nhấp vào link bên dưới để đặt lại mật khẩu (hiệu lực trong 5 phút, chỉ sử dụng 1 lần):\n\n" +
            resetLink + "\n\n" +
            "Nếu bạn không yêu cầu khôi phục, vui lòng bỏ qua email này."
        );
        mailSender.send(message);
    }
}