package com.example.backend.service;

import com.example.backend.entity.Order;
import com.example.backend.entity.OrderItem;
import com.example.backend.entity.Product;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public void deductStock(Order order) {
        if (order.getItems() == null) return;
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm ID: " + item.getProductId()));
            if (product.getStock() < item.getQuantity()) {
                throw new IllegalArgumentException("Sản phẩm '" + product.getName() + "' không đủ tồn kho!");
            }
            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);
        }
    }

    public String validateStock(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            return "Giỏ hàng trống rỗng!";
        }
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findById(item.getProductId()).orElse(null);
            if (product == null) {
                return "Không tìm thấy sản phẩm ID: " + item.getProductId();
            }
            if (Boolean.TRUE.equals(product.getDeleted())) {
                return "Sản phẩm '" + product.getName() + "' không còn bán!";
            }
            if (product.getStock() < item.getQuantity()) {
                return "Mô hình '" + product.getName() + "' không đủ số lượng trong kho!";
            }
        }
        return null;
    }

    @Transactional
    public Order save(Order order) {
        return orderRepository.save(order);
    }

    @Transactional
    public void restockItems(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
            
            // Cộng ngược số lượng đã hủy vào kho
            product.setStock(product.getStock() + item.getQuantity());
            productRepository.save(product);
        }
    }
}
