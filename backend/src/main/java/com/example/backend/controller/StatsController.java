package com.example.backend.controller;

import com.example.backend.service.StatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    /** Tổng hợp dashboard chính */
    @GetMapping
    public ResponseEntity<?> getStats() {
        return statsService.getDashboardStats();
    }

    /** Doanh thu theo tháng trong năm cụ thể — GET /api/admin/stats/monthly?year=2026 */
    @GetMapping("/monthly")
    public ResponseEntity<?> getMonthly(@RequestParam(defaultValue = "0") int year) {
        int targetYear = year > 0 ? year : java.time.LocalDate.now().getYear();
        return statsService.getMonthlyStats(targetYear);
    }

    /** Doanh thu theo năm — GET /api/admin/stats/yearly */
    @GetMapping("/yearly")
    public ResponseEntity<?> getYearly() {
        return statsService.getYearlyStats();
    }
}
