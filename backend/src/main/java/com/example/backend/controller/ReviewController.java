package com.example.backend.controller;

import com.example.backend.dto.ReviewRequestDTO;
import com.example.backend.entity.Review;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping("/product/{productId}")
    public List<Review> getReviews(@PathVariable Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    @PostMapping
    public ResponseEntity<?> addReview(@Valid @RequestBody ReviewRequestDTO dto) {
        Long userId = SecurityUtils.getCurrentUserId();
        String username = SecurityUtils.getCurrentUsername();
        if (userId == null || username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập để đánh giá!"));
        }

        Review review = new Review();
        review.setProductId(dto.getProductId());
        review.setUserId(userId);
        review.setUsername(username);
        review.setComment(dto.getComment());
        review.setRating(dto.getRating());
        return ResponseEntity.ok(reviewRepository.save(review));
    }
}
