package com.example.backend.controller;

import com.example.backend.dto.ReviewRequestDTO;
import com.example.backend.entity.Review;
import com.example.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /** Public: lấy review của một sản phẩm */
    @GetMapping("/product/{productId}")
    public List<Review> getReviews(@PathVariable Long productId) {
        return reviewService.getReviewsByProduct(productId);
    }

    /** Admin: lấy tất cả review, phân trang, lọc theo sao */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<Review> getAllForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) Integer rating) {
        return reviewService.getAllReviewsForAdmin(page, size, rating);
    }

    /** User: thêm review mới */
    @PostMapping
    public ResponseEntity<?> addReview(@Valid @RequestBody ReviewRequestDTO dto) {
        return reviewService.addReview(dto);
    }

    /** User / Admin: xóa review */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        return reviewService.deleteReview(id);
    }
}
