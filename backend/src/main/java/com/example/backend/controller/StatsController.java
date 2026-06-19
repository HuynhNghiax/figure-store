package com.example.backend.controller;

import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
public class StatsController {

    @Autowired private OrderRepository orderRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ReviewRepository reviewRepository;

    @GetMapping
    public ResponseEntity<?> getStats() {
        // Tổng doanh thu từ đơn đã thanh toán (JPQL aggregation — không load toàn bộ)
        Double totalRevenue = orderRepository.sumPaidRevenue();
        long totalOrders   = orderRepository.count();
        long totalProducts = productRepository.countByDeletedFalse();
        long totalUsers    = userRepository.count();

        // Thêm stats mới
        long pendingOrders  = orderRepository.countByStatus("PENDING");
        long shippedOrders  = orderRepository.countByStatus("SHIPPED");
        long totalReviews   = reviewRepository.count();

        // Top 5 sản phẩm bán chạy
        List<Map<String, Object>> topProducts = orderRepository.findTopSellingProducts(5);

        // 10 đơn gần nhất cho biểu đồ
        List<Map<String, Object>> recentChart = orderRepository.findRecentChartData(
                PageRequest.of(0, 10));

        Map<String, Object> result = new HashMap<>();
        result.put("revenue",        totalRevenue != null ? totalRevenue : 0);
        result.put("totalOrders",    totalOrders);
        result.put("totalProducts",  totalProducts);
        result.put("totalUsers",     totalUsers);
        result.put("pendingOrders",  pendingOrders);
        result.put("shippedOrders",  shippedOrders);
        result.put("totalReviews",   totalReviews);
        result.put("topProducts",    topProducts);
        result.put("recentChart",    recentChart);

        return ResponseEntity.ok(result);
    }
}
