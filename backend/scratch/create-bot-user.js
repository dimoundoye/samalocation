const User = require('../src/models/userModel');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createBot() {
    try {
        const email = 'import@samalocation.com';
        const existing = await User.findByEmail(email);
        if (existing) {
            console.log('Bot user import@samalocation.com already exists!');
            process.exit(0);
        }

        const id = uuidv4();
        const customId = 'SB00001';
        const passwordHash = await bcrypt.hash('ChangerCeMotDePasse123!', 10);

        await User.create({
            id,
            customId,
            email,
            passwordHash,
            name: 'SamaBot',
            phone: '+221770000000',
            role: 'owner',
            companyName: 'Importateur Automatique',
            emailVerified: true,
            isSetupComplete: true
        });

        console.log('✅ Bot user import@samalocation.com created successfully with role: owner');
        process.exit(0);
    } catch (error) {
        console.error('Error creating bot user:', error);
        process.exit(1);
    }
}

createBot();
