package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "products")
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Double price;
    private String brand;
    @Column(name = "image_url")
    private String imageUrl;
    private Boolean isPreOrder;
    private Integer stock;
}