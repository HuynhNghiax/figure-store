package com.example.backend.controller;

import com.example.backend.entity.Coupon;
import com.example.backend.entity.Order;
import com.example.backend.entity.User;
import com.example.backend.repository.CouponRepository;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.SecurityUtils;
import com.example.backend.service.OrderService;
import com.example.backend.service.PaypalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaypalService paypalService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order,
                                         @RequestParam(required = false) String couponCode) {
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

        if ("PAYPAL".equalsIgnoreCase(paymentMethod)) {
            order.setPaymentStatus("UNPAID");
            Order saved = orderService.save(order);

            String txnRef = "FIG" + saved.getId() + System.currentTimeMillis();
            double amount = saved.getTotalAmount() != null ? saved.getTotalAmount() : 0;

            try {
                Map<String, Object> paypalResult = paypalService.createOrder(amount, "USD", txnRef);
                String paypalOrderId = (String) paypalResult.get("paypalOrderId");
                saved.setPaypalOrderId(paypalOrderId);
                // Lưu couponCode vào note để xử lý sau khi PayPal confirm
                if (couponCode != null && !couponCode.isBlank()) {
                    saved.setCouponCode(couponCode);
                }
                orderService.save(saved);

                return ResponseEntity.ok(Map.of(
                        "order", saved,
                        "approvalUrl", paypalResult.get("approvalUrl"),
                        "paypalOrderId", paypalOrderId,
                        "message", "Chuyển sang PayPal để thanh toán"
                ));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Lỗi kết nối PayPal: " + e.getMessage()));
            }
        }

        // COD - thanh toán khi nhận hàng
        order.setPaymentStatus("PAID");
        if (couponCode != null && !couponCode.isBlank()) {
            order.setCouponCode(couponCode);
        }
        try {
            orderService.deductStock(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
        Order saved = orderService.save(order);

        // Tăng usedCount coupon nếu có
        if (couponCode != null && !couponCode.isBlank()) {
            couponRepository.findByCode(couponCode.toUpperCase()).ifPresent(coupon -> {
                coupon.setUsedCount(coupon.getUsedCount() + 1);
                couponRepository.save(coupon);
            });
        }

        // Gửi email xác nhận đặt hàng COD
        if (saved.getUserId() != null && mailFrom != null && !mailFrom.isBlank()) {
            userRepository.findById(saved.getUserId()).ifPresent(user -> {
                try {
                    StringBuilder itemsText = new StringBuilder();
                    if (saved.getItems() != null) {
                        for (var item : saved.getItems()) {
                            itemsText.append("  - ").append(item.getProductName())
                                    .append(" x").append(item.getQuantity())
                                    .append(" — ").append(String.format("%,.0f", item.getPrice())).append("đ\n");
                        }
                    }
                    SimpleMailMessage msg = new SimpleMailMessage();
                    msg.setFrom(mailFrom);
                    msg.setTo(user.getEmail());
                    msg.setSubject("FIGHUB - XÁC NHẬN ĐƠN HÀNG #FIG-" + saved.getId());
                    msg.setText("Xin chào " + user.getUsername() + ",\n\n"
                            + "Cảm ơn bạn đã đặt hàng tại FigHub! Đơn hàng của bạn đã được xác nhận.\n\n"
                            + "📦 Mã đơn hàng: #FIG-" + saved.getId() + "\n"
                            + "💳 Phương thức: Thanh toán khi nhận hàng (COD)\n"
                            + "📍 Giao đến: " + saved.getAddress() + "\n\n"
                            + "Sản phẩm:\n" + itemsText
                            + "\n💰 Tổng tiền: " + String.format("%,.0f", saved.getTotalAmount()) + "đ\n\n"
                            + "Chúng tôi sẽ liên hệ xác nhận giao hàng trong thời gian sớm nhất.\n"
                            + "Cảm ơn bạn đã tin tưởng FigHub!");
                    mailSender.send(msg);
                } catch (Exception ignored) {}
            });
        }

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

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return orderRepository.findById(id).map(order -> {
            if (!SecurityUtils.isAdmin() && !order.getUserId().equals(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Không có quyền xem đơn hàng này!"));
            }
            return ResponseEntity.ok(order);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "ALL") String status) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        String statusParam = (status != null && !status.isBlank() && !"ALL".equals(status)) ? status : null;
        return ResponseEntity.ok(orderRepository.findFiltered(statusParam, searchParam, pageable));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập!"));
        }
        return orderRepository.findById(id).map(order -> {
            // Fix NPE: kiểm tra userId của đơn hàng trước khi so sánh
            if (order.getUserId() == null || !order.getUserId().equals(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Bạn không có quyền huỷ đơn hàng này!"));
            }
            if (!"PENDING".equals(order.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Chỉ có thể huỷ đơn hàng đang chờ xử lý!"));
            }
            order.setStatus("CANCELLED");
            orderRepository.save(order);
            // Hoàn lại tồn kho
            orderService.restoreStock(order);
            return ResponseEntity.ok().body(Map.of("message", "Đã huỷ đơn hàng thành công!"));
        }).orElse(ResponseEntity.notFound().build());
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

            // Gửi email thông báo cho user
            if (order.getUserId() != null) {
                Optional<User> userOpt = userRepository.findById(order.getUserId());
                userOpt.ifPresent(user -> {
                    try {
                        String statusText = switch (newStatus) {
                            case "SHIPPED" -> "đang được giao hàng";
                            case "DELIVERED" -> "đã giao thành công";
                            case "COMPLETED" -> "đã hoàn thành";
                            case "CANCELLED" -> "đã bị huỷ";
                            default -> "đã cập nhật: " + newStatus;
                        };
                        SimpleMailMessage msg = new SimpleMailMessage();
                        if (mailFrom != null && !mailFrom.isBlank()) msg.setFrom(mailFrom);
                        msg.setTo(user.getEmail());
                        msg.setSubject("FIGHUB - CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG #FIG-" + order.getId());
                        msg.setText("Xin chào " + user.getUsername() + ",\n\n"
                                + "Đơn hàng #FIG-" + order.getId() + " của bạn " + statusText + ".\n\n"
                                + "Cảm ơn bạn đã mua sắm tại FigHub!");
                        mailSender.send(msg);
                    } catch (Exception ignored) {}
                });
            }
            return ResponseEntity.ok().body(Map.of("message", "Cập nhật trạng thái đơn hàng thành công!"));
        }).orElse(ResponseEntity.notFound().build());
    }
}