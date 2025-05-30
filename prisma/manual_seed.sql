-- Insert test users directly into the database
INSERT INTO User (
        id,
        email,
        name,
        password,
        role,
        createdAt,
        updatedAt
    )
VALUES (
        'admin-user-id',
        'admin@jobflow.local',
        'Admin User',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'ADMIN',
        NOW(),
        NOW()
    ),
    (
        'employee-user-id',
        'employee@jobflow.local',
        'Employee User',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'EMPLOYEE',
        NOW(),
        NOW()
    ),
    (
        'freelancer1-user-id',
        'freelancer1@jobflow.local',
        'Freelancer One',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'FREELANCER',
        NOW(),
        NOW()
    ),
    (
        'freelancer2-user-id',
        'freelancer2@jobflow.local',
        'Freelancer Two',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'FREELANCER',
        NOW(),
        NOW()
    ) ON DUPLICATE KEY
UPDATE name =
VALUES(name);