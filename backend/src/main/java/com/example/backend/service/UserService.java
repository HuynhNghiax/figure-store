package com.example.backend.service;

import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

/**
 * Service xử lý business logic cho User.
 */
@Service
public class UserService {

    private static final String UPLOAD_DIR = "uploads/";

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Admin: lấy danh sách users có phân trang và tìm kiếm.
     */
    public Page<User> getAllUsers(int page, int size, String search) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("id").descending());
        if (search != null && !search.isBlank()) {
            return userRepository.findByUsernameContainingIgnoreCase(search, pageable);
        }
        return userRepository.findAll(pageable);
    }

    /**
     * User: lấy thông tin bản thân.
     */
    public ResponseEntity<?> getMe() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chưa đăng nhập!"));
        }
        return userRepository.findById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * User: cập nhật thông tin cá nhân (fullName, phone, email).
     */
    public ResponseEntity<?> updateMe(Map<String, String> data) {
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

    /**
     * User: upload ảnh đại diện.
     */
    public ResponseEntity<?> uploadAvatar(MultipartFile file) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chưa đăng nhập!"));
        }
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng chọn ảnh!"));
        }
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
            Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

            String avatarUrl = "/uploads/avatars/" + fileName;
            return userRepository.findById(userId).map(user -> {
                user.setAvatarUrl(avatarUrl);
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("avatarUrl", avatarUrl, "message", "Cập nhật ảnh đại diện thành công!"));
            }).orElse(ResponseEntity.notFound().build());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Lỗi upload ảnh!"));
        }
    }

    /**
     * Admin: cập nhật thông tin user (role, email).
     */
    public ResponseEntity<?> adminUpdateUser(Long id, Map<String, String> data) {
        return userRepository.findById(id).map(user -> {
            if (data.containsKey("role")) user.setRole(data.get("role"));
            if (data.containsKey("email")) user.setEmail(data.get("email"));
            userRepository.save(user);
            return ResponseEntity.ok().body(Map.of("message", "Cập nhật thông tin người dùng thành công!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Admin: xóa user (không cho xóa ADMIN).
     */
    public ResponseEntity<?> deleteUser(Long id) {
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
