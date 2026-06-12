package com.example.backend.repository;

import com.example.backend.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
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
}
