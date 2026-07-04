package com.example.backend.controller;

import com.example.backend.service.WishlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public ResponseEntity<?> getWishlist() {
        return wishlistService.getWishlist();
    }

    @PostMapping
    public ResponseEntity<?> addToWishlist(@RequestBody Map<String, Long> data) {
        return wishlistService.addToWishlist(data.get("productId"));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeFromWishlist(@PathVariable Long productId) {
        return wishlistService.removeFromWishlist(productId);
    }
}