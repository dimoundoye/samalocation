const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
    try {
        const email = 'admin@samalocation.com';
        const newPassword = 'admin_password_123';
        const hash = await bcrypt.hash(newPassword, 10);

        await db.query("UPDATE users SET password_hash = $1 WHERE email = $2", [hash, email]);
        console.log(`✅ Password for ${email} reset to: ${newPassword}`);
    } catch (e) { console.error(e); }
    finally { process.exit(); }
}

resetAdmin();
