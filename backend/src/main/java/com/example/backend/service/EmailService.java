package com.example.backend.service;

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
        SimpleMailMessage message = new SimpleMailMessage();
        if (mailFrom != null && !mailFrom.isBlank()) message.setFrom(mailFrom);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(
            "Mã xác thực của bạn là: " + otp + "\n" +
            "Mã có hiệu lực trong 10 phút.\n" +
            "Vui lòng không chia sẻ mã này với bất kỳ ai."
        );
        mailSender.send(message);
    }

    /**
     * Gửi email link đặt lại mật khẩu (bất đồng bộ).
     */
    @Async
    public void sendResetPasswordEmail(String toEmail, String resetLink) {
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
        mailSender.send(message);
    }
}
