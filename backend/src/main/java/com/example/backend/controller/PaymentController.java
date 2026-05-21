package com.example.backend.controller;

import com.example.backend.entity.Order;
import com.example.backend.repository.OrderRepository;
import com.example.backend.service.OrderService;
import com.example.backend.service.VnpayService;
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
    private final VnpayService vnpayService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public PaymentController(OrderRepository orderRepository, OrderService orderService, VnpayService vnpayService) {
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.vnpayService = vnpayService;
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null) {
            return redirect(frontendUrl + "/payment/result?status=error");
        }

        return orderRepository.findByVnpTxnRef(txnRef).map(order -> {
            if (vnpayService.validateReturn(params)) {
                if (!"PAID".equals(order.getPaymentStatus())) {
                    orderService.deductStock(order);
                    order.setPaymentStatus("PAID");
                    order.setStatus("PENDING");
                    orderRepository.save(order);
                }
                return redirect(frontendUrl + "/payment/result?status=success&orderId=" + order.getId());
            }
            order.setPaymentStatus("FAILED");
            orderRepository.save(order);
            return redirect(frontendUrl + "/payment/result?status=failed&orderId=" + order.getId());
        }).orElse(redirect(frontendUrl + "/payment/result?status=error"));
    }

    private ResponseEntity<Void> redirect(String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(url));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }
}
