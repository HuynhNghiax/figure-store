package com.example.backend.controller;

import com.example.backend.entity.CartItem;
import com.example.backend.repository.CartRepository;
import com.example.backend.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartRepository cartRepository;

    public CartController(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    @GetMapping
    public ResponseEntity<?> getCart() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        return ResponseEntity.ok(cartRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<?> addToCart(@RequestBody Map<String, Object> data) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        Long productId = Long.valueOf(data.get("productId").toString());
        Integer quantity = data.containsKey("quantity") ? Integer.valueOf(data.get("quantity").toString()) : 1;

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

    @PutMapping("/{productId}")
    public ResponseEntity<?> updateQuantity(@PathVariable Long productId, @RequestBody Map<String, Integer> data) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        return cartRepository.findByUserIdAndProductId(userId, productId).map(item -> {
            item.setQuantity(data.getOrDefault("quantity", 1));
            cartRepository.save(item);
            return ResponseEntity.ok().body(Map.of("message", "Đã cập nhật số lượng!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeFromCart(@PathVariable Long productId) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        cartRepository.deleteByUserIdAndProductId(userId, productId);
        return ResponseEntity.ok().body(Map.of("message", "Đã xóa khỏi giỏ hàng!"));
    }

    @DeleteMapping
    public ResponseEntity<?> clearCart() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        cartRepository.deleteByUserId(userId);
        return ResponseEntity.ok().body(Map.of("message", "Đã xóa giỏ hàng!"));
    }
}