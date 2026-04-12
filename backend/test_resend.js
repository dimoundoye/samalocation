const { Resend } = require('resend');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
    try {
        console.log('Testing Resend API Key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
        const domains = await resend.domains.list();
        console.log('Domains:', JSON.stringify(domains, null, 2));
    } catch (error) {
        console.error('Test Error:', error);
    }
}

testResend();
