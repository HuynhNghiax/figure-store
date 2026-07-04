package com.example.backend.service;

import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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
     * Tổng hợp thống kê chính cho Dashboard Admin.
     */
    public ResponseEntity<?> getDashboardStats() {
        Double totalRevenue = orderRepository.sumPaidRevenue();
        long totalOrders    = orderRepository.count();
        long totalProducts  = productRepository.countByDeletedFalse();
        long totalUsers     = userRepository.count();
        long pendingOrders   = orderRepository.countByStatus("PENDING");
        long shippedOrders   = orderRepository.countByStatus("SHIPPED");
        long completedOrders = orderRepository.countByStatus("COMPLETED");
        long deliveredOrders = orderRepository.countByStatus("DELIVERED");
        long cancelledOrders = orderRepository.countByStatus("CANCELLED");
        long totalReviews   = reviewRepository.count();

        List<Map<String, Object>> topProducts = orderRepository.findTopSellingProducts(10);
        List<Map<String, Object>> recentChart = orderRepository.findRecentChartData(PageRequest.of(0, 12));
        List<Map<String, Object>> ordersByStatus = orderRepository.countOrdersByStatus();
        List<Integer> availableYears = orderRepository.findDistinctYears();

        // Biểu đồ theo tháng cho năm hiện tại
        int currentYear = LocalDate.now().getYear();
        List<Map<String, Object>> monthlyChart = buildMonthlyChart(
                orderRepository.findMonthlyRevenue(currentYear), currentYear);

        Map<String, Object> result = new HashMap<>();
        result.put("revenue",          totalRevenue != null ? totalRevenue : 0);
        result.put("totalOrders",      totalOrders);
        result.put("totalProducts",    totalProducts);
        result.put("totalUsers",       totalUsers);
        result.put("pendingOrders",    pendingOrders);
        result.put("shippedOrders",    shippedOrders);
        result.put("completedOrders",  completedOrders);
        result.put("deliveredOrders",  deliveredOrders);
        result.put("cancelledOrders",  cancelledOrders);
        result.put("totalReviews",     totalReviews);
        result.put("topProducts",      topProducts);
        result.put("recentChart",      recentChart);
        result.put("ordersByStatus",   ordersByStatus);
        result.put("monthlyChart",     monthlyChart);
        result.put("currentYear",      currentYear);
        result.put("availableYears",   availableYears);

        return ResponseEntity.ok(result);
    }

    /**
     * Thống kê doanh thu theo tháng trong một năm cụ thể.
     * Tự động fill các tháng chưa có đơn hàng = 0.
     */
    public ResponseEntity<?> getMonthlyStats(int year) {
        List<Map<String, Object>> raw = orderRepository.findMonthlyRevenue(year);
        List<Map<String, Object>> filled = buildMonthlyChart(raw, year);
        return ResponseEntity.ok(Map.of("year", year, "data", filled));
    }

    /**
     * Thống kê doanh thu theo năm.
     */
    public ResponseEntity<?> getYearlyStats() {
        List<Map<String, Object>> data = orderRepository.findYearlyRevenue();
        return ResponseEntity.ok(Map.of("data", data));
    }

    // ── Helper: fill đủ 12 tháng, tháng thiếu đặt = 0 ──────────────
    private List<Map<String, Object>> buildMonthlyChart(
            List<Map<String, Object>> raw, int year) {

        // Tạo map tháng → dữ liệu
        Map<Integer, Map<String, Object>> byMonth = new HashMap<>();
        for (Map<String, Object> row : raw) {
            int month = ((Number) row.get("thang")).intValue();
            byMonth.put(month, row);
        }

        List<Map<String, Object>> result = new java.util.ArrayList<>();
        String[] monthNames = {
            "", "T1", "T2", "T3", "T4", "T5", "T6",
                "T7", "T8", "T9", "T10", "T11", "T12"
        };

        for (int m = 1; m <= 12; m++) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("thang", m);
            entry.put("name", monthNames[m] + "/" + year);
            if (byMonth.containsKey(m)) {
                Object dt = byMonth.get(m).get("doanhThu");
                Object sd = byMonth.get(m).get("sodon");
                entry.put("doanhThu", dt != null ? ((Number) dt).doubleValue() : 0.0);
                entry.put("sodon",    sd != null ? ((Number) sd).longValue()   : 0L);
            } else {
                entry.put("doanhThu", 0.0);
                entry.put("sodon",    0L);
            }
            result.add(entry);
        }
        return result;
    }
}
