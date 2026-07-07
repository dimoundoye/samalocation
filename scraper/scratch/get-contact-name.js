const { chromium } = require('playwright');
const cheerio = require('cheerio');

async function test() {
    const url = 'https://www.expat-dakar.com/annonce/a-louer-non-meuble-appartement-f4-de-standing-proche-ipg-6654820';
    console.log('Analyse des vendeurs et des profil-links sur :', url);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);
        const html = await page.content();
        const $ = cheerio.load(html);
        
        console.log('--- TOUS LES TEXTES DES HEADER/TITRES DE LA SIDEBAR ---');
        $('.listing-page__sidebar h1, .listing-page__sidebar h2, .listing-page__sidebar h3, .listing-page__sidebar h4, .listing-page__sidebar span, .listing-page__sidebar a').each((i, el) => {
            const tag = el.tagName;
            const text = $(el).text().trim();
            const cls = $(el).attr('class') || '';
            const href = $(el).attr('href') || '';
            if (text.length > 0) {
                console.log(`- ${tag} [class="${cls}"] [href="${href}"] -> "${text}"`);
            }
        });

    } catch (e) {
        console.error('Erreur :', e.message);
    } finally {
        await browser.close();
    }
}

test();
