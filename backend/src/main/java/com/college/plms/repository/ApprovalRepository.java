package com.college.plms.repository;

import com.college.plms.model.Approval;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {
    List<Approval> findByProjectId(Long projectId);
}
