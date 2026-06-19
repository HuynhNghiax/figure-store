package com.example.backend.controller;

import com.example.backend.dto.ReviewRequestDTO;
import com.example.backend.entity.Review;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Integer rating) {

        List<Review> all = reviewRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));

        // Filter
        List<Review> filtered = all.stream()
                .filter(r -> productId == null || r.getProductId().equals(productId))
                .filter(r -> rating == null || r.getRating().equals(rating))
                .collect(Collectors.toList());

        // Manual paging
        int total = filtered.size();
        int fromIdx = Math.min(page * size, total);
        int toIdx   = Math.min(fromIdx + size, total);
        List<Review> content = filtered.subList(fromIdx, toIdx);

        Page<Review> resultPage = new PageImpl<>(content, PageRequest.of(page, size), total);
        return ResponseEntity.ok(resultPage);
    }

    @GetMapping("/product/{productId}/avg")
    public ResponseEntity<?> getAvgRating(@PathVariable Long productId) {
        Double avg = reviewRepository.findAvgRatingByProductId(productId);
        long count = reviewRepository.countByProductId(productId);
        return ResponseEntity.ok(Map.of(
                "avgRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0,
                "reviewCount", count
        ));
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
