package com.example.backend.service;

import com.example.backend.entity.Order;
import com.example.backend.entity.User;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

/**
 * Service xử lý gửi email bất đồng bộ (@Async).
 * Nhờ @Async, các request gửi email sẽ không block luồng HTTP chính,
 * giúp API phản hồi ngay lập tức mà không cần chờ SMTP hoàn tất.
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String mailFrom;

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.username:}") String mailFrom) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
    }

    /**
     * Gửi email OTP xác thực tài khoản (bất đồng bộ).
     */
    @Async
    public void sendOtpEmail(String toEmail, String otp, String subject) {
        if (!canSend(toEmail)) return;
        SimpleMailMessage message = new SimpleMailMessage();
        if (mailFrom != null && !mailFrom.isBlank()) message.setFrom(mailFrom);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(
            "Mã xác thực của bạn là: " + otp + "\n" +
            "Mã có hiệu lực trong 10 phút.\n" +
            "Vui lòng không chia sẻ mã này với bất kỳ ai."
        );
        try { mailSender.send(message); } catch (Exception ignored) {}
    }

    /**
     * Gửi email link đặt lại mật khẩu (bất đồng bộ).
     */
    @Async
    public void sendResetPasswordEmail(String toEmail, String resetLink) {
        if (!canSend(toEmail)) return;
        SimpleMailMessage message = new SimpleMailMessage();
        if (mailFrom != null && !mailFrom.isBlank()) message.setFrom(mailFrom);
        message.setTo(toEmail);
        message.setSubject("FIGHUB - KHÔI PHỤC MẬT KHẨU");
        message.setText(
            "Bạn đã yêu cầu khôi phục mật khẩu FigHub.\n\n" +
            "Nhấp vào link bên dưới để đặt lại mật khẩu (hiệu lực trong 5 phút, chỉ sử dụng 1 lần):\n\n" +
            resetLink + "\n\n" +
            "Nếu bạn không yêu cầu khôi phục, vui lòng bỏ qua email này."
        );
        try { mailSender.send(message); } catch (Exception ignored) {}
    }

    /**
     * Gửi email xác nhận đặt hàng COD (bất đồng bộ).
     */
    @Async
    public void sendOrderConfirmEmail(User user, Order order) {
        if (!canSend(user.getEmail())) return;
        StringBuilder items = new StringBuilder();
        if (order.getItems() != null) {
            for (var item : order.getItems()) {
                items.append("  - ").append(item.getProductName())
                     .append(" x").append(item.getQuantity())
                     .append(" — ").append(String.format("%,.0f", item.getPrice())).append("đ\n");
            }
        }
        SimpleMailMessage msg = new SimpleMailMessage();
        if (mailFrom != null && !mailFrom.isBlank()) msg.setFrom(mailFrom);
        msg.setTo(user.getEmail());
        msg.setSubject("FIGHUB - XÁC NHẬN ĐƠN HÀNG #FIG-" + order.getId());
        msg.setText("Xin chào " + user.getUsername() + ",\n\n"
                + "Cảm ơn bạn đã đặt hàng tại FigHub! Đơn hàng của bạn đã được xác nhận.\n\n"
                + "📦 Mã đơn hàng: #FIG-" + order.getId() + "\n"
                + "💳 Phương thức: Thanh toán khi nhận hàng (COD)\n"
                + "📍 Giao đến: " + order.getAddress() + "\n\n"
                + "Sản phẩm:\n" + items
                + "\n💰 Tổng tiền: " + String.format("%,.0f", order.getTotalAmount()) + "đ\n\n"
                + "Chúng tôi sẽ liên hệ xác nhận giao hàng trong thời gian sớm nhất.\n"
                + "Cảm ơn bạn đã tin tưởng FigHub!");
        try { mailSender.send(msg); } catch (Exception ignored) {}
    }

    /**
     * Gửi email thông báo cập nhật trạng thái đơn hàng (bất đồng bộ).
     * Bao gồm case DELIVERED mới thêm.
     */
    @Async
    public void sendOrderStatusEmail(User user, Order order, String newStatus) {
        if (!canSend(user.getEmail())) return;
        String statusText = switch (newStatus) {
            case "SHIPPED"   -> "đang được giao hàng 🚚";
            case "DELIVERED" -> "đã được giao đến địa chỉ của bạn 📨";
            case "COMPLETED" -> "đã hoàn thành ✓";
            case "CANCELLED" -> "đã bị huỷ ✕";
            default          -> "đã cập nhật trạng thái: " + newStatus;
        };
        SimpleMailMessage msg = new SimpleMailMessage();
        if (mailFrom != null && !mailFrom.isBlank()) msg.setFrom(mailFrom);
        msg.setTo(user.getEmail());
        msg.setSubject("FIGHUB - CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG #FIG-" + order.getId());
        msg.setText("Xin chào " + user.getUsername() + ",\n\n"
                + "Đơn hàng #FIG-" + order.getId() + " của bạn " + statusText + ".\n\n"
                + "Cảm ơn bạn đã mua sắm tại FigHub!");
        try { mailSender.send(msg); } catch (Exception ignored) {}
    }

    // ── Helper: kiểm tra điều kiện gửi mail ──────────────────────
    private boolean canSend(String email) {
        return email != null && !email.isBlank()
            && mailFrom != null && !mailFrom.isBlank();
    }
}
