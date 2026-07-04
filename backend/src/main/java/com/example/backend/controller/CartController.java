package com.example.backend.controller;

import com.example.backend.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<?> getCart() {
        return cartService.getCart();
    }

    @PostMapping
    public ResponseEntity<?> addToCart(@RequestBody Map<String, Object> data) {
        Long productId = Long.valueOf(data.get("productId").toString());
        Integer quantity = data.containsKey("quantity") ? Integer.valueOf(data.get("quantity").toString()) : 1;
        return cartService.addToCart(productId, quantity);
    }

    @PutMapping("/{productId}")
    public ResponseEntity<?> updateQuantity(@PathVariable Long productId,
                                            @RequestBody Map<String, Integer> data) {
        return cartService.updateQuantity(productId, data.getOrDefault("quantity", 1));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeFromCart(@PathVariable Long productId) {
        return cartService.removeFromCart(productId);
    }

    @DeleteMapping
    public ResponseEntity<?> clearCart() {
        return cartService.clearCart();
    }
}