const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('Starting migration: Creating maintenance_requests table...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS maintenance_requests (
                id VARCHAR(36) PRIMARY KEY,
                tenant_id VARCHAR(36) NOT NULL,
                property_id VARCHAR(36) NOT NULL,
                unit_id VARCHAR(36) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
                status ENUM('pending', 'in_progress', 'resolved', 'cancelled') DEFAULT 'pending',
                photos JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                FOREIGN KEY (unit_id) REFERENCES property_units(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('Migration successful: maintenance_requests table created.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
