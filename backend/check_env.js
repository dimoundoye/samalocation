const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, 'src/utils/../../.env');
console.log('Searching for .env at:', envPath);
console.log('File exists?', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('Found .env. Number of lines:', content.split('\n').length);
    console.log('Contains RESEND_API_KEY?', content.includes('RESEND_API_KEY'));
    console.log('Contains SMTP_FROM?', content.includes('SMTP_FROM'));
}

const envPath2 = path.join(__dirname, '.env');
console.log('Searching for .env at (relative to backend root):', envPath2);
console.log('File exists?', fs.existsSync(envPath2));
