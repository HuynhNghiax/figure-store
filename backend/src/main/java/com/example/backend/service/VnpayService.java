package com.example.backend.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * VNPay API 2.1.0 — Bản cấu hình chuẩn hóa tối thượng kết hợp %20 và chữ ký viết thường chuẩn mã nguồn mẫu
 */
@Service
public class VnpayService {

    private static final Logger log = LoggerFactory.getLogger(VnpayService.class);

    @Value("${vnpay.tmn-code:DEMO}")
    private String tmnCode;

    @Value("${vnpay.hash-secret:}")
    private String hashSecret;

    @Value("${vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String payUrl;

    @Value("${vnpay.return-url:http://localhost:8080/api/payments/vnpay-return}")
    private String returnUrl;

    @PostConstruct
    void logConfig() {
        log.info("VNPay TMN Code = [{}]", tmnCode);
        log.info("VNPay Hash Secret length = {}", getHashSecret().length());
        if ("DEMO".equals(tmnCode) || getHashSecret().isEmpty()) {
            log.warn(">>> VNPay CHƯA LOAD ĐÚNG CONFIG! Kiểm tra lại file application.properties");
        }
    }

    public String createPaymentUrl(long amountVnd, String txnRef, String orderInfo, String clientIp) {
        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        String createDate = new SimpleDateFormat("yyyyMMddHHmmss").format(cal.getTime());
        cal.add(Calendar.MINUTE, 15);
        String expireDate = new SimpleDateFormat("yyyyMMddHHmmss").format(cal.getTime());

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", tmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amountVnd * 100));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", orderInfo);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", returnUrl);
        vnpParams.put("vnp_IpAddr", normalizeIp(clientIp));
        vnpParams.put("vnp_CreateDate", createDate);
        vnpParams.put("vnp_ExpireDate", expireDate);

        return buildPaymentUrlJava(vnpParams);
    }

    public boolean validateReturn(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null) return false;

        Map<String, String> copy = new TreeMap<>(params);
        copy.remove("vnp_SecureHash");
        copy.remove("vnp_SecureHashType");

        String hashData = buildHashDataJava(copy);
        String calculated = hmacSHA512Official(getHashSecret(), hashData);
        return calculated.equalsIgnoreCase(receivedHash);
    }

    private String buildPaymentUrlJava(Map<String, String> vnpParams) {
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (int i = 0; i < fieldNames.size(); i++) {
            String fieldName = fieldNames.get(i);
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                
                // Mã hóa URL theo chuẩn UTF-8 và chuyển khoảng trắng thành %20 theo tài liệu v2.1.0
                String encodedValue = encodeUtf8(fieldValue);
                
                if (hashData.length() > 0) {
                    hashData.append('&');
                    query.append('&');
                }
                
                hashData.append(fieldName).append('=').append(encodedValue);
                query.append(encodeUtf8(fieldName)).append('=').append(encodedValue);
            }
        }

        // Băm chuỗi bằng mã hóa bảo mật Secret Key và xuất định dạng viết thường giống file mẫu Config.java gửi kèm
        String secureHash = hmacSHA512Official(getHashSecret(), hashData.toString());
        return payUrl + "?" + query.toString() + "&vnp_SecureHash=" + secureHash;
    }

    private String buildHashDataJava(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        for (int i = 0; i < fieldNames.size(); i++) {
            String fieldName = fieldNames.get(i);
            String fieldValue = params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                if (hashData.length() > 0) hashData.append('&');
                hashData.append(fieldName).append('=').append(encodeUtf8(fieldValue));
            }
        }
        return hashData.toString();
    }

    private static String encodeUtf8(String value) {
        try {
            // Sử dụng UTF-8 mã hóa và dọn sạch dấu cộng thành %20
            return URLEncoder.encode(value, StandardCharsets.UTF_8.toString()).replaceAll("\\+", "%20");
        } catch (Exception e) {
            return value;
        }
    }

    private String getHashSecret() {
        return hashSecret != null ? hashSecret.trim() : "";
    }

    private static String normalizeIp(String ip) {
        if (ip == null || ip.isBlank() || ip.contains(":")) {
            return "127.0.0.1";
        }
        return ip;
    }

    private static String hmacSHA512Official(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            mac.init(secretKey);
            byte[] result = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                // ĐỒNG BỘ CHỮ THƯỜNG %02x KHỚP 100% VỚI ĐÒNG 104 TRONG FILE CONFIG.JAVA MẪU VNPAY
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            throw new RuntimeException("VNPay HMAC error", ex);
        }
    }
}