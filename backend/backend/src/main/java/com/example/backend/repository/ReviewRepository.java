package com.example.backend.repository;

import com.example.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    // Lấy tất cả bình luận của một sản phẩm, cái mới nhất hiện lên trên
    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);
}