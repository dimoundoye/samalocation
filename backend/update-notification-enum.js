const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('Updating notifications.type enum...');
        await db.query(`
            ALTER TABLE notifications 
            MODIFY COLUMN type ENUM('message', 'system', 'receipt', 'maintenance') NOT NULL
        `);
        console.log('Enum updated successfully.');

        console.log('Verifying column structure...');
        const [rows] = await db.query('DESCRIBE notifications');
        const typeCol = rows.find(r => r.Field === 'type');
        console.log('Current type column:', typeCol.Type);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
