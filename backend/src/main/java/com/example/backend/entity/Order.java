package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerName;
    private String phone;
    private String address;
    private Double totalAmount;
    private String status = "PENDING";
    private String paymentStatus = "UNPAID";
    private String paymentMethod = "COD";
    private String paypalOrderId;
    private String couponCode;
    private LocalDateTime createdAt = LocalDateTime.now();

    private Long userId;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "order_id")
    private List<OrderItem> items;
}
