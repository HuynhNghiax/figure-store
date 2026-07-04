package com.example.backend.service;

import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service xử lý logic thống kê cho Admin Dashboard.
 */
@Service
public class StatsService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    public StatsService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        UserRepository userRepository,
                        ReviewRepository reviewRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
    }

    /**
     * Lấy tổng hợp thống kê cho Dashboard Admin.
     */
    public ResponseEntity<?> getDashboardStats() {
        Double totalRevenue     = orderRepository.sumPaidRevenue();
        long totalOrders        = orderRepository.count();
        long totalProducts      = productRepository.countByDeletedFalse();
        long totalUsers         = userRepository.count();
        long pendingOrders      = orderRepository.countByStatus("PENDING");
        long shippedOrders      = orderRepository.countByStatus("SHIPPED");
        long totalReviews       = reviewRepository.count();

        List<Map<String, Object>> topProducts  = orderRepository.findTopSellingProducts(5);
        List<Map<String, Object>> recentChart  = orderRepository.findRecentChartData(PageRequest.of(0, 10));

        Map<String, Object> result = new HashMap<>();
        result.put("revenue",       totalRevenue != null ? totalRevenue : 0);
        result.put("totalOrders",   totalOrders);
        result.put("totalProducts", totalProducts);
        result.put("totalUsers",    totalUsers);
        result.put("pendingOrders", pendingOrders);
        result.put("shippedOrders", shippedOrders);
        result.put("totalReviews",  totalReviews);
        result.put("topProducts",   topProducts);
        result.put("recentChart",   recentChart);

        return ResponseEntity.ok(result);
    }
}
