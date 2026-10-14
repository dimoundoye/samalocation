const db = require('../config/db');

// Seules les pages vues envoyées par l'application comptent (les anciennes lignes ont kind = NULL)
const PAGEVIEWS = `kind = 'pageview' AND is_bot = false`;
const PAGEVIEWS_V = `v.kind = 'pageview' AND v.is_bot = false`;

const toInt = (v) => parseInt(v, 10) || 0;

const Analytics = {
    /**
     * Enregistre une page vue ('pageview') ou un signal de présence ('ping', pour « en ligne maintenant »).
     * Aucune adresse IP n'est conservée.
     */
    async recordHit({ kind, path, visitorId, visitorRole, device, browser, os, referrerHost, isBot, userAgent }) {
        await db.query(
            `INSERT INTO site_visits (kind, path, visitor_id, visitor_role, device, browser, os, referrer_host, is_bot, user_agent, method)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'GET')`,
            [kind, path, visitorId, visitorRole, device, browser, os, referrerHost, isBot, isBot ? userAgent : null]
        );
    },

    /**
     * Statistiques de fréquentation sur les 12 derniers mois.
     */
    async getVisitStats() {
        const [online, periods, monthly, daily, topPages, devices, browsers, oses, sources, audience, bots, since] = await Promise.all([
            // En ligne : page vue ou signal de présence dans les 5 dernières minutes
            db.query(`
                SELECT COUNT(DISTINCT visitor_id) AS n FROM site_visits
                WHERE kind IN ('pageview', 'ping') AND is_bot = false AND visitor_id IS NOT NULL
                  AND created_at >= NOW() - INTERVAL '5 minutes'
            `),
            db.query(`
                SELECT
                    COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= date_trunc('day', NOW())) AS today_visitors,
                    COUNT(*)                   FILTER (WHERE created_at >= date_trunc('day', NOW())) AS today_pageviews,
                    COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS d7_visitors,
                    COUNT(*)                   FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS d7_pageviews,
                    COUNT(DISTINCT visitor_id) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS d30_visitors,
                    COUNT(*)                   FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS d30_pageviews,
                    COUNT(DISTINCT visitor_id) AS year_visitors,
                    COUNT(*)                   AS year_pageviews
                FROM site_visits
                WHERE ${PAGEVIEWS} AND created_at >= NOW() - INTERVAL '1 year'
            `),
            // 12 mois glissants, mois sans visite inclus
            db.query(`
                SELECT to_char(m.month, 'YYYY-MM') AS month,
                       COUNT(DISTINCT v.visitor_id) AS visitors,
                       COUNT(v.id) AS pageviews
                FROM generate_series(date_trunc('month', NOW()) - INTERVAL '11 months', date_trunc('month', NOW()), INTERVAL '1 month') AS m(month)
                LEFT JOIN site_visits v
                       ON ${PAGEVIEWS_V}
                      AND v.created_at >= m.month AND v.created_at < m.month + INTERVAL '1 month'
                GROUP BY m.month ORDER BY m.month
            `),
            // 30 derniers jours, jours sans visite inclus
            db.query(`
                SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
                       COUNT(DISTINCT v.visitor_id) AS visitors,
                       COUNT(v.id) AS pageviews
                FROM generate_series(date_trunc('day', NOW()) - INTERVAL '29 days', date_trunc('day', NOW()), INTERVAL '1 day') AS d(day)
                LEFT JOIN site_visits v
                       ON ${PAGEVIEWS_V}
                      AND v.created_at >= d.day AND v.created_at < d.day + INTERVAL '1 day'
                GROUP BY d.day ORDER BY d.day
            `),
            db.query(`
                SELECT path AS label, COUNT(*) AS pageviews, COUNT(DISTINCT visitor_id) AS visitors
                FROM site_visits WHERE ${PAGEVIEWS} AND created_at >= NOW() - INTERVAL '1 year'
                GROUP BY path ORDER BY pageviews DESC LIMIT 10
            `),
            ...['device', 'browser', 'os'].map(col => db.query(`
                SELECT COALESCE(${col}, 'Autre') AS label, COUNT(DISTINCT visitor_id) AS visitors
                FROM site_visits WHERE ${PAGEVIEWS} AND created_at >= NOW() - INTERVAL '1 year'
                GROUP BY 1 ORDER BY visitors DESC LIMIT 8
            `)),
            db.query(`
                SELECT COALESCE(referrer_host, 'Accès direct') AS label, COUNT(DISTINCT visitor_id) AS visitors
                FROM site_visits WHERE ${PAGEVIEWS} AND created_at >= NOW() - INTERVAL '1 year'
                GROUP BY 1 ORDER BY visitors DESC LIMIT 8
            `),
            db.query(`
                SELECT COALESCE(visitor_role, 'visitor') AS label, COUNT(DISTINCT visitor_id) AS visitors
                FROM site_visits WHERE ${PAGEVIEWS} AND created_at >= NOW() - INTERVAL '1 year'
                GROUP BY 1 ORDER BY visitors DESC
            `),
            db.query(`
                SELECT COUNT(*) AS n FROM site_visits
                WHERE kind = 'pageview' AND is_bot = true AND created_at >= NOW() - INTERVAL '1 year'
            `),
            db.query(`SELECT MIN(created_at) AS since FROM site_visits WHERE kind = 'pageview'`)
        ]);

        const p = periods.rows[0];
        const list = (rows) => rows.map(r => ({ label: r.label, visitors: toInt(r.visitors), ...(r.pageviews !== undefined ? { pageviews: toInt(r.pageviews) } : {}) }));

        return {
            online_now: toInt(online.rows[0].n),
            periods: {
                today: { visitors: toInt(p.today_visitors), pageviews: toInt(p.today_pageviews) },
                d7: { visitors: toInt(p.d7_visitors), pageviews: toInt(p.d7_pageviews) },
                d30: { visitors: toInt(p.d30_visitors), pageviews: toInt(p.d30_pageviews) },
                year: { visitors: toInt(p.year_visitors), pageviews: toInt(p.year_pageviews) }
            },
            monthly: monthly.rows.map(r => ({ month: r.month, visitors: toInt(r.visitors), pageviews: toInt(r.pageviews) })),
            daily: daily.rows.map(r => ({ date: r.date, visitors: toInt(r.visitors), pageviews: toInt(r.pageviews) })),
            top_pages: list(topPages.rows),
            devices: list(devices.rows),
            browsers: list(browsers.rows),
            os: list(oses.rows),
            sources: list(sources.rows),
            audience: list(audience.rows),
            bots_filtered: toInt(bots.rows[0].n),
            tracking_since: since.rows[0].since
        };
    }
};

module.exports = Analytics;
