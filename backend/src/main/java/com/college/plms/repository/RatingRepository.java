package com.college.plms.repository;

import com.college.plms.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByProjectId(Long projectId);
}
