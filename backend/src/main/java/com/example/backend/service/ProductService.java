package com.example.backend.service;

import com.example.backend.entity.Product;
import com.example.backend.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service xử lý business logic cho Product.
 * Tách biệt hoàn toàn khỏi Controller để tuân theo MVC.
 */
@Service
public class ProductService {

    private static final String UPLOAD_DIR = "uploads/";

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Lấy danh sách sản phẩm có phân trang, lọc và sắp xếp.
     */
    public Page<Product> getProducts(int page, int size, String search,
                                     String brand, Double minPrice, Double maxPrice,
                                     Long categoryId, String sortBy) {
        Sort sort = switch (sortBy != null ? sortBy : "newest") {
            case "price_asc"  -> Sort.by("price").ascending();
            case "price_desc" -> Sort.by("price").descending();
            default           -> Sort.by("id").descending();
        };
        PageRequest pageable = PageRequest.of(page, size, sort);
        return productRepository.findActiveFiltered(pageable, search, brand, minPrice, maxPrice, categoryId);
    }

    /**
     * Lấy danh sách thương hiệu đang active.
     */
    public List<String> getBrands() {
        return productRepository.findAllBrandsActive();
    }

    /**
     * Lấy sản phẩm liên quan (cùng brand hoặc category), tối đa 6.
     */
    public List<Product> getRelatedProducts(Long id) {
        return productRepository.findById(id)
                .filter(p -> p.getDeleted() == null || !p.getDeleted())
                .map(product -> productRepository.findRelated(
                        product.getId(),
                        product.getBrand(),
                        product.getCategoryId(),
                        PageRequest.of(0, 6)
                ))
                .orElse(List.of());
    }

    /**
     * Lấy tất cả sản phẩm cho Admin (có cả đã bị xóa mềm).
     */
    public Page<Product> getProductsForAdmin(int page, int size) {
        return productRepository.findAll(PageRequest.of(page, size, Sort.by("id").descending()));
    }

    /**
     * Lấy sản phẩm theo ID (chỉ lấy sản phẩm chưa xóa).
     */
    public ResponseEntity<Product> getProductById(Long id) {
        return productRepository.findById(id)
                .filter(p -> p.getDeleted() == null || !p.getDeleted())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Tạo sản phẩm mới.
     */
    public Product createProduct(Product product) {
        product.setDeleted(false);
        return productRepository.save(product);
    }

    /**
     * Cập nhật sản phẩm theo ID.
     */
    public ResponseEntity<?> updateProduct(Long id, Product details) {
        return productRepository.findById(id).map(product -> {
            product.setName(details.getName());
            product.setPrice(details.getPrice());
            product.setBrand(details.getBrand());
            product.setImageUrl(details.getImageUrl());
            product.setStock(details.getStock());
            product.setIsPreOrder(details.getIsPreOrder());
            product.setDescription(details.getDescription());
            product.setCategoryId(details.getCategoryId());
            if (details.getImages() != null) {
                product.setImages(details.getImages());
            }
            return ResponseEntity.ok(productRepository.save(product));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Xóa mềm sản phẩm (soft delete).
     */
    public ResponseEntity<?> deleteProduct(Long id) {
        return productRepository.findById(id).map(product -> {
            product.setDeleted(true);
            productRepository.save(product);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Khôi phục sản phẩm đã xóa mềm.
     */
    public ResponseEntity<?> restoreProduct(Long id) {
        return productRepository.findById(id).map(product -> {
            product.setDeleted(false);
            productRepository.save(product);
            return ResponseEntity.ok().body(Map.of("message", "Khôi phục mô hình thành công!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Upload ảnh sản phẩm lên server.
     */
    public ResponseEntity<?> uploadImage(MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng chọn một file ảnh hợp lệ!"));
        }
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String originalName = file.getOriginalFilename();
            String fileName = UUID.randomUUID() + "_" + (originalName != null ? new File(originalName).getName() : "image");
            Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok().body(Map.of("imageUrl", "/uploads/" + fileName));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi ghi file!"));
        }
    }
}
