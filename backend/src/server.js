const express = require('express'); // Heartbeat for reload
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const cron = require('node-cron');
const Message = require('./models/messageModel');
const db = require('./config/db');
const { announceLegalUpdates } = require('./utils/legalAnnouncements');

const paymentRoutes = require('./routes/paymentRoutes');
const propertiesRoutes = require('./routes/propertyRoutes');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminEmailRoutes = require('./routes/adminEmailRoutes');
const contactRoutes = require('./routes/contactRoutes');
const aiRoutes = require('./routes/aiRoutes');
const dossierRoutes = require('./routes/dossierRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const contractRoutes = require('./routes/contractRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const propertyGroupRoutes = require('./routes/propertyGroupRoutes');
const contractTemplateRoutes = require('./routes/contractTemplateRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const pushRoutes = require('./routes/pushRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const errorHandler = require('./middleware/errorHandler');
const securityMiddleware = require('./middleware/security');
const { maintenanceMiddleware } = require('./middleware/maintenanceMiddleware');

// Models for migrations
const Property = require('./models/propertyModel');
const Contract = require('./models/contractModel');
const Receipt = require('./models/receiptModel');
const Owner = require('./models/ownerModel');
const User = require('./models/userModel');
const Subscription = require('./models/subscriptionModel');
const PropertyGroup = require('./models/propertyGroupModel');
const ContractTemplate = require('./models/contractTemplateModel');
const ActivityLog = require('./models/activityLogModel');
const Favorite = require('./models/favoriteModel');
const TeamInvitation = require('./models/teamInvitationModel');
const AIUsage = require('./models/aiUsageModel');
const PushSubscription = require('./models/pushSubscriptionModel');
const Report = require('./models/reportModel');
const migrateEmailLogs = require('./migrations/migrate_email_logs');
const { runMigrations } = require('./utils/migrator');

const app = express();
const server = require('http').createServer(app);
const io = require('./utils/socket').init(server);
const PORT = process.env.PORT || 5000;

// Performance Middleware
app.use(compression());

// Static Files - TOP PRIORITY to avoid security header conflicts
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
}, express.static(path.resolve(process.cwd(), 'uploads')));

// Basic Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow all origins in production for flexibility, or list them explicitly
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-active-context']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
            connectSrc: ["'self'", "https://res.cloudinary.com", "https://nominatim.openstreetmap.org", "wss://samalocation.onrender.com", "ws://localhost:*", "*"],
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
app.set('trust proxy', 1); // Nécessaire pour Render/Heroku pour détecter la bonne IP
const response = require('./utils/response');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3000, // Très large pour le confort des utilisateurs
    validate: false,
    handler: (req, res) => {
        return response.error(res, "Trop de requêtes. Veuillez patienter 15 minutes.", 429);
    }
});

// Limites d'authentification. Au Sénégal, beaucoup d'abonnés mobiles partagent la même IP publique
// (NAT opérateur) : les limites par IP restent larges et ne comptent que les échecs, et des limites
// strictes par compte / adresse e-mail bloquent les attaques ciblées.
const authRateLimit = ({ windowMinutes, max, message, byBodyField, onlyFailures = false }) => rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    validate: false,
    skipSuccessfulRequests: onlyFailures,
    keyGenerator: byBodyField
        ? (req) => `${byBodyField}:${String(req.body?.[byBodyField] || '').trim().toLowerCase() || rateLimit.ipKeyGenerator(req.ip)}`
        : (req) => rateLimit.ipKeyGenerator(req.ip), // IPv6 regroupées par bloc
    handler: (req, res) => response.error(res, message, 429)
});

const tooManyLogins = "Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.";
const loginIpLimiter = authRateLimit({ windowMinutes: 15, max: 30, message: tooManyLogins, onlyFailures: true });
const loginAccountLimiter = authRateLimit({ windowMinutes: 15, max: 10, message: tooManyLogins, byBodyField: 'email', onlyFailures: true });
const signupLimiter = authRateLimit({ windowMinutes: 60, max: 20, message: "Trop d'inscriptions depuis cette connexion. Veuillez réessayer dans une heure." });
// E-mails envoyés à une adresse : empêche d'inonder une boîte mail ou d'abuser de l'envoi
const emailSendIpLimiter = authRateLimit({ windowMinutes: 60, max: 20, message: "Trop de demandes. Veuillez réessayer dans une heure." });
const emailSendTargetLimiter = authRateLimit({ windowMinutes: 60, max: 3, message: "Trop de demandes pour cette adresse. Veuillez réessayer dans une heure.", byBodyField: 'email' });
// Liens reçus par e-mail (jetons) : empêche de les deviner par essais successifs
const tokenLimiter = authRateLimit({ windowMinutes: 15, max: 20, message: "Trop de tentatives. Veuillez réessayer dans 15 minutes.", onlyFailures: true });

app.use('/api/', limiter);
app.use('/api/auth/login', loginIpLimiter, loginAccountLimiter);
app.use('/api/auth/signup', signupLimiter);
app.use(['/api/auth/forgot-password', '/api/auth/resend-verification'], emailSendIpLimiter, emailSendTargetLimiter);
app.use(['/api/auth/reset-password', '/api/auth/verify-email'], tokenLimiter);


// Health check & Keep-alive endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date(), environment: process.env.NODE_ENV });
});

app.get('/api/ping', (req, res) => {
    res.status(200).send('pong');
});

// Routes
app.use('/api/payment', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/emails', adminEmailRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dossier', dossierRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/property-groups', propertyGroupRoutes);
app.use('/api/contract-templates', contractTemplateRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── Keep-alive Cron Job (Every 14 minutes to prevent Supabase pausing) ───────
cron.schedule('*/14 * * * *', async () => {
    try {
        const start = Date.now();
        await db.query('SELECT 1');
        const duration = Date.now() - start;
        console.log(`[Keep-Alive] ✅ DB ping réussi en ${duration}ms — ${new Date().toLocaleTimeString('fr-FR')}`);
    } catch (err) {
        console.error(`[Keep-Alive] ❌ Échec du ping DB: ${err.message}`);
    }
});

// ─── Mesure d'audience : suppression des visites de plus d'un an (chaque jour à 03:00) ───────
// Durée annoncée dans la Politique de confidentialité (frontend/src/pages/Privacy.tsx, section 5.2)
cron.schedule('0 3 * * *', async () => {
    try {
        const result = await db.query("DELETE FROM site_visits WHERE created_at < NOW() - INTERVAL '1 year'");
        console.log(`[Cleanup] ✅ ${result.rowCount} visite(s) de plus d'un an supprimée(s).`);
    } catch (err) {
        console.error(`[Cleanup] ❌ Échec du nettoyage des visites: ${err.message}`);
    }
});

// Error handler MUST be last
app.use(errorHandler);

/**
 * Démarrage : la base est migrée AVANT que le serveur accepte des requêtes.
 * 1. Migrations SQL versionnées (utils/migrator.js) : bloquantes, le serveur ne démarre pas si l'une échoue
 *    (rien n'est modifié en base ; Docker relance le conteneur, l'erreur est dans les journaux).
 * 2. Migrations des modèles (ajouts de colonnes idempotents) : non bloquantes, comme auparavant.
 */
async function prepareDatabase() {
    try {
        await db.query('SELECT 1');
        console.log('  [DB] ✅ Connexion à la base de données établie.\n');
    } catch (err) {
        console.error('  [DB] ❌ Impossible de se connecter à la base de données:', err.message, '\n');
        throw err;
    }

    console.log('  [DB] 🔄 Migrations versionnées...');
    await runMigrations();

    try {
        console.log('  [DB] 🔄 Exécution des migrations...');
        await Property.migrate();
        await Contract.migrate();
        await Receipt.migrate();
        await Owner.migrate();
        await User.migrate();
        await Subscription.migrate();
        await PropertyGroup.migrate();
        await ContractTemplate.migrate();
        await ActivityLog.migrate();
        await Favorite.migrate();
        await TeamInvitation.migrate();
        await AIUsage.migrate();
        await PushSubscription.migrate();
        await Report.migrate();
        await migrateEmailLogs();
        console.log('  [DB] ✅ Migrations terminées.\n');
    } catch (err) {
        console.error('  [DB] ❌ Erreur pendant les migrations des modèles:', err.message, '\n');
    }

    // Pages juridiques modifiées (config/legal.js) : notification aux utilisateurs, non bloquant
    try {
        await announceLegalUpdates();
    } catch (err) {
        console.error('  [LÉGAL] ❌ Annonce de mise à jour des conditions non envoyée:', err.message);
    }
}

prepareDatabase()
    .then(() => {
        server.listen(PORT, () => {
            const env = process.env.NODE_ENV || 'development';
            const dbType = process.env.DB_HOST && process.env.DB_HOST.includes('supabase') ? 'Supabase (PostgreSQL)' : 'Docker Local (PostgreSQL)';
            console.log('\n╔═════════════════════════════════════════════╗');
            console.log(`║       🚀 SamaLocation Backend — DÉMARRÉ     ║`);
            console.log('╠═════════════════════════════════════════════╣');
            console.log(`║  Port        : ${String(PORT).padEnd(29)}║`);
            console.log(`║  Environnement : ${env.padEnd(27)}║`);
            console.log(`║  Base de données : ${dbType.padEnd(25)}║`);
            console.log(`║  Heure       : ${new Date().toLocaleString('fr-FR').padEnd(29)}║`);
            console.log('╚═════════════════════════════════════════════╝\n');
        });
    })
    .catch((err) => {
        console.error('\n  [DÉMARRAGE] ❌ Serveur non démarré :', err.message);
        console.error('  [DÉMARRAGE] La base n\'a pas été modifiée par la migration en échec. Corrigez puis redémarrez.\n');
        process.exit(1);
    });
