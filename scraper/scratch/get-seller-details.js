const { chromium } = require('playwright');
const cheerio = require('cheerio');

async function test() {
    const url = 'https://www.expat-dakar.com/annonce/a-louer-non-meuble-appartement-f4-de-standing-proche-ipg-6654820';
    console.log('Analyse complète de la zone vendeur sur :', url);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);
        const html = await page.content();
        const $ = cheerio.load(html);
        
        console.log('--- EN-TÊTE DU CONTACT CARD ---');
        const contactBlock = $('.listing-item-contact').first();
        console.log(contactBlock.html());
        
    } catch (e) {
        console.error('Erreur :', e.message);
    } finally {
        await browser.close();
    }
}

test();
