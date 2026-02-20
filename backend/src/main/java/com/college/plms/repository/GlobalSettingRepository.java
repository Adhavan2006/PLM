package com.college.plms.repository;

import com.college.plms.model.GlobalSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GlobalSettingRepository extends JpaRepository<GlobalSetting, Long> {
    Optional<GlobalSetting> findBySettingKey(String settingKey);
}
