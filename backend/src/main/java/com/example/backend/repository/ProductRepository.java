package com.example.backend.repository;

import com.example.backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByDeletedFalse(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE (p.deleted = false OR p.deleted IS NULL) " +
           "AND (:search IS NULL OR :search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:brand IS NULL OR :brand = '' OR :brand = 'All' OR p.brand = :brand) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice)")
    Page<Product> findActiveFiltered(
            Pageable pageable,
            @Param("search") String search,
            @Param("brand") String brand,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice);
}

