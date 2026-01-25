const express = require('express'); // Heartbeat for reload
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const cron = require('node-cron');
const Message = require('./models/messageModel');
const db = require('./config/db');

const propertiesRoutes = require('./routes/propertyRoutes');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/contactRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Static Files - TOP PRIORITY to avoid security header conflicts
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
}, express.static(path.resolve(process.cwd(), 'uploads')));

// Basic Middleware
app.use(cors());
app.use(express.json());

// Security Middleware - Strict Configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            connectSrc: ["'self'", "https://res.cloudinary.com", "https://samalocation.onrender.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", "https://challenges.cloudflare.com"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: "deny" },
    xContentTypeOptions: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));


// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests'
});
app.use('/api/', limiter);


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
// Test route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/debug-model', (req, res) => {
    const fs = require('fs');
    const modelPath = path.join(__dirname, 'models/receiptModel.js');
    try {
        const content = fs.readFileSync(modelPath, 'utf8');
        res.send(`<pre>${content}</pre>`);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        res.json({ status: 'ok', message: 'Database connected!', solution: rows[0].solution });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Database connection failed', error: error.message });
    }
});

// Use the separate property routes
app.use('/api/properties', propertiesRoutes);

// Error handler MUST be last
app.use(errorHandler);

// Schedule message cleanup every day at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        await Message.deleteOldMessages(5);
    } catch (error) {
        console.error('Error in message cleanup cron job:', error);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
