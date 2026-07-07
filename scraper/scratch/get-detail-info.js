const { chromium } = require('playwright');
const cheerio = require('cheerio');

async function test() {
    const url = 'https://www.expat-dakar.com/annonce/a-louer-non-meuble-appartement-f4-de-standing-proche-ipg-6654820';
    console.log('Analyse des infos de contact sur :', url);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);
        const html = await page.content();
        const $ = cheerio.load(html);
        
        console.log('--- LIENS DE CONTACT (TEL / WHATSAPP) ---');
        $('a').each((i, el) => {
            const href = $(el).attr('href') || '';
            const text = $(el).text().trim();
            const cls = $(el).attr('class') || '';
            if (href.startsWith('tel:') || href.includes('wa.me') || href.includes('whatsapp') || href.includes('contact')) {
                console.log(`- a [class="${cls}"] href="${href}" text="${text}"`);
            }
        });

        console.log('--- BLOCS DE TEXTE DU CONTACT ---');
        // Let's print elements with typical contact classes
        $('.listing-item__contact, .seller-details, .contact-card, [class*="contact"], [class*="seller"]').each((i, el) => {
            const cls = $(el).attr('class');
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            console.log(`- .${cls} -> "${text.substring(0, 300)}"`);
        });

    } catch (e) {
        console.error('Erreur :', e.message);
    } finally {
        await browser.close();
    }
}

test();
