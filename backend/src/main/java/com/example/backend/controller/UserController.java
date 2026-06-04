package com.example.backend.controller;

import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

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