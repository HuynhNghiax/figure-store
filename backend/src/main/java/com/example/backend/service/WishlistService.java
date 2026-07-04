package com.example.backend.service;

import com.example.backend.entity.WishlistItem;
import com.example.backend.repository.WishlistRepository;
import com.example.backend.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Service xử lý business logic cho Wishlist (danh sách yêu thích).
 */
@Service
public class WishlistService {

    private final WishlistRepository wishlistRepository;

    public WishlistService(WishlistRepository wishlistRepository) {
        this.wishlistRepository = wishlistRepository;
    }

    /**
     * Lấy danh sách yêu thích của user hiện tại.
     */
    public ResponseEntity<?> getWishlist() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        List<WishlistItem> items = wishlistRepository.findByUserId(userId);
        return ResponseEntity.ok(items);
    }

    /**
     * Thêm sản phẩm vào danh sách yêu thích.
     */
    public ResponseEntity<?> addToWishlist(Long productId) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
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

    /**
     * Xóa sản phẩm khỏi danh sách yêu thích.
     */
    public ResponseEntity<?> removeFromWishlist(Long productId) {
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
