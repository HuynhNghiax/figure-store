package com.example.backend.repository;

import com.example.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    // Tự động sinh query tìm đơn hàng theo User ID, sắp xếp mới nhất
    List<Order> findByUserIdOrderByIdDesc(Long userId);
}