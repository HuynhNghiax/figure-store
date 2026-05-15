package com.example.backend.controller;

import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    // 1. ĐĂNG KÝ & GỬI OTP
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        // Kiểm tra xem username đã tồn tại chưa
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.status(400).body(Map.of("message", "Tên tài khoản này đã tồn tại!"));
        }

        // Tạo mã OTP 6 số ngẫu nhiên
        String otp = String.format("%06d", new Random().nextInt(999999));
        
        // Hash mật khẩu và lưu tạm User ở trạng thái chưa kích hoạt (enabled = false)
        user.setPassword(BCrypt.hashpw(user.getPassword(), BCrypt.gensalt()));
        user.setOtp(otp);
        user.setEnabled(false);
        user.setRole("USER");
        userRepository.save(user);

        // Gửi mã về Gmail
        try {
            sendOtpEmail(user.getEmail(), otp);
            return ResponseEntity.ok().body(Map.of("message", "Mã xác thực đã được gửi về Gmail của bạn!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi gửi Mail, hãy kiểm tra App Password!"));
        }
    }

    // 2. XÁC THỰC MÃ OTP
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> data) {
        String username = data.get("username");
        String otp = data.get("otp");

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getOtp() != null && user.getOtp().equals(otp)) {
                user.setEnabled(true);
                user.setOtp(null); // Xóa OTP sau khi kích hoạt thành công
                userRepository.save(user);
                return ResponseEntity.ok().body(Map.of("message", "Kích hoạt tài khoản thành công! Hãy đăng nhập."));
            }
        }
        return ResponseEntity.status(400).body(Map.of("message", "Mã xác thực không chính xác!"));
    }

    // 3. ĐĂNG NHẬP (Chỉ cho phép nếu tài khoản đã enabled)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Kiểm tra xem đã kích hoạt chưa
            if (!user.isEnabled()) {
                return ResponseEntity.status(403).body(Map.of("message", "Tài khoản chưa được kích hoạt OTP!"));
            }

            // Kiểm tra mật khẩu
            if (BCrypt.checkpw(password, user.getPassword())) {
                return ResponseEntity.ok().body(Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "role", user.getRole(),
                    "message", "Đăng nhập thành công!"
                ));
            }
        }
        return ResponseEntity.status(401).body(Map.of("message", "Sai tài khoản hoặc mật khẩu!"));
    }

    // Hàm bổ trợ gửi Mail
    private void sendOtpEmail(String email, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("FIGHUB - MÃ XÁC THỰC TÀI KHOẢN");
        message.setText("Mã xác thực của bạn là: " + otp + "\n Vui lòng không chia sẻ mã này với bất kỳ ai.");
        mailSender.send(message);
    }
}