const db = require('../src/config/db');

async function inspect() {
    try {
        const { rows: tables } = await db.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('users', 'properties')
        `);
        console.log('Tables found:', tables);
        
        for (const table of tables) {
            const { rows: columns } = await db.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = $2
            `, [table.table_name, table.table_schema]);
            console.log(`Columns for ${table.table_schema}.${table.table_name}:`, columns.map(c => `${c.column_name} (${c.data_type})`));
        }
    } catch (error) {
        console.error('Inspection error:', error);
    } finally {
        process.exit();
    }
}

inspect();
