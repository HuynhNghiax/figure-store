package com.example.backend.repository;

import com.example.backend.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);
    Optional<Order> findByPaypalOrderId(String paypalOrderId);

    @Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR :status = 'ALL' OR o.status = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "  CAST(o.id AS string) = :search OR " +
           "  LOWER(o.customerName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> findFiltered(
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT COUNT(o) > 0 FROM Order o JOIN o.items i " +
           "WHERE o.userId = :userId AND i.productId = :productId AND o.status = 'COMPLETED'")
    boolean hasUserPurchasedProduct(@Param("userId") Long userId, @Param("productId") Long productId);

    // Tổng doanh thu từ đơn đã thanh toán
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.paymentStatus = 'PAID'")
    Double sumPaidRevenue();

    // 10 đơn gần nhất cho biểu đồ mini
    @Query(value = "SELECT CAST(o.id AS string) AS name, " +
                   "CASE WHEN o.paymentStatus = 'PAID' THEN o.totalAmount ELSE 0 END AS doanhThu " +
                   "FROM Order o ORDER BY o.id DESC")
    List<Map<String, Object>> findRecentChartData(Pageable pageable);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status")
    long countByStatus(@Param("status") String status);

    // Top sản phẩm bán chạy — FIX: dùng column position thay vì alias (PostgreSQL không nhận alias trong ORDER BY của native query)
    @Query(value = "SELECT i.product_id AS productId, i.product_name AS productName, " +
                   "SUM(i.quantity) AS totalSold, SUM(i.quantity * i.price) AS totalRevenue " +
                   "FROM order_items i " +
                   "JOIN orders o ON i.order_id = o.id " +
                   "WHERE o.status IN ('COMPLETED', 'DELIVERED') " +
                   "GROUP BY i.product_id, i.product_name " +
                   "ORDER BY 3 DESC " +
                   "LIMIT :limit",
           nativeQuery = true)
    List<Map<String, Object>> findTopSellingProducts(@Param("limit") int limit);

    // Doanh thu theo tháng trong một năm cụ thể (native PostgreSQL)
    @Query(value = "SELECT EXTRACT(MONTH FROM created_at)::int AS thang, " +
                   "SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END) AS doanhThu, " +
                   "COUNT(*) AS sodon " +
                   "FROM orders " +
                   "WHERE EXTRACT(YEAR FROM created_at) = :year " +
                   "GROUP BY EXTRACT(MONTH FROM created_at) " +
                   "ORDER BY 1 ASC",
           nativeQuery = true)
    List<Map<String, Object>> findMonthlyRevenue(@Param("year") int year);

    // Doanh thu theo năm (5 năm gần nhất)
    @Query(value = "SELECT EXTRACT(YEAR FROM created_at)::int AS nam, " +
                   "SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END) AS doanhThu, " +
                   "COUNT(*) AS sodon " +
                   "FROM orders " +
                   "GROUP BY EXTRACT(YEAR FROM created_at) " +
                   "ORDER BY 1 ASC",
           nativeQuery = true)
    List<Map<String, Object>> findYearlyRevenue();

    // Thống kê đơn theo trạng thái — dùng column index tránh alias lowercase issue PostgreSQL
    @Query(value = "SELECT status, COUNT(*) AS so_luong " +
                   "FROM orders " +
                   "GROUP BY status " +
                   "ORDER BY 2 DESC",
           nativeQuery = true)
    List<Map<String, Object>> countOrdersByStatus();

    // Danh sách các năm có đơn hàng (để render dropdown)
    @Query(value = "SELECT DISTINCT EXTRACT(YEAR FROM created_at)::int AS nam " +
                   "FROM orders ORDER BY 1 DESC",
           nativeQuery = true)
    List<Integer> findDistinctYears();
}


