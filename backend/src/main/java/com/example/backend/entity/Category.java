package com.example.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Entity
@Table(name = "categories")
@Data
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tên danh mục không được để trống!")
    @Size(min = 2, max = 100, message = "Tên danh mục phải từ 2 đến 100 ký tự!")
    @Column(nullable = false, unique = true)
    private String name;
}