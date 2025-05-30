-- Simple seed for test users
-- Password hash is for 'password123'
INSERT IGNORE INTO User (
        id,
        email,
        name,
        password,
        role,
        createdAt,
        updatedAt
    )
VALUES (
        'cuid-admin-001',
        'admin@jobflow.local',
        'Admin User',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'ADMIN',
        NOW(),
        NOW()
    ),
    (
        'cuid-emp-001',
        'employee@jobflow.local',
        'Employee User',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'EMPLOYEE',
        NOW(),
        NOW()
    ),
    (
        'cuid-free-001',
        'freelancer1@jobflow.local',
        'Freelancer One',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'FREELANCER',
        NOW(),
        NOW()
    );