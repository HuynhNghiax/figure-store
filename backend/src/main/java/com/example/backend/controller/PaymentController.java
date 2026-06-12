package com.example.backend.controller;

import com.example.backend.entity.Order;
import com.example.backend.repository.CouponRepository;
import com.example.backend.repository.OrderRepository;
import com.example.backend.service.OrderService;
import com.example.backend.service.PaypalService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final PaypalService paypalService;
    private final CouponRepository couponRepository;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public PaymentController(OrderRepository orderRepository, OrderService orderService,
                             PaypalService paypalService, CouponRepository couponRepository) {
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.paypalService = paypalService;
        this.couponRepository = couponRepository;
    }

    /**
     * PayPal redirects here after buyer approves/cancels payment.
     */
    @GetMapping("/paypal-return")
    public ResponseEntity<Void> paypalReturn(
            @RequestParam("txnRef") String txnRef,
            @RequestParam("token") String token,
            @RequestParam(value = "PayerID", required = false) String payerId) {

        if (payerId == null || payerId.isBlank()) {
            return redirect(frontendUrl + "/payment/result?status=cancelled");
        }

        return orderRepository.findByPaypalOrderId(token).map(order -> {
            try {
                Map<String, Object> result = paypalService.captureOrder(token);
                String status = (String) result.get("status");
                if ("COMPLETED".equalsIgnoreCase(status)) {
                    // Guard: chỉ xử lý 1 lần, tránh double deduct
                    if (!"PAID".equals(order.getPaymentStatus())) {
                        orderService.deductStock(order);
                        order.setPaymentStatus("PAID");
                        order.setStatus("PENDING");
                        orderRepository.save(order);
                        // Tăng usedCount coupon nếu có
                        incrementCouponUsage(order.getCouponCode());
                    }
                    return redirect(frontendUrl + "/payment/result?status=success&orderId=" + order.getId());
                } else {
                    order.setPaymentStatus("FAILED");
                    orderRepository.save(order);
                    return redirect(frontendUrl + "/payment/result?status=failed&orderId=" + order.getId());
                }
            } catch (Exception e) {
                order.setPaymentStatus("FAILED");
                orderRepository.save(order);
                return redirect(frontendUrl + "/payment/result?status=error&orderId=" + order.getId());
            }
        }).orElse(redirect(frontendUrl + "/payment/result?status=error"));
    }

    /**
     * API for frontend to check PayPal payment status after redirect from PayPal.
     */
    @PostMapping("/paypal-check")
    public ResponseEntity<?> checkPaypalPayment(@RequestBody Map<String, String> body) {
        String paypalOrderId = body.get("paypalOrderId");

        return orderRepository.findByPaypalOrderId(paypalOrderId).map(order -> {
            // Nếu đã PAID rồi, trả về luôn mà không capture lại (idempotent)
            if ("PAID".equals(order.getPaymentStatus())) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "paymentStatus", "PAID",
                        "orderId", order.getId()
                ));
            }
            try {
                Map<String, Object> result = paypalService.captureOrder(paypalOrderId);
                String status = (String) result.get("status");

                if ("COMPLETED".equalsIgnoreCase(status)) {
                    orderService.deductStock(order);
                    order.setPaymentStatus("PAID");
                    order.setStatus("PENDING");
                    orderRepository.save(order);
                    incrementCouponUsage(order.getCouponCode());
                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "paymentStatus", "PAID",
                            "orderId", order.getId()
                    ));
                } else {
                    order.setPaymentStatus("FAILED");
                    orderRepository.save(order);
                    return ResponseEntity.ok(Map.of(
                            "success", false,
                            "paymentStatus", "FAILED"
                    ));
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("success", false, "message", e.getMessage()));
            }
        }).orElse(ResponseEntity.badRequest().body(Map.of("success", false, "message", "Order not found")));
    }

    private void incrementCouponUsage(String couponCode) {
        if (couponCode != null && !couponCode.isBlank()) {
            couponRepository.findByCode(couponCode.toUpperCase()).ifPresent(coupon -> {
                coupon.setUsedCount(coupon.getUsedCount() + 1);
                couponRepository.save(coupon);
            });
        }
    }

    private ResponseEntity<Void> redirect(String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(url));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }
}