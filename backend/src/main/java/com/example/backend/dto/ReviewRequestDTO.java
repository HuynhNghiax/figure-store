package com.example.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewRequestDTO {
    @NotNull(message = "productId không được để trống")
    private Long productId;

    @NotBlank(message = "Nội dung đánh giá không được để trống")
    private String comment;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer rating;
}
