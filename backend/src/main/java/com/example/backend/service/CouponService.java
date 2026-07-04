package com.example.backend.service;

import com.example.backend.entity.Coupon;
import com.example.backend.repository.CouponRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service xử lý business logic cho Coupon (mã giảm giá).
 */
@Service
public class CouponService {

    private final CouponRepository couponRepository;

    public CouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    /**
     * Lấy tất cả mã giảm giá (Admin).
     */
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    /**
     * Tạo mã giảm giá mới (Admin).
     */
    public ResponseEntity<?> createCoupon(Coupon coupon) {
        if (coupon.getCode() == null || coupon.getCode().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã giảm giá không được để trống!"));
        }
        if (coupon.getDiscountPercent() == null || coupon.getDiscountPercent() <= 0 || coupon.getDiscountPercent() > 100) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phần trăm giảm phải từ 1-100!"));
        }
        return ResponseEntity.ok(couponRepository.save(coupon));
    }

    /**
     * Kiểm tra mã giảm giá hợp lệ (Public).
     * Trả về thông tin discount nếu hợp lệ.
     */
    public ResponseEntity<?> validateCoupon(String code) {
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

    /**
     * Xóa mã giảm giá (Admin).
     */
    public ResponseEntity<?> deleteCoupon(Long id) {
        couponRepository.deleteById(id);
        return ResponseEntity.ok().body(Map.of("message", "Đã xóa mã giảm giá!"));
    }
}
