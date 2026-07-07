const { chromium } = require('playwright');
const cheerio = require('cheerio');

async function test() {
    const url = 'https://www.expat-dakar.com/annonce/a-louer-non-meuble-appartement-f4-de-standing-proche-ipg-6654820';
    console.log('Analyse des images sur :', url);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);
        const html = await page.content();
        const $ = cheerio.load(html);
        
        console.log('Images trouvées sur la page :');
        $('img').each((i, el) => {
            const src = $(el).attr('src');
            const dataSrc = $(el).attr('data-src');
            const alt = $(el).attr('alt') || '';
            const cls = $(el).attr('class') || '';
            if (src || dataSrc) {
                console.log(`- img [class="${cls}"] [alt="${alt}"] -> src="${src}" | data-src="${dataSrc}"`);
            }
        });
    } catch (e) {
        console.error('Erreur :', e.message);
    } finally {
        await browser.close();
    }
}

test();
