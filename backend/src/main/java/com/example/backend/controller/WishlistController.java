package com.example.backend.controller;

import com.example.backend.entity.WishlistItem;
import com.example.backend.repository.WishlistRepository;
import com.example.backend.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistRepository wishlistRepository;

    public WishlistController(WishlistRepository wishlistRepository) {
        this.wishlistRepository = wishlistRepository;
    }

    @GetMapping
    public ResponseEntity<?> getWishlist() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        return ResponseEntity.ok(wishlistRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<?> addToWishlist(@RequestBody Map<String, Long> data) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        Long productId = data.get("productId");
        if (productId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu productId!"));
        }
        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Sản phẩm đã có trong danh sách yêu thích!"));
        }
        WishlistItem item = new WishlistItem();
        item.setUserId(userId);
        item.setProductId(productId);
        wishlistRepository.save(item);
        return ResponseEntity.ok().body(Map.of("message", "Đã thêm vào yêu thích!"));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeFromWishlist(@PathVariable Long productId) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        var existing = wishlistRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            return ResponseEntity.ok().body(Map.of("message", "Đã xóa khỏi yêu thích!"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Sản phẩm không có trong danh sách yêu thích!"));
    }
}