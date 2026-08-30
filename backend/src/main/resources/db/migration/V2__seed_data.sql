-- =============================================================================
-- Record of Work - Seed Data
-- =============================================================================

-- ROLES
INSERT INTO `roles` (`name`, `display_name`, `description`, `is_system_role`) VALUES
('SUPER_ADMIN', 'Super Admin', 'Full system access', 1),
('ADMIN', 'Admin / Owner', 'Business owner with full access', 1),
('SUPERVISOR', 'Supervisor', 'Project supervisor with limited access', 1),
('WORKER', 'Worker', 'Worker with view-only access', 1);

-- PERMISSIONS
INSERT INTO `permissions` (`name`, `display_name`, `module`) VALUES
('WORKER_VIEW', 'View Workers', 'WORKER'),
('WORKER_CREATE', 'Create Workers', 'WORKER'),
('WORKER_UPDATE', 'Update Workers', 'WORKER'),
('WORKER_DELETE', 'Delete Workers', 'WORKER'),
('PROJECT_VIEW', 'View Projects', 'PROJECT'),
('PROJECT_CREATE', 'Create Projects', 'PROJECT'),
('PROJECT_UPDATE', 'Update Projects', 'PROJECT'),
('PROJECT_DELETE', 'Delete Projects', 'PROJECT'),
('ATTENDANCE_VIEW', 'View Attendance', 'ATTENDANCE'),
('ATTENDANCE_MARK', 'Mark Attendance', 'ATTENDANCE'),
('ATTENDANCE_EDIT', 'Edit Attendance', 'ATTENDANCE'),
('WAGE_VIEW', 'View Wages', 'WAGE'),
('WAGE_CALCULATE', 'Calculate Wages', 'WAGE'),
('ADVANCE_VIEW', 'View Advances', 'ADVANCE'),
('ADVANCE_CREATE', 'Create Advances', 'ADVANCE'),
('PAYMENT_VIEW', 'View Payments', 'PAYMENT'),
('PAYMENT_CREATE', 'Create Payments', 'PAYMENT'),
('EXPENSE_VIEW', 'View Expenses', 'EXPENSE'),
('EXPENSE_CREATE', 'Create Expenses', 'EXPENSE'),
('LEDGER_VIEW', 'View Ledger', 'LEDGER'),
('REPORT_VIEW', 'View Reports', 'REPORT'),
('SETTINGS_VIEW', 'View Settings', 'SETTINGS'),
('SETTINGS_UPDATE', 'Update Settings', 'SETTINGS'),
('NOTIFICATION_VIEW', 'View Notifications', 'NOTIFICATION'),
('CLIENT_VIEW', 'View Clients', 'CLIENT'),
('CLIENT_CREATE', 'Create Clients', 'CLIENT'),
('CLIENT_UPDATE', 'Update Clients', 'CLIENT'),
('DAILY_CLOSING_VIEW', 'View Daily Closing', 'DAILY_CLOSING'),
('DAILY_CLOSING_CLOSE', 'Close Day', 'DAILY_CLOSING'),
('SETTLEMENT_VIEW', 'View Settlements', 'SETTLEMENT'),
('SETTLEMENT_APPROVE', 'Approve Settlements', 'SETTLEMENT'),
('ORGANIZATION_VIEW', 'View Organizations', 'ORGANIZATION'),
('ORGANIZATION_MANAGE', 'Manage Organizations', 'ORGANIZATION'),
('USER_VIEW', 'View Users', 'USER'),
('USER_MANAGE', 'Manage Users', 'USER'),
('ROLE_MANAGE', 'Manage Roles', 'ROLE'),
('AUDIT_VIEW', 'View Audit Logs', 'AUDIT'),
('SYSTEM_HEALTH', 'View System Health', 'SYSTEM'),
('DATABASE_BACKUP', 'Backup Database', 'DATABASE');

-- SUPER_ADMIN gets all permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, `id` FROM `permissions`;

-- ADMIN gets most permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, `id` FROM `permissions` WHERE `name` NOT IN ('ORGANIZATION_VIEW', 'ORGANIZATION_MANAGE', 'USER_MANAGE', 'ROLE_MANAGE', 'AUDIT_VIEW', 'SYSTEM_HEALTH', 'DATABASE_BACKUP');

-- SUPERVISOR gets limited permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 3, `id` FROM `permissions` WHERE `name` IN ('WORKER_VIEW', 'PROJECT_VIEW', 'ATTENDANCE_VIEW', 'ATTENDANCE_MARK', 'ADVANCE_VIEW', 'ADVANCE_CREATE', 'EXPENSE_VIEW', 'EXPENSE_CREATE', 'NOTIFICATION_VIEW', 'CLIENT_VIEW');

-- WORKER gets view permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 4, `id` FROM `permissions` WHERE `name` IN ('WORKER_VIEW', 'PROJECT_VIEW', 'ATTENDANCE_VIEW', 'WAGE_VIEW', 'ADVANCE_VIEW', 'PAYMENT_VIEW', 'LEDGER_VIEW', 'NOTIFICATION_VIEW');

-- ORGANIZATIONS
INSERT INTO `organizations` (`name`, `marathi_name`, `contact_person`, `contact_phone`, `address`, `currency`, `timezone`, `is_active`) VALUES
('Record of Work', 'कामचा हिशोब', 'Admin', '9876543210', 'Pune, Maharashtra', 'INR', 'Asia/Kolkata', 1);

-- USERS (password: admin123 BCrypt hashed)
INSERT INTO `users` (`username`, `password`, `first_name`, `last_name`, `email`, `phone`, `organization_id`, `is_active`, `is_deleted`, `must_change_password`, `version`) VALUES
('superadmin', '$2b$10$rn8bGm3Sj8juH0HiG5codOnv8etutFs3tyI31XLhwBxQelP7w96hy', 'Super', 'Admin', 'superadmin@recordofwork.com', '9876543210', 1, 1, 0, 0, 0),
('admin', '$2b$10$rn8bGm3Sj8juH0HiG5codOnv8etutFs3tyI31XLhwBxQelP7w96hy', 'Admin', 'Owner', 'admin@recordofwork.com', '9876543211', 1, 1, 0, 0, 0),
('supervisor1', '$2b$10$rn8bGm3Sj8juH0HiG5codOnv8etutFs3tyI31XLhwBxQelP7w96hy', 'Ramesh', 'Patil', 'supervisor@recordofwork.com', '9876543212', 1, 1, 0, 0, 0),
('worker1', '$2b$10$rn8bGm3Sj8juH0HiG5codOnv8etutFs3tyI31XLhwBxQelP7w96hy', 'Aniket', 'Sharma', 'worker1@recordofwork.com', '9876543213', 1, 1, 0, 0, 0);

-- USER_ROLES
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1), -- superadmin -> SUPER_ADMIN
(2, 2), -- admin -> ADMIN
(3, 3), -- supervisor1 -> SUPERVISOR
(4, 4); -- worker1 -> WORKER

-- CLIENTS
INSERT INTO `clients` (`organization_id`, `name`, `phone`, `address`, `company_name`, `is_active`) VALUES
(1, 'Shubham Patil', '9876543220', 'Pune, Maharashtra', 'Shubham Constructions', 1),
(1, 'Rajesh Kumar', '9876543221', 'Mumbai, Maharashtra', NULL, 1),
(1, 'Priya Enterprises', '9876543222', 'Nashik, Maharashtra', 'Priya Builders', 1);

-- WORKERS
INSERT INTO `workers` (`organization_id`, `name`, `marathi_name`, `phone`, `village`, `work_type`, `skill`, `daily_wage`, `overtime_rate`, `joining_date`, `is_active`) VALUES
(1, 'Aniket', 'अनिकेत', '9876543301', 'Pune', 'Mason', 'Brickwork', 700.00, 100.00, '2024-01-15', 1),
(1, 'Suhas', 'सुहास', '9876543302', 'Pune', 'Carpenter', 'Wood Work', 800.00, 120.00, '2024-01-15', 1),
(1, 'Khandu', 'खंडू', '9876543303', 'Wagholi', 'Labour', 'General', 600.00, 80.00, '2024-02-01', 1),
(1, 'Avadhut', 'अवधूत', '9876543304', 'Hadapsar', 'Mason', 'Plastering', 750.00, 110.00, '2024-02-01', 1),
(1, 'Rahul', 'राहुल', '9876543305', 'Kothrud', 'Electrician', 'Wiring', 900.00, 130.00, '2024-03-01', 1),
(1, 'Suresh', 'सुरेश', '9876543306', 'Baner', 'Plumber', 'Plumbing', 850.00, 125.00, '2024-03-01', 1),
(1, 'Mohan', 'मोहन', '9876543307', 'Sinhagad', 'Labour', 'General', 600.00, 80.00, '2024-04-01', 1),
(1, 'Vikram', 'विक्रम', '9876543308', 'Undri', 'Painting', 'Paint Work', 750.00, 110.00, '2024-04-01', 1);

-- PROJECTS
INSERT INTO `projects` (`organization_id`, `name`, `marathi_name`, `client_id`, `client_phone`, `site_address`, `start_date`, `contract_amount`, `status`) VALUES
(1, 'Shubham Paygav', 'शुभम पायगाव', 1, '9876543220', 'Wagholi, Pune', '2024-08-01', 500000.00, 'ACTIVE'),
(1, 'Rajesh Bungalow', 'राजेश बंगला', 2, '9876543221', 'Kothrud, Pune', '2024-09-01', 300000.00, 'PLANNING'),
(1, 'Priya Office', 'प्रिया कार्यालय', 3, '9876543222', 'Nashik', '2024-07-15', 200000.00, 'COMPLETED');

-- PROJECT_WORKERS
INSERT INTO `project_workers` (`project_id`, `worker_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(2, 1), (2, 3), (2, 6),
(3, 2), (3, 4), (3, 7), (3, 8);

-- ATTENDANCE (Sample for Aug 25-28, 2024)
INSERT INTO `attendance` (`organization_id`, `worker_id`, `project_id`, `attendance_date`, `status`, `entry_source`) VALUES
(1, 1, 1, '2024-08-25', 'PRESENT', 'MANUAL'),
(1, 2, 1, '2024-08-25', 'PRESENT', 'MANUAL'),
(1, 3, 1, '2024-08-25', 'ABSENT', 'MANUAL'),
(1, 4, 1, '2024-08-25', 'HALF_DAY', 'MANUAL'),
(1, 5, 1, '2024-08-25', 'PRESENT', 'MANUAL'),
(1, 1, 1, '2024-08-26', 'PRESENT', 'MANUAL'),
(1, 2, 1, '2024-08-26', 'PRESENT', 'MANUAL'),
(1, 3, 1, '2024-08-26', 'PRESENT', 'MANUAL'),
(1, 4, 1, '2024-08-26', 'PRESENT', 'MANUAL'),
(1, 5, 1, '2024-08-26', 'OVERTIME', 'MANUAL'),
(1, 1, 1, '2024-08-27', 'PRESENT', 'MANUAL'),
(1, 2, 1, '2024-08-27', 'ABSENT', 'MANUAL'),
(1, 3, 1, '2024-08-27', 'PRESENT', 'MANUAL'),
(1, 4, 1, '2024-08-27', 'PRESENT', 'MANUAL'),
(1, 5, 1, '2024-08-27', 'PRESENT', 'MANUAL'),
(1, 1, 1, '2024-08-28', 'PRESENT', 'MANUAL'),
(1, 2, 1, '2024-08-28', 'PRESENT', 'MANUAL'),
(1, 3, 1, '2024-08-28', 'PRESENT', 'MANUAL'),
(1, 4, 1, '2024-08-28', 'PRESENT', 'MANUAL'),
(1, 5, 1, '2024-08-28', 'HALF_DAY', 'MANUAL');

-- ADVANCES
INSERT INTO `advances` (`organization_id`, `worker_id`, `project_id`, `amount`, `advance_date`, `payment_method`, `reason`, `is_settled`) VALUES
(1, 1, 1, 5000.00, '2024-08-25', 'CASH', 'Personal work', 0),
(1, 3, 1, 3000.00, '2024-08-26', 'CASH', 'Medical', 0),
(1, 4, 1, 2000.00, '2024-08-27', 'CASH', 'Festival', 0);

-- PAYMENTS
INSERT INTO `payments` (`organization_id`, `worker_id`, `project_id`, `amount`, `payment_date`, `payment_method`, `payment_type`, `description`, `created_by`) VALUES
(1, 1, 1, 5000.00, '2024-08-28', 'CASH', 'WAGE_PAYMENT', 'Weekly payment', 2),
(1, 2, 1, 4800.00, '2024-08-28', 'CASH', 'WAGE_PAYMENT', 'Weekly payment', 2);

-- CLIENT_PAYMENTS
INSERT INTO `client_payments` (`organization_id`, `client_id`, `project_id`, `amount`, `payment_date`, `payment_method`, `description`, `created_by`) VALUES
(1, 1, 1, 150000.00, '2024-08-15', 'BANK_TRANSFER', 'Advance payment', 2),
(1, 3, 3, 200000.00, '2024-08-20', 'BANK_TRANSFER', 'Final payment', 2);

-- EXPENSES
INSERT INTO `expenses` (`organization_id`, `project_id`, `category`, `amount`, `expense_date`, `description`, `vendor`, `payment_method`, `created_by`) VALUES
(1, 1, 'MATERIAL', 25000.00, '2024-08-20', 'Cement and Sand', 'Buildmart', 'CASH', 2),
(1, 1, 'MATERIAL', 15000.00, '2024-08-22', 'Steel rods', 'Tata Steel', 'BANK_TRANSFER', 2),
(1, 1, 'FUEL', 3000.00, '2024-08-25', 'Diesel for mixer', 'HP Petrol Pump', 'CASH', 2),
(1, 1, 'TRANSPORT', 5000.00, '2024-08-26', 'Material transport', 'ABC Transport', 'CASH', 2),
(1, 1, 'MACHINE', 8000.00, '2024-08-27', 'Machine rental', 'RentAll', 'CASH', 2),
(1, 2, 'MATERIAL', 5000.00, '2024-09-01', 'Initial materials', 'Buildmart', 'CASH', 2),
(1, 1, 'FOOD', 2000.00, '2024-08-28', 'Worker lunch', 'Local Hotel', 'CASH', 2),
(1, 1, 'TOOLS', 3500.00, '2024-08-28', 'New tools', 'Hardware Store', 'CASH', 2);

-- LEDGER_ENTRIES
INSERT INTO `ledger_entries` (`organization_id`, `worker_id`, `project_id`, `entry_type`, `reference_type`, `reference_id`, `amount`, `debit`, `credit`, `balance`, `entry_date`, `description`) VALUES
(1, 1, 1, 'WAGE', 'ATTENDANCE', 1, 700.00, 700.00, 0, 700.00, '2024-08-25', 'Daily wage - Present'),
(1, 1, 1, 'WAGE', 'ATTENDANCE', 6, 700.00, 700.00, 0, 1400.00, '2024-08-26', 'Daily wage - Present'),
(1, 1, 1, 'ADVANCE', 'ADVANCE', 1, 5000.00, 0, 5000.00, -3600.00, '2024-08-25', 'Advance given'),
(1, 1, 1, 'WAGE', 'ATTENDANCE', 11, 700.00, 700.00, 0, -2900.00, '2024-08-27', 'Daily wage - Present'),
(1, 1, 1, 'WAGE', 'ATTENDANCE', 16, 700.00, 700.00, 0, -2200.00, '2024-08-28', 'Daily wage - Present'),
(1, 1, 1, 'PAYMENT', 'PAYMENT', 1, 5000.00, 0, 5000.00, -7200.00, '2024-08-28', 'Weekly payment'),
(1, 2, 1, 'WAGE', 'ATTENDANCE', 2, 800.00, 800.00, 0, 800.00, '2024-08-25', 'Daily wage - Present'),
(1, 2, 1, 'WAGE', 'ATTENDANCE', 7, 800.00, 800.00, 0, 1600.00, '2024-08-26', 'Daily wage - Present'),
(1, 2, 1, 'WAGE', 'ATTENDANCE', 12, 0.00, 0, 0, 1600.00, '2024-08-27', 'Absent'),
(1, 2, 1, 'WAGE', 'ATTENDANCE', 17, 800.00, 800.00, 0, 2400.00, '2024-08-28', 'Daily wage - Present'),
(1, 2, 1, 'PAYMENT', 'PAYMENT', 2, 4800.00, 0, 4800.00, -2400.00, '2024-08-28', 'Weekly payment');

-- DAILY_CLOSINGS
INSERT INTO `daily_closings` (`organization_id`, `closing_date`, `total_workers`, `present_count`, `absent_count`, `half_day_count`, `total_wages`, `total_advances`, `total_payments`, `total_expenses`, `closing_cash`, `is_closed`) VALUES
(1, '2024-08-25', 5, 3, 1, 1, 2800.00, 5000.00, 0, 0, 5000.00, 1),
(1, '2024-08-26', 5, 5, 0, 0, 4100.00, 3000.00, 0, 15000.00, -13900.00, 1),
(1, '2024-08-27', 5, 4, 1, 0, 3400.00, 2000.00, 0, 3000.00, -1600.00, 1),
(1, '2024-08-28', 5, 4, 0, 1, 3700.00, 0, 9800.00, 5500.00, 17000.00, 0);

-- SYSTEM_SETTINGS
INSERT INTO `system_settings` (`organization_id`, `setting_key`, `setting_value`, `description`, `is_system`) VALUES
(1, 'app_name', 'कामचा हिशोब', 'Application name', 1),
(1, 'app_name_en', 'Record of Work', 'Application English name', 1),
(1, 'default_language', 'mr', 'Default language', 1),
(1, 'currency', 'INR', 'Currency', 1),
(1, 'date_format', 'dd-MM-yyyy', 'Date format', 1),
(1, 'timezone', 'Asia/Kolkata', 'Timezone', 1);

-- NOTIFICATIONS
INSERT INTO `notifications` (`organization_id`, `user_id`, `type`, `title`, `message`, `is_read`) VALUES
(1, 2, 'ATTENDANCE', 'Attendance Recorded', 'आजची हजेरी नोंदवली आहे.', 0),
(1, 2, 'PAYMENT', 'Payment Recorded', '₹5,000 पेमेंट नोंदवण्यात आले आहे.', 0),
(1, 4, 'SETTLEMENT', 'Monthly Settlement', 'आपला मासिक हिशोब तयार झाला आहे.', 0),
(1, 3, 'ADVANCE', 'Advance Approved', 'उचल विनंती मंजूर झाली आहे.', 1);

-- AUDIT_LOGS
INSERT INTO `audit_logs` (`organization_id`, `user_id`, `username`, `action`, `entity_type`, `entity_id`, `status`) VALUES
(1, 2, 'admin', 'LOGIN', 'USER', 2, 'SUCCESS'),
(1, 2, 'admin', 'CREATE_WORKER', 'WORKER', 1, 'SUCCESS'),
(1, 2, 'admin', 'CREATE_PROJECT', 'PROJECT', 1, 'SUCCESS'),
(1, 2, 'admin', 'MARK_ATTENDANCE', 'ATTENDANCE', 1, 'SUCCESS'),
(1, 2, 'admin', 'CREATE_PAYMENT', 'PAYMENT', 1, 'SUCCESS'),
(1, 2, 'admin', 'CREATE_ADVANCE', 'ADVANCE', 1, 'SUCCESS'),
(1, 2, 'admin', 'CREATE_EXPENSE', 'EXPENSE', 1, 'SUCCESS');
