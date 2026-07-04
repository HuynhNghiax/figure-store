package com.example.backend.service;

import com.example.backend.entity.CartItem;
import com.example.backend.repository.CartRepository;
import com.example.backend.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Service xử lý business logic cho Cart (giỏ hàng phía server).
 */
@Service
public class CartService {

    private final CartRepository cartRepository;

    public CartService(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    /**
     * Lấy giỏ hàng của user hiện tại.
     */
    public ResponseEntity<?> getCart() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        List<CartItem> items = cartRepository.findByUserId(userId);
        return ResponseEntity.ok(items);
    }

    /**
     * Thêm sản phẩm vào giỏ (hoặc tăng số lượng nếu đã có).
     */
    public ResponseEntity<?> addToCart(Long productId, Integer quantity) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        var existing = cartRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(item.getQuantity() + quantity);
            cartRepository.save(item);
        } else {
            CartItem item = new CartItem();
            item.setUserId(userId);
            item.setProductId(productId);
            item.setQuantity(quantity);
            cartRepository.save(item);
        }
        return ResponseEntity.ok().body(Map.of("message", "Đã thêm vào giỏ hàng!"));
    }

    /**
     * Cập nhật số lượng sản phẩm trong giỏ.
     */
    public ResponseEntity<?> updateQuantity(Long productId, Integer quantity) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        return cartRepository.findByUserIdAndProductId(userId, productId).map(item -> {
            item.setQuantity(quantity != null ? quantity : 1);
            cartRepository.save(item);
            return ResponseEntity.ok().body(Map.of("message", "Đã cập nhật số lượng!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Xóa một sản phẩm khỏi giỏ.
     */
    public ResponseEntity<?> removeFromCart(Long productId) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        cartRepository.deleteByUserIdAndProductId(userId, productId);
        return ResponseEntity.ok().body(Map.of("message", "Đã xóa khỏi giỏ hàng!"));
    }

    /**
     * Xóa toàn bộ giỏ hàng của user.
     */
    public ResponseEntity<?> clearCart() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        cartRepository.deleteByUserId(userId);
        return ResponseEntity.ok().body(Map.of("message", "Đã xóa giỏ hàng!"));
    }
}
