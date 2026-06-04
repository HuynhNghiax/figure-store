package com.example.backend.controller;

import com.example.backend.entity.Coupon;
import com.example.backend.repository.CouponRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponRepository couponRepository;

    public CouponController(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCoupon(@RequestBody Coupon coupon) {
        if (coupon.getCode() == null || coupon.getCode().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã giảm giá không được để trống!"));
        }
        if (coupon.getDiscountPercent() == null || coupon.getDiscountPercent() <= 0 || coupon.getDiscountPercent() > 100) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phần trăm giảm phải từ 1-100!"));
        }
        return ResponseEntity.ok(couponRepository.save(coupon));
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateCoupon(@RequestBody Map<String, String> data) {
        String code = data.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập mã giảm giá!"));
        }
        var opt = couponRepository.findByCode(code.toUpperCase());
        if (opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã giảm giá không tồn tại!"));
        }
        Coupon coupon = opt.get();
        if (coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã giảm giá đã hết hạn!"));
        }
        if (coupon.getUsedCount() >= coupon.getMaxUses()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã giảm giá đã hết lượt sử dụng!"));
        }
        return ResponseEntity.ok(Map.of(
            "message", "Mã giảm giá hợp lệ!",
            "discountPercent", coupon.getDiscountPercent(),
            "code", coupon.getCode()
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCoupon(@PathVariable Long id) {
        couponRepository.deleteById(id);
        return ResponseEntity.ok().body(Map.of("message", "Đã xóa mã giảm giá!"));
    }
}