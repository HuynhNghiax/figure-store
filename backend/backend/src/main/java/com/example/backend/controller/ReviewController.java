package com.example.backend.controller;

import com.example.backend.entity.Review;
import com.example.backend.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:5173")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    // Lấy bình luận của 1 sản phẩm
    @GetMapping("/product/{productId}")
    public List<Review> getReviews(@PathVariable Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    // Gửi bình luận mới
    @PostMapping
    public Review addReview(@RequestBody Review review) {
        return reviewRepository.save(review);
    }
}