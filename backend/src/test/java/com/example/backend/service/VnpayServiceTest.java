package com.example.backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "vnpay.tmn-code=MV7NRDRQ",
        "vnpay.hash-secret=OWSMGXQ4PZWLKZYYGZAMBJZLFUBF01J9",
        "vnpay.return-url=http://localhost:8080/api/payments/vnpay-return"
})
class VnpayServiceTest {

    @Autowired
    private VnpayService vnpayService;

    @Test
    void paymentUrlContainsTmnAndSecureHash() {
        String url = vnpayService.createPaymentUrl(
                100000L,
                "FIG123456",
                "Thanh toan don hang 1",
                "127.0.0.1"
        );
        assertTrue(url.contains("vnp_TmnCode=MV7NRDRQ"), url);
        assertTrue(url.contains("vnp_SecureHash="), url);
        assertTrue(url.contains("vnp_Amount=10000000"), url);
        assertFalse(url.contains("vnp_SecureHash=&"), url);
    }
}
