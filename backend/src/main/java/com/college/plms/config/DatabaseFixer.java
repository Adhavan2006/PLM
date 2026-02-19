package com.college.plms.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseFixer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Fix for "Data truncated" error by ensuring status/stage columns are VARCHAR(50)
            // This handles cases where they might have been created as restricted ENUMs by Hibernate
            jdbcTemplate.execute("ALTER TABLE projects MODIFY COLUMN status VARCHAR(50)");
            jdbcTemplate.execute("ALTER TABLE projects MODIFY COLUMN stage VARCHAR(50)");
            System.out.println("Database schema fixed: status and stage columns updated to VARCHAR(50)");
        } catch (Exception e) {
            // Ignore if table doesn't exist or other minor issues, but log it
            System.out.println("Database fix skipped or failed: " + e.getMessage());
        }
    }
}
