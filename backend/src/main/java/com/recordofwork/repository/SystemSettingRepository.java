package com.recordofwork.repository;

import com.recordofwork.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {
    Optional<SystemSetting> findByOrganizationIdAndSettingKey(Long organizationId, String settingKey);
    List<SystemSetting> findByOrganizationId(Long organizationId);
}
