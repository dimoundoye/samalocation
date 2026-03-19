const db = require('./src/config/db');

async function check() {
    try {
        const { rows } = await db.query('SELECT id, email, parent_id, permissions FROM users');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
