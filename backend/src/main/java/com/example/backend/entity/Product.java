package com.example.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Entity
@Table(name = "products")
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tên mô hình không được để trống!")
    @Column(nullable = false)
    private String name;

    @NotNull(message = "Giá sản phẩm không được để trống!")
    @Min(value = 0, message = "Giá sản phẩm không được nhỏ hơn 0đ!")
    @Column(nullable = false)
    private Double price;

    @NotBlank(message = "Thương hiệu không được để trống!")
    @Column(nullable = false)
    private String brand;

    @NotBlank(message = "Đường dẫn ảnh không được để trống!")
    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @NotNull(message = "Số lượng kho không được để trống!")
    @Min(value = 0, message = "Số lượng tồn kho không được nhỏ hơn 0!")
    @Column(nullable = false)
    private Integer stock;

    private Boolean isPreOrder = false;

    private Boolean deleted = false;
}