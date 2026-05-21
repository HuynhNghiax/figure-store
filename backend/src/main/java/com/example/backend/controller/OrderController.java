package com.example.backend.controller;

import com.example.backend.entity.Order;
import com.example.backend.repository.OrderRepository;
import com.example.backend.security.SecurityUtils;
import com.example.backend.service.OrderService;
import com.example.backend.service.VnpayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private VnpayService vnpayService;

    @Value("${app.api-base-url:http://localhost:8080}")
    private String apiBaseUrl;

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order, HttpServletRequest request) {
        String stockError = orderService.validateStock(order);
        if (stockError != null) {
            return ResponseEntity.badRequest().body(Map.of("message", stockError));
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null) {
            order.setUserId(currentUserId);
        }

        String paymentMethod = order.getPaymentMethod() != null ? order.getPaymentMethod() : "COD";
        order.setPaymentMethod(paymentMethod);
        order.setStatus("PENDING");

        if ("VNPAY".equalsIgnoreCase(paymentMethod)) {
            String txnRef = "FIG" + System.currentTimeMillis();
            order.setVnpTxnRef(txnRef);
            order.setPaymentStatus("UNPAID");
            Order saved = orderService.save(order);

            String clientIp = request.getRemoteAddr();
            long amountVnd = saved.getTotalAmount() != null
                    ? Math.round(saved.getTotalAmount())
                    : 0L;
            String paymentUrl = vnpayService.createPaymentUrl(
                    amountVnd,
                    txnRef,
                    "Thanh toan don hang " + saved.getId(),
                    clientIp
            );
            return ResponseEntity.ok(Map.of(
                    "order", saved,
                    "paymentUrl", paymentUrl,
                    "message", "Chuyển sang VNPay để thanh toán"
            ));
        }

        order.setPaymentStatus("PAID");
        try {
            orderService.deductStock(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
        Order saved = orderService.save(order);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getOrdersByUserId(@PathVariable Long userId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (!SecurityUtils.isAdmin() && (currentUserId == null || !currentUserId.equals(userId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Không có quyền xem đơn hàng này!"));
        }
        return ResponseEntity.ok(orderRepository.findByUserId(userId));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> statusData) {
        String newStatus = statusData.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái không hợp lệ!"));
        }
        return orderRepository.findById(id).map(order -> {
            order.setStatus(newStatus);
            orderRepository.save(order);
            return ResponseEntity.ok().body(Map.of("message", "Cập nhật trạng thái đơn hàng thành công!"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
