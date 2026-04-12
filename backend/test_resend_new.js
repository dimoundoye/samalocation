const { Resend } = require('resend');
const path = require('path');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
    try {
        console.log('Testing Resend API Key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
        if (!process.env.RESEND_API_KEY) {
            console.log('API Key Value is missing in process.env');
            return;
        }
        console.log('API Key starts with:', process.env.RESEND_API_KEY.substring(0, 5));
        
        const domains = await resend.domains.list();
        console.log('Domains Result:', JSON.stringify(domains, null, 2));
    } catch (error) {
        console.error('Test Error:', error);
        if (error.response) {
            console.error('Error Response Data:', error.response.data);
            console.error('Error Response Status:', error.response.status);
        }
    }
}

testResend();
