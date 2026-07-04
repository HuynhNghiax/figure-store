package com.example.backend.controller;

import com.example.backend.dto.ReviewRequestDTO;
import com.example.backend.entity.Review;
import com.example.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/product/{productId}")
    public List<Review> getReviews(@PathVariable Long productId) {
        return reviewService.getReviewsByProduct(productId);
    }

    @PostMapping
    public ResponseEntity<?> addReview(@Valid @RequestBody ReviewRequestDTO dto) {
        return reviewService.addReview(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        return reviewService.deleteReview(id);
    }
}
