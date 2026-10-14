/**
 * Lecture simple du User-Agent pour la mesure d'audience : type d'appareil, navigateur, système, robot.
 */
const BOT_PATTERN = /bot|spider|crawl|slurp|facebookexternalhit|headless|lighthouse|python|curl|wget|axios|node-fetch|go-http|java\/|preview/i;

function parseUserAgent(ua = '') {
    const s = String(ua);

    const device = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(s) ? 'tablet'
        : /Mobi|iPhone|iPod|Android|Windows Phone/i.test(s) ? 'mobile'
        : 'desktop';

    const browser = /Edg\//.test(s) ? 'Edge'
        : /OPR\/|Opera/.test(s) ? 'Opera'
        : /SamsungBrowser/.test(s) ? 'Samsung Internet'
        : /Firefox|FxiOS/.test(s) ? 'Firefox'
        : /Chrome|CriOS/.test(s) ? 'Chrome'
        : /Safari/.test(s) ? 'Safari'
        : 'Autre';

    const os = /Android/.test(s) ? 'Android'
        : /iPhone|iPad|iPod/.test(s) ? 'iOS'
        : /Windows/.test(s) ? 'Windows'
        : /Mac OS X|Macintosh/.test(s) ? 'macOS'
        : /CrOS/.test(s) ? 'ChromeOS'
        : /Linux/.test(s) ? 'Linux'
        : 'Autre';

    return { device, browser, os, isBot: !s || BOT_PATTERN.test(s) };
}

module.exports = { parseUserAgent };
