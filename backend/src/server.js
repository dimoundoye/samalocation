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
const aiRoutes = require('./routes/aiRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const contractRoutes = require('./routes/contractRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const errorHandler = require('./middleware/errorHandler');
const securityMiddleware = require('./middleware/security');
const { trackVisit } = require('./middleware/analyticsMiddleware');
const { maintenanceMiddleware } = require('./middleware/maintenanceMiddleware');

const app = express();
const server = require('http').createServer(app);
const io = require('./utils/socket').init(server);
const PORT = process.env.PORT || 5000;

// Static Files - TOP PRIORITY to avoid security header conflicts
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
}, express.static(path.resolve(process.cwd(), 'uploads')));

// Basic Middleware
app.use(cors({
    origin: true, // Dynamically allow the origin that made the request
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-active-context']
}));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});
app.use(trackVisit);
app.use(maintenanceMiddleware);

// Security - Custom middleware
app.use(securityMiddleware.preventHPP);
app.use(securityMiddleware.sanitizeInput);

// Force HTTPS in production
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(`https://${req.get('host')}${req.url}`);
    }
    next();
});

// Security Middleware - Strict Configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://unpkg.com", "https://*.tile.openstreetmap.org"],
            imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://*.tile.openstreetmap.org", "https://unpkg.com", "*"],
            connectSrc: ["'self'", "https://res.cloudinary.com", "https://nominatim.openstreetmap.org", "*"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", "https://challenges.cloudflare.com"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: "deny" },
    xContentTypeOptions: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));


// Rate Limiting
const response = require('./utils/response');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Augmenté pour éviter les blocages lors des rafraîchissements/polling
    handler: (req, res) => {
        return response.error(res, "Trop de requêtes. Veuillez patienter 15 minutes.", 429);
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    handler: (req, res) => {
        return response.error(res, "Trop de tentatives. Veuillez réessayer dans 15 minutes.", 429);
    }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);


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
app.use('/api/ai', aiRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/properties', propertiesRoutes);

// Error handler MUST be last
app.use(errorHandler);
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
