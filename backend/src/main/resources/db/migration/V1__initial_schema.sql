-- =============================================================================
-- Record of Work Application - Database Schema
-- Matches Java Entity definitions exactly
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- ORGANIZATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `organizations` (
    `id`              BIGINT          NOT NULL AUTO_INCREMENT,
    `name`            VARCHAR(255)    NOT NULL,
    `marathi_name`    VARCHAR(255)    NULL DEFAULT NULL,
    `contact_person`  VARCHAR(255)    NULL DEFAULT NULL,
    `contact_email`   VARCHAR(255)    NULL DEFAULT NULL,
    `contact_phone`   VARCHAR(20)     NULL DEFAULT NULL,
    `address`         TEXT            NULL DEFAULT NULL,
    `logo_url`        VARCHAR(500)    NULL DEFAULT NULL,
    `currency`        VARCHAR(3)      NULL DEFAULT 'INR',
    `timezone`        VARCHAR(50)     NULL DEFAULT 'Asia/Kolkata',
    `is_active`       TINYINT(1)      NOT NULL DEFAULT 1,
    `is_suspended`    TINYINT(1)      NOT NULL DEFAULT 0,
    `is_deleted`      TINYINT(1)      NOT NULL DEFAULT 0,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `version`         BIGINT          NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_org_name` (`name`),
    INDEX `idx_org_active` (`is_active`, `is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- ROLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
    `id`              BIGINT          NOT NULL AUTO_INCREMENT,
    `name`            VARCHAR(50)     NOT NULL,
    `display_name`    VARCHAR(100)    NULL DEFAULT NULL,
    `description`     VARCHAR(500)    NULL DEFAULT NULL,
    `is_system_role`  TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- PERMISSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `permissions` (
    `id`            BIGINT          NOT NULL AUTO_INCREMENT,
    `name`          VARCHAR(100)    NOT NULL,
    `display_name`  VARCHAR(200)    NULL DEFAULT NULL,
    `module`        VARCHAR(50)     NULL DEFAULT NULL,
    `description`   VARCHAR(500)    NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_permissions_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- ROLE_PERMISSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role_permissions` (
    `role_id`       BIGINT NOT NULL,
    `permission_id` BIGINT NOT NULL,
    PRIMARY KEY (`role_id`, `permission_id`),
    KEY `fk_rp_permission` (`permission_id`),
    CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
    CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id`                      BIGINT          NOT NULL AUTO_INCREMENT,
    `username`                VARCHAR(50)     NOT NULL,
    `password`                VARCHAR(255)    NOT NULL,
    `first_name`              VARCHAR(100)    NULL DEFAULT NULL,
    `last_name`               VARCHAR(100)    NULL DEFAULT NULL,
    `email`                   VARCHAR(255)    NOT NULL,
    `phone`                   VARCHAR(20)     NULL DEFAULT NULL,
    `organization_id`         BIGINT          NULL DEFAULT NULL,
    `is_active`               TINYINT(1)      NOT NULL DEFAULT 1,
    `is_deleted`              TINYINT(1)      NOT NULL DEFAULT 0,
    `last_login`              DATETIME        NULL DEFAULT NULL,
    `password_changed_at`     DATETIME        NULL DEFAULT NULL,
    `must_change_password`    TINYINT(1)      NOT NULL DEFAULT 0,
    `created_at`              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `version`                 BIGINT          NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_username` (`username`),
    UNIQUE KEY `uk_users_email` (`email`),
    KEY `fk_users_org` (`organization_id`),
    CONSTRAINT `fk_users_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- USER_ROLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_roles` (
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,
    PRIMARY KEY (`user_id`, `role_id`),
    KEY `fk_ur_role` (`role_id`),
    CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- WORKERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `workers` (
    `id`                        BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id`           BIGINT          NOT NULL,
    `user_id`                   BIGINT          NULL DEFAULT NULL,
    `name`                      VARCHAR(255)    NOT NULL,
    `marathi_name`              VARCHAR(255)    NULL DEFAULT NULL,
    `phone`                     VARCHAR(20)     NULL DEFAULT NULL,
    `address`                   TEXT            NULL DEFAULT NULL,
    `village`                   VARCHAR(255)    NULL DEFAULT NULL,
    `work_type`                 VARCHAR(100)    NULL DEFAULT NULL,
    `skill`                     VARCHAR(100)    NULL DEFAULT NULL,
    `daily_wage`                DECIMAL(12,2)   NULL DEFAULT 0,
    `overtime_rate`             DECIMAL(12,2)   NULL DEFAULT 0,
    `joining_date`              DATE            NULL DEFAULT NULL,
    `photo_url`                 VARCHAR(500)    NULL DEFAULT NULL,
    `emergency_contact_name`    VARCHAR(255)    NULL DEFAULT NULL,
    `emergency_contact_phone`   VARCHAR(20)     NULL DEFAULT NULL,
    `notes`                     TEXT            NULL DEFAULT NULL,
    `is_active`                 TINYINT(1)      NOT NULL DEFAULT 1,
    `is_deleted`                TINYINT(1)      NOT NULL DEFAULT 0,
    `created_at`                DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`                DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `version`                   BIGINT          NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_workers_org` (`organization_id`),
    KEY `fk_workers_user` (`user_id`),
    KEY `idx_workers_name` (`name`),
    KEY `idx_workers_active` (`is_active`, `is_deleted`),
    CONSTRAINT `fk_workers_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
    CONSTRAINT `fk_workers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- CLIENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clients` (
    `id`              BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT          NOT NULL,
    `name`            VARCHAR(255)    NOT NULL,
    `phone`           VARCHAR(20)     NULL DEFAULT NULL,
    `email`           VARCHAR(255)    NULL DEFAULT NULL,
    `address`         TEXT            NULL DEFAULT NULL,
    `company_name`    VARCHAR(255)    NULL DEFAULT NULL,
    `notes`           TEXT            NULL DEFAULT NULL,
    `is_active`       TINYINT(1)      NOT NULL DEFAULT 1,
    `is_deleted`      TINYINT(1)      NOT NULL DEFAULT 0,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `version`         BIGINT          NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_clients_org` (`organization_id`),
    CONSTRAINT `fk_clients_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- PROJECTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `projects` (
    `id`              BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT          NOT NULL,
    `name`            VARCHAR(255)    NOT NULL,
    `marathi_name`    VARCHAR(255)    NULL DEFAULT NULL,
    `client_id`       BIGINT          NULL DEFAULT NULL,
    `client_phone`    VARCHAR(20)     NULL DEFAULT NULL,
    `site_address`    TEXT            NULL DEFAULT NULL,
    `start_date`      DATE            NULL DEFAULT NULL,
    `end_date`        DATE            NULL DEFAULT NULL,
    `contract_amount` DECIMAL(14,2)   NULL DEFAULT 0,
    `description`     TEXT            NULL DEFAULT NULL,
    `status`          VARCHAR(30)     NOT NULL DEFAULT 'PLANNING',
    `notes`           TEXT            NULL DEFAULT NULL,
    `is_deleted`      TINYINT(1)      NOT NULL DEFAULT 0,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `version`         BIGINT          NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_projects_org` (`organization_id`),
    KEY `fk_projects_client` (`client_id`),
    KEY `idx_projects_status` (`status`),
    CONSTRAINT `fk_projects_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
    CONSTRAINT `fk_projects_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- PROJECT_WORKERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `project_workers` (
    `project_id` BIGINT NOT NULL,
    `worker_id`  BIGINT NOT NULL,
    PRIMARY KEY (`project_id`, `worker_id`),
    KEY `fk_pw_worker` (`worker_id`),
    CONSTRAINT `fk_pw_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
    CONSTRAINT `fk_pw_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- ATTENDANCE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance` (
    `id`                  BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id`     BIGINT          NOT NULL,
    `worker_id`           BIGINT          NOT NULL,
    `project_id`          BIGINT          NOT NULL,
    `attendance_date`     DATE            NOT NULL,
    `status`              VARCHAR(20)     NOT NULL,
    `overtime_hours`      DECIMAL(4,1)    NULL DEFAULT 0,
    `notes`               VARCHAR(500)    NULL DEFAULT NULL,
    `marked_by`           BIGINT          NULL DEFAULT NULL,
    `entry_source`        VARCHAR(20)     NULL DEFAULT 'MANUAL',
    `is_corrected`        TINYINT(1)      NOT NULL DEFAULT 0,
    `corrected_by`        BIGINT          NULL DEFAULT NULL,
    `correction_reason`   VARCHAR(500)    NULL DEFAULT NULL,
    `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_attendance_worker_project_date` (`worker_id`, `project_id`, `attendance_date`),
    KEY `fk_attendance_org` (`organization_id`),
    KEY `fk_attendance_project` (`project_id`),
    KEY `idx_attendance_date` (`attendance_date`),
    CONSTRAINT `fk_attendance_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
    CONSTRAINT `fk_attendance_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`),
    CONSTRAINT `fk_attendance_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- ADVANCES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `advances` (
    `id`                  BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id`     BIGINT          NOT NULL,
    `worker_id`           BIGINT          NOT NULL,
    `project_id`          BIGINT          NULL DEFAULT NULL,
    `amount`              DECIMAL(12,2)   NOT NULL,
    `advance_date`        DATE            NOT NULL,
    `payment_method`      VARCHAR(20)     NULL DEFAULT 'CASH',
    `reason`              VARCHAR(500)    NULL DEFAULT NULL,
    `notes`               TEXT            NULL DEFAULT NULL,
    `is_settled`          TINYINT(1)      NOT NULL DEFAULT 0,
    `settled_amount`      DECIMAL(12,2)   NULL DEFAULT 0,
    `is_voided`           TINYINT(1)      NOT NULL DEFAULT 0,
    `voided_by`           BIGINT          NULL DEFAULT NULL,
    `voided_at`           DATETIME        NULL DEFAULT NULL,
    `void_reason`         VARCHAR(500)    NULL DEFAULT NULL,
    `created_by`          BIGINT          NULL DEFAULT NULL,
    `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_advances_org` (`organization_id`),
    KEY `fk_advances_worker` (`worker_id`),
    KEY `fk_advances_project` (`project_id`),
    KEY `idx_advances_date` (`advance_date`),
    CONSTRAINT `fk_advances_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
    CONSTRAINT `fk_advances_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`),
    CONSTRAINT `fk_advances_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- PAYMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
    `id`                  BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id`     BIGINT          NOT NULL,
    `worker_id`           BIGINT          NOT NULL,
    `project_id`          BIGINT          NULL DEFAULT NULL,
    `amount`              DECIMAL(12,2)   NOT NULL,
    `payment_date`        DATE            NOT NULL,
    `payment_method`      VARCHAR(20)     NULL DEFAULT 'CASH',
    `payment_type`        VARCHAR(30)     NOT NULL,
    `description`         VARCHAR(500)    NULL DEFAULT NULL,
    `notes`               TEXT            NULL DEFAULT NULL,
    `reference_number`    VARCHAR(100)    NULL DEFAULT NULL,
    `is_voided`           TINYINT(1)      NOT NULL DEFAULT 0,
    `voided_by`           BIGINT          NULL DEFAULT NULL,
    `voided_at`           DATETIME        NULL DEFAULT NULL,
    `void_reason`         VARCHAR(500)    NULL DEFAULT NULL,
    `created_by`          BIGINT          NULL DEFAULT NULL,
    `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_payments_org` (`organization_id`),
    KEY `fk_payments_worker` (`worker_id`),
    KEY `fk_payments_project` (`project_id`),
    KEY `idx_payments_date` (`payment_date`),
    CONSTRAINT `fk_payments_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
    CONSTRAINT `fk_payments_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`),
    CONSTRAINT `fk_payments_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- CLIENT_PAYMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `client_payments` (
    `id`                  BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id`     BIGINT          NOT NULL,
    `client_id`           BIGINT          NOT NULL,
    `project_id`          BIGINT          NOT NULL,
    `amount`              DECIMAL(14,2)   NOT NULL,
    `payment_date`        DATE            NOT NULL,
    `payment_method`      VARCHAR(20)     NULL DEFAULT 'CASH',
    `reference_number`    VARCHAR(100)    NULL DEFAULT NULL,
    `description`         VARCHAR(500)    NULL DEFAULT NULL,
    `notes`               TEXT            NULL DEFAULT NULL,
    `is_voided`           TINYINT(1)      NOT NULL DEFAULT 0,
    `created_by`          BIGINT          NULL DEFAULT NULL,
    `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_cp_org` (`organization_id`),
    KEY `fk_cp_client` (`client_id`),
    KEY `fk_cp_project` (`project_id`),
    CONSTRAINT `fk_cp_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
    CONSTRAINT `fk_cp_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
    CONSTRAINT `fk_cp_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- EXPENSES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
    `id`                  BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id`     BIGINT          NOT NULL,
    `project_id`          BIGINT          NULL DEFAULT NULL,
    `category`            VARCHAR(30)     NOT NULL,
    `amount`              DECIMAL(12,2)   NOT NULL,
    `expense_date`        DATE            NOT NULL,
    `description`         VARCHAR(500)    NOT NULL,
    `vendor`              VARCHAR(255)    NULL DEFAULT NULL,
    `vendor_phone`        VARCHAR(20)     NULL DEFAULT NULL,
    `payment_method`      VARCHAR(20)     NULL DEFAULT 'CASH',
    `receipt_url`         VARCHAR(500)    NULL DEFAULT NULL,
    `notes`               TEXT            NULL DEFAULT NULL,
    `is_voided`           TINYINT(1)      NOT NULL DEFAULT 0,
    `voided_by`           BIGINT          NULL DEFAULT NULL,
    `voided_at`           DATETIME        NULL DEFAULT NULL,
    `void_reason`         VARCHAR(500)    NULL DEFAULT NULL,
    `created_by`          BIGINT          NULL DEFAULT NULL,
    `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_expenses_org` (`organization_id`),
    KEY `fk_expenses_project` (`project_id`),
    KEY `idx_expenses_date` (`expense_date`),
    KEY `idx_expenses_category` (`category`),
    CONSTRAINT `fk_expenses_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
    CONSTRAINT `fk_expenses_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- LEDGER_ENTRIES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ledger_entries` (
    `id`                  BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id`     BIGINT          NOT NULL,
    `worker_id`           BIGINT          NULL DEFAULT NULL,
    `project_id`          BIGINT          NULL DEFAULT NULL,
    `entry_type`          VARCHAR(30)     NOT NULL,
    `reference_type`      VARCHAR(30)     NULL DEFAULT NULL,
    `reference_id`        BIGINT          NULL DEFAULT NULL,
    `amount`              DECIMAL(12,2)   NOT NULL,
    `debit`               DECIMAL(12,2)   NULL DEFAULT 0,
    `credit`              DECIMAL(12,2)   NULL DEFAULT 0,
    `balance`             DECIMAL(12,2)   NULL DEFAULT 0,
    `entry_date`          DATE            NOT NULL,
    `description`         VARCHAR(500)    NOT NULL,
    `notes`               TEXT            NULL DEFAULT NULL,
    `is_voided`           TINYINT(1)      NOT NULL DEFAULT 0,
    `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_ledger_org` (`organization_id`),
    KEY `fk_ledger_worker` (`worker_id`),
    KEY `fk_ledger_project` (`project_id`),
    KEY `idx_ledger_date` (`entry_date`),
    CONSTRAINT `fk_ledger_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
    CONSTRAINT `fk_ledger_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`),
    CONSTRAINT `fk_ledger_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- DAILY_CLOSINGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `daily_closings` (
    `id`                  BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id`     BIGINT          NOT NULL,
    `closing_date`        DATE            NOT NULL,
    `total_workers`       INT             NULL DEFAULT 0,
    `present_count`       INT             NULL DEFAULT 0,
    `absent_count`        INT             NULL DEFAULT 0,
    `half_day_count`      INT             NULL DEFAULT 0,
    `overtime_count`      INT             NULL DEFAULT 0,
    `total_wages`         DECIMAL(14,2)   NULL DEFAULT 0,
    `total_advances`      DECIMAL(14,2)   NULL DEFAULT 0,
    `total_payments`      DECIMAL(14,2)   NULL DEFAULT 0,
    `total_expenses`      DECIMAL(14,2)   NULL DEFAULT 0,
    `total_income`        DECIMAL(14,2)   NULL DEFAULT 0,
    `opening_cash`        DECIMAL(14,2)   NULL DEFAULT 0,
    `closing_cash`        DECIMAL(14,2)   NULL DEFAULT 0,
    `notes`               TEXT            NULL DEFAULT NULL,
    `is_closed`           TINYINT(1)      NOT NULL DEFAULT 0,
    `closed_by`           BIGINT          NULL DEFAULT NULL,
    `closed_at`           DATETIME        NULL DEFAULT NULL,
    `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_daily_closing_date` (`organization_id`, `closing_date`),
    CONSTRAINT `fk_dc_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MONTHLY_SETTLEMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `monthly_settlements` (
    `id`                  BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id`     BIGINT          NOT NULL,
    `worker_id`           BIGINT          NOT NULL,
    `settlement_month`    INT             NOT NULL,
    `settlement_year`     INT             NOT NULL,
    `present_days`        INT             NULL DEFAULT 0,
    `half_days`           INT             NULL DEFAULT 0,
    `absent_days`         INT             NULL DEFAULT 0,
    `overtime_hours`      DECIMAL(6,1)    NULL DEFAULT 0,
    `gross_wage`          DECIMAL(14,2)   NULL DEFAULT 0,
    `total_advance`       DECIMAL(14,2)   NULL DEFAULT 0,
    `total_payment`       DECIMAL(14,2)   NULL DEFAULT 0,
    `remaining_balance`   DECIMAL(14,2)   NULL DEFAULT 0,
    `bonus`               DECIMAL(12,2)   NULL DEFAULT 0,
    `deduction`           DECIMAL(12,2)   NULL DEFAULT 0,
    `status`              VARCHAR(20)     NULL DEFAULT 'DRAFT',
    `notes`               TEXT            NULL DEFAULT NULL,
    `approved_by`         BIGINT          NULL DEFAULT NULL,
    `approved_at`         DATETIME        NULL DEFAULT NULL,
    `is_deleted`          TINYINT(1)      NOT NULL DEFAULT 0,
    `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_ms_org` (`organization_id`),
    KEY `fk_ms_worker` (`worker_id`),
    KEY `idx_ms_month` (`settlement_year`, `settlement_month`),
    CONSTRAINT `fk_ms_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
    CONSTRAINT `fk_ms_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
    `id`              BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT          NULL DEFAULT NULL,
    `user_id`         BIGINT          NOT NULL,
    `type`            VARCHAR(30)     NOT NULL,
    `title`           VARCHAR(255)    NOT NULL,
    `message`         TEXT            NOT NULL,
    `reference_type`  VARCHAR(50)     NULL DEFAULT NULL,
    `reference_id`    BIGINT          NULL DEFAULT NULL,
    `is_read`         TINYINT(1)      NOT NULL DEFAULT 0,
    `read_at`         DATETIME        NULL DEFAULT NULL,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_notif_user` (`user_id`),
    KEY `fk_notif_org` (`organization_id`),
    KEY `idx_notif_read` (`is_read`),
    CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `fk_notif_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- AUDIT_LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id`              BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT          NULL DEFAULT NULL,
    `user_id`         BIGINT          NULL DEFAULT NULL,
    `username`        VARCHAR(50)     NULL DEFAULT NULL,
    `action`          VARCHAR(100)    NOT NULL,
    `entity_type`     VARCHAR(50)     NULL DEFAULT NULL,
    `entity_id`       BIGINT          NULL DEFAULT NULL,
    `old_value`       TEXT            NULL DEFAULT NULL,
    `new_value`       TEXT            NULL DEFAULT NULL,
    `ip_address`      VARCHAR(50)     NULL DEFAULT NULL,
    `user_agent`      VARCHAR(500)    NULL DEFAULT NULL,
    `session_id`      VARCHAR(100)    NULL DEFAULT NULL,
    `status`          VARCHAR(20)     NULL DEFAULT NULL,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_audit_org` (`organization_id`),
    KEY `fk_audit_user` (`user_id`),
    KEY `idx_audit_action` (`action`),
    KEY `idx_audit_entity` (`entity_type`, `entity_id`),
    CONSTRAINT `fk_audit_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- SYSTEM_SETTINGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
    `id`              BIGINT          NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT          NULL DEFAULT NULL,
    `setting_key`     VARCHAR(100)    NOT NULL,
    `setting_value`   TEXT            NULL DEFAULT NULL,
    `description`     VARCHAR(500)    NULL DEFAULT NULL,
    `setting_type`    VARCHAR(20)     NULL DEFAULT 'STRING',
    `is_system`       TINYINT(1)      NOT NULL DEFAULT 0,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_ss_org` (`organization_id`),
    CONSTRAINT `fk_ss_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- LOGIN_HISTORY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `login_history` (
    `id`              BIGINT          NOT NULL AUTO_INCREMENT,
    `user_id`         BIGINT          NOT NULL,
    `ip_address`      VARCHAR(50)     NULL DEFAULT NULL,
    `user_agent`      VARCHAR(500)    NULL DEFAULT NULL,
    `is_success`      TINYINT(1)      NOT NULL DEFAULT 0,
    `failure_reason`  VARCHAR(500)    NULL DEFAULT NULL,
    `session_id`      VARCHAR(100)    NULL DEFAULT NULL,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_lh_user` (`user_id`),
    CONSTRAINT `fk_lh_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
