package com.example.backend.controller;

import com.example.backend.entity.Order;
import com.example.backend.entity.User;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.SecurityUtils;
import com.example.backend.service.OrderService;
import com.example.backend.service.PaypalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order) {
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
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Không có quyền!"));
    }
    List<Order> orders = orderRepository.findByUserId(userId);
    
    orders.sort((o1, o2) -> o2.getId().compareTo(o1.getId()));
    
    return ResponseEntity.ok(orders);
}

   @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) { // 1. Hứng tham số status từ Frontend gửi lên

        PageRequest pageable = PageRequest.of(page, size, Sort.by("id").descending());

        // Trường hợp 1: Có nhập từ khóa tìm kiếm (search)
        if (search != null && !search.isBlank()) {
            try {
                Long searchId = Long.parseLong(search);
                return ResponseEntity.ok(orderRepository.findById(searchId)
                        .map(List::of)
                        .orElse(List.of()));
            } catch (NumberFormatException e) {
                // Nếu search không phải là số (ID), có thể bổ sung tìm theo tên khách ở đây
                // Tạm thời trả về trang trống nếu không ép kiểu được số giống logic cũ của bạn
                return ResponseEntity.ok(Page.empty());
            }
        }

        // Trường hợp 2: Có chọn lọc theo trạng thái (status) cụ thể và khác "ALL"
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            // Sử dụng hàm truy vấn lọc theo status được viết trong Repository
            Page<Order> orderPage = orderRepository.findByStatus(status, pageable);
            return ResponseEntity.ok(orderPage);
        }

        // Trường hợp 3: Không tìm kiếm, không chọn trạng thái (Hoặc chọn tab Tất cả) -> Lấy hết đơn hàng
        return ResponseEntity.ok(orderRepository.findAll(pageable));
    }

    @PutMapping("/{id}/cancel")
public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
    Long currentUserId = SecurityUtils.getCurrentUserId();
    if (currentUserId == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập!"));
    }

    boolean isAdmin = SecurityUtils.isAdmin();

    return orderRepository.findById(id).map(order -> {
        // 1. Kiểm tra quyền sở hữu
        boolean isOwner = order.getUserId() != null && order.getUserId().equals(currentUserId);
        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Bạn không có quyền huỷ đơn hàng này!"));
        }

        // 2. Kiểm tra trạng thái
        String currentStatus = order.getStatus() != null ? order.getStatus().trim() : "";
        if (!"PENDING".equalsIgnoreCase(currentStatus)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ có thể huỷ đơn hàng đang chờ xử lý!"));
        }

        // 3. HOÀN KHO (Logic quan trọng)
        // Gọi hàm hoàn kho từ orderService (bạn cần đảm bảo hàm này đã được viết như gợi ý trước)
        try {
            orderService.restockItems(order); 
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("message", "Lỗi khi hoàn kho: " + e.getMessage()));
        }

        // 4. Cập nhật trạng thái
        order.setStatus("CANCELLED");
        orderRepository.save(order);
        
        return ResponseEntity.ok().body(Map.of("message", "Đã huỷ đơn và hoàn kho thành công!"));
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