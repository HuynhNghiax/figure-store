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

    // Stats aggregation — không load toàn bộ entity
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.paymentStatus = 'PAID'")
    Double sumPaidRevenue();

    @Query(value = "SELECT CAST(o.id AS string) AS name, " +
                   "CASE WHEN o.paymentStatus = 'PAID' THEN o.totalAmount ELSE 0 END AS doanhThu " +
                   "FROM Order o ORDER BY o.id DESC")
    List<Map<String, Object>> findRecentChartData(Pageable pageable);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status")
    long countByStatus(@Param("status") String status);

    // Top sản phẩm bán chạy: lấy theo số lượng bán từ order items
    @Query(value = "SELECT i.product_id AS productId, i.product_name AS productName, " +
                   "SUM(i.quantity) AS totalSold, SUM(i.quantity * i.price) AS totalRevenue " +
                   "FROM order_items i " +
                   "JOIN orders o ON i.order_id = o.id " +
                   "WHERE o.status = 'COMPLETED' " +
                   "GROUP BY i.product_id, i.product_name " +
                   "ORDER BY totalSold DESC " +
                   "LIMIT :limit",
           nativeQuery = true)
    List<Map<String, Object>> findTopSellingProducts(@Param("limit") int limit);
}


