package com.example.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.Map;

@Service
public class PaypalService {

    private static final Logger log = LoggerFactory.getLogger(PaypalService.class);

    private final RestTemplate restTemplate;

    @Value("${paypal.client-id:}")
    private String clientId;

    @Value("${paypal.client-secret:}")
    private String clientSecret;

    @Value("${paypal.mode:sandbox}")
    private String mode;

    // PayPal API base URLs
    private static final String SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
    private static final String LIVE_BASE = "https://api-m.paypal.com";

    @Value("${app.api-base-url:http://localhost:8080}")
    private String apiBaseUrl;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public PaypalService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    private String getBaseUrl() {
        return "sandbox".equalsIgnoreCase(mode) ? SANDBOX_BASE : LIVE_BASE;
    }

    /**
     * Get OAuth2 access token from PayPal
     */
    private String getAccessToken() {
        String url = getBaseUrl() + "/v1/oauth2/token";
        String auth = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + auth);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("access_token")) {
                return (String) responseBody.get("access_token");
            }
            log.error("PayPal access token response: {}", responseBody);
            throw new RuntimeException("Failed to get PayPal access token");
        } catch (Exception e) {
            log.error("Error getting PayPal access token", e);
            throw new RuntimeException("PayPal auth error: " + e.getMessage());
        }
    }

    /**
     * Create a PayPal order and return the approval URL
     */
    public Map<String, Object> createOrder(double amount, String currency, String txnRef) {
        String accessToken = getAccessToken();
        String url = getBaseUrl() + "/v2/checkout/orders";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + accessToken);

        Map<String, Object> purchaseUnit = Map.of(
                "reference_id", txnRef,
                "description", "FigHub Store - Don hang #" + txnRef,
                "amount", Map.of(
                        "currency_code", currency,
                        "value", String.format("%.2f", amount)
                )
        );

        Map<String, Object> orderRequest = Map.of(
                "intent", "CAPTURE",
                "purchase_units", new Object[]{purchaseUnit},
                "payment_source", Map.of(
                        "paypal", Map.of(
                                "experience_context", Map.of(
                                        "payment_method_preference", "IMMEDIATE_PAYMENT_REQUIRED",
                                        "landing_page", "LOGIN",
                                        "user_action", "PAY_NOW",
                                        "return_url", apiBaseUrl + "/api/payments/paypal-return?txnRef=" + txnRef,
                                        "cancel_url", frontendUrl + "/payment/result?status=cancelled"
                                )
                        )
                )
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(orderRequest, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            log.info("PayPal createOrder response: {}", responseBody);

            if (responseBody != null && responseBody.containsKey("id")) {
                String orderId = (String) responseBody.get("id");
                // Extract approval URL from links
                java.util.List<Map<String, String>> links = (java.util.List<Map<String, String>>) responseBody.get("links");
                String approvalUrl = null;
                for (Map<String, String> link : links) {
                    if ("payer-action".equals(link.get("rel"))) {
                        approvalUrl = link.get("href");
                        break;
                    }
                }
                return Map.of(
                        "paypalOrderId", orderId,
                        "approvalUrl", approvalUrl != null ? approvalUrl : ""
                );
            }
            throw new RuntimeException("Failed to create PayPal order: " + responseBody);
        } catch (Exception e) {
            log.error("Error creating PayPal order", e);
            throw new RuntimeException("PayPal create order error: " + e.getMessage());
        }
    }

    /**
     * Capture a PayPal order after buyer approval
     */
    public Map<String, Object> captureOrder(String paypalOrderId) {
        String accessToken = getAccessToken();
        String url = getBaseUrl() + "/v2/checkout/orders/" + paypalOrderId + "/capture";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + accessToken);

        HttpEntity<String> request = new HttpEntity<>("", headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            log.info("PayPal captureOrder response: {}", responseBody);

            if (responseBody != null) {
                String status = (String) responseBody.get("status");
                return Map.of(
                        "paypalOrderId", paypalOrderId,
                        "status", status != null ? status : "UNKNOWN"
                );
            }
            throw new RuntimeException("Failed to capture PayPal order");
        } catch (Exception e) {
            log.error("Error capturing PayPal order", e);
            throw new RuntimeException("PayPal capture error: " + e.getMessage());
        }
    }
}