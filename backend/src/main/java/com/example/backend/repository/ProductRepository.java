package com.example.backend.repository;

import com.example.backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByDeletedFalse(Pageable pageable);

    long countByDeletedFalse();

    @Query("SELECT p FROM Product p WHERE (p.deleted = false OR p.deleted IS NULL) " +
           "AND (:search IS NULL OR :search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:brand IS NULL OR :brand = '' OR :brand = 'All' OR p.brand = :brand) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice) " +
           "AND (:categoryId IS NULL OR p.categoryId = :categoryId)")
    Page<Product> findActiveFiltered(
            Pageable pageable,
            @Param("search") String search,
            @Param("brand") String brand,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("categoryId") Long categoryId);

    @Query("SELECT DISTINCT p.brand FROM Product p WHERE (p.deleted = false OR p.deleted IS NULL) ORDER BY p.brand ASC")
    List<String> findAllBrandsActive();

    // Sản phẩm liên quan: cùng brand hoặc cùng category, loại trừ chính nó
    @Query("SELECT p FROM Product p WHERE (p.deleted = false OR p.deleted IS NULL) " +
           "AND p.id <> :excludeId " +
           "AND (p.brand = :brand OR (:categoryId IS NOT NULL AND p.categoryId = :categoryId)) " +
           "ORDER BY p.id DESC")
    List<Product> findRelated(
            @Param("excludeId") Long excludeId,
            @Param("brand") String brand,
            @Param("categoryId") Long categoryId,
            Pageable pageable);
}
