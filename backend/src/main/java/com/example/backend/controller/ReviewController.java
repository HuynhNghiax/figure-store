package com.example.backend.controller;

import com.example.backend.dto.ReviewRequestDTO;
import com.example.backend.entity.Review;
import com.example.backend.repository.OrderRepository;
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

    @Autowired
    private OrderRepository orderRepository;

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

        // Kiểm tra user đã mua sản phẩm này chưa (phải có đơn COMPLETED)
        boolean hasPurchased = orderRepository.hasUserPurchasedProduct(userId, dto.getProductId());
        if (!hasPurchased) {
            return ResponseEntity.status(403).body(Map.of("message", "Bạn cần mua và nhận hàng sản phẩm này trước khi đánh giá!"));
        }

        // Chặn spam: mỗi user chỉ được review 1 lần mỗi sản phẩm
        boolean alreadyReviewed = reviewRepository.findByUserIdAndProductId(userId, dto.getProductId()).isPresent();
        if (alreadyReviewed) {
            return ResponseEntity.badRequest().body(Map.of("message", "Bạn đã đánh giá sản phẩm này rồi!"));
        }

        Review review = new Review();
        review.setProductId(dto.getProductId());
        review.setUserId(userId);
        review.setUsername(username);
        review.setComment(dto.getComment());
        review.setRating(dto.getRating());
        return ResponseEntity.ok(reviewRepository.save(review));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        return reviewRepository.findById(id).map(review -> {
            if (!review.getUserId().equals(userId) && !SecurityUtils.isAdmin()) {
                return ResponseEntity.status(403).body(Map.of("message", "Không có quyền xóa đánh giá này!"));
            }
            reviewRepository.deleteById(id);
            return ResponseEntity.ok().body(Map.of("message", "Đã xóa đánh giá!"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
