const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function seedData() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: 'Passer@2026#',
        database: 'samalocation'
    });

    try {
        console.log('Inserting sample user...');
        const [userResult] = await connection.query(`
      INSERT INTO users (id, email, password_hash, email_verified) 
      VALUES (UUID(), 'owner@example.com', 'hashed_pwd', true)
      ON DUPLICATE KEY UPDATE id=id;
    `);

        // Get the user ID (since it's a UUID, we should probably fetch it or use a fixed one for testing)
        const [users] = await connection.query('SELECT id FROM users LIMIT 1');
        const userId = users[0].id;

        console.log('Inserting sample properties...');
        await connection.query(`
      INSERT INTO properties (id, owner_id, property_type, name, address, description, is_published, published_at)
      VALUES 
        (UUID(), ?, 'appartement', 'Appartement Moderne Almadies', 'Almadies, Dakar', 'Magnifique appartement avec vue sur mer', true, NOW()),
        (UUID(), ?, 'villa', 'Villa de Luxe Fann', 'Fann Residence, Dakar', 'Grande villa avec piscine', true, NOW()),
        (UUID(), ?, 'studio', 'Studio Meublé Mermoz', 'Mermoz, Dakar', 'Studio tout équipé proche université', true, NOW())
    `, [userId, userId, userId]);

        console.log('Sample data inserted successfully!');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await connection.end();
    }
}

seedData();
