package com.example.backend.controller;

import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    private static final String UPLOAD_DIR = "uploads/";

    // ---- Admin: lấy danh sách users ----
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("id").descending());
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(userRepository.findByUsernameContainingIgnoreCase(search, pageable));
        }
        return ResponseEntity.ok(userRepository.findAll(pageable));
    }

    // ---- User: lấy thông tin bản thân ----
    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chưa đăng nhập!"));
        }
        return userRepository.findById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ---- User: cập nhật thông tin cá nhân ----
    @PutMapping("/me")
    public ResponseEntity<?> updateMe(@RequestBody Map<String, String> data) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chưa đăng nhập!"));
        }
        return userRepository.findById(userId).map(user -> {
            if (data.containsKey("fullName")) {
                String fullName = data.get("fullName").trim();
                user.setFullName(fullName.isEmpty() ? null : fullName);
            }
            if (data.containsKey("phone")) {
                String phone = data.get("phone").trim();
                user.setPhone(phone.isEmpty() ? null : phone);
            }
            if (data.containsKey("email") && !data.get("email").isBlank()) {
                // Kiểm tra email không trùng với user khác
                String newEmail = data.get("email").trim();
                boolean emailTaken = userRepository.findByEmail(newEmail)
                        .filter(other -> !other.getId().equals(userId))
                        .isPresent();
                if (emailTaken) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Email này đã được sử dụng!"));
                }
                user.setEmail(newEmail);
            }
            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật thông tin thành công!",
                    "fullName", user.getFullName() != null ? user.getFullName() : "",
                    "phone",    user.getPhone()    != null ? user.getPhone()    : "",
                    "email",    user.getEmail()
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ---- User: upload avatar ----
    @PostMapping("/me/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chưa đăng nhập!"));
        }
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng chọn ảnh!"));
        }
        // Chỉ chấp nhận ảnh
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ chấp nhận file ảnh!"));
        }
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR + "avatars/");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String originalName = file.getOriginalFilename();
            String fileName = "avatar_" + userId + "_" + UUID.randomUUID()
                    + "_" + (originalName != null ? new File(originalName).getName() : "avatar.jpg");
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String avatarUrl = "/uploads/avatars/" + fileName;
            return userRepository.findById(userId).map(user -> {
                user.setAvatarUrl(avatarUrl);
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("avatarUrl", avatarUrl, "message", "Cập nhật ảnh đại diện thành công!"));
            }).orElse(ResponseEntity.notFound().build());
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Lỗi upload ảnh!"));
        }
    }

    // ---- Admin: cập nhật user ----
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, String> data) {
        return userRepository.findById(id).map(user -> {
            if (data.containsKey("role")) {
                user.setRole(data.get("role"));
            }
            if (data.containsKey("email")) {
                user.setEmail(data.get("email"));
            }
            userRepository.save(user);
            return ResponseEntity.ok().body(Map.of("message", "Cập nhật thông tin người dùng thành công!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ---- Admin: xóa user ----
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            if ("ADMIN".equals(user.getRole())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Không thể xóa tài khoản Admin!"));
            }
            userRepository.deleteById(id);
            return ResponseEntity.ok().body(Map.of("message", "Đã xóa khách hàng!"));
        }).orElse(ResponseEntity.notFound().build());
    }
}