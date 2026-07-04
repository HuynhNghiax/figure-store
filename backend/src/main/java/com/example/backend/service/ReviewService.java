package com.example.backend.service;

import com.example.backend.dto.ReviewRequestDTO;
import com.example.backend.entity.Review;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Service xử lý business logic cho Review (đánh giá sản phẩm).
 */
@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;

    public ReviewService(ReviewRepository reviewRepository, OrderRepository orderRepository) {
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * Lấy danh sách đánh giá của một sản phẩm, sắp xếp mới nhất lên đầu.
     */
    public List<Review> getReviewsByProduct(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    /**
     * Thêm đánh giá mới.
     * Kiểm tra: đã đăng nhập, đã mua hàng, chưa review sản phẩm này.
     */
    public ResponseEntity<?> addReview(ReviewRequestDTO dto) {
        Long userId = SecurityUtils.getCurrentUserId();
        String username = SecurityUtils.getCurrentUsername();
        if (userId == null || username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập để đánh giá!"));
        }
        // Kiểm tra user đã mua & nhận sản phẩm này chưa (đơn COMPLETED)
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

    /**
     * Xóa đánh giá (user xóa của mình, Admin xóa bất kỳ).
     */
    public ResponseEntity<?> deleteReview(Long id) {
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
