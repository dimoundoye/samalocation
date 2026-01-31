const pool = require('./src/config/db');

async function setup() {
    try {
        console.log('Starting maintenance table setup...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS maintenance_requests (
                id VARCHAR(36) PRIMARY KEY,
                tenant_id VARCHAR(36) NOT NULL,
                property_id VARCHAR(36) NOT NULL,
                unit_id VARCHAR(36) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
                status ENUM('pending', 'in_progress', 'resolved', 'cancelled') DEFAULT 'pending',
                photos LONGTEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
                FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                FOREIGN KEY (unit_id) REFERENCES property_units(id) ON DELETE CASCADE
            )
        `);

        console.log('Maintenance table created or already exists.');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up maintenance table:', error);
        process.exit(1);
    }
}

setup();
