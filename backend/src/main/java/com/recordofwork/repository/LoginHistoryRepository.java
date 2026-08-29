package com.recordofwork.repository;

import com.recordofwork.entity.LoginHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {
    Page<LoginHistory> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<LoginHistory> findByIsSuccessOrderByCreatedAtDesc(boolean isSuccess, Pageable pageable);
    
    @Query("SELECT COUNT(lh) FROM LoginHistory lh WHERE lh.user.id = :userId AND lh.isSuccess = false AND lh.createdAt >= CURRENT_TIMESTAMP")
    long countRecentFailedLogins(@Param("userId") Long userId);
}
