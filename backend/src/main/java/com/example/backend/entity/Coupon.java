package com.example.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Data
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Mã giảm giá không được để trống!")
    @Size(min = 3, max = 20, message = "Mã giảm giá phải từ 3 đến 20 ký tự!")
    @Column(nullable = false, unique = true)
    private String code;

    @NotNull(message = "Phần trăm giảm giá không được để trống!")
    @DecimalMin(value = "1.0", message = "Phần trăm giảm tối thiểu là 1%!")
    @DecimalMax(value = "100.0", message = "Phần trăm giảm tối đa là 100%!")
    @Column(nullable = false)
    private Double discountPercent;

    @NotNull(message = "Ngày hết hạn không được để trống!")
    @Future(message = "Ngày hết hạn phải là ngày trong tương lai!")
    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @NotNull(message = "Số lần sử dụng tối đa không được để trống!")
    @Min(value = 1, message = "Số lần sử dụng phải ít nhất là 1!")
    @Column(nullable = false)
    private Integer maxUses;

    @Column(nullable = false)
    private Integer usedCount = 0;
}