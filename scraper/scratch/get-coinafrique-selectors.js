const { chromium } = require('playwright');
const cheerio = require('cheerio');

async function test() {
    console.log('Lancement de Playwright...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();
    try {
        console.log('Navigation vers CoinAfrique...');
        await page.goto('https://sn.coinafrique.com/categorie/appartements', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000);
        
        const html = await page.content();
        const $ = cheerio.load(html);
        
        console.log('Recherche de liens...');
        const links = [];
        $('a').each((idx, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/annonce/') && !links.includes(href)) {
                links.push(href);
            }
        });
        
        console.log(`Trouvé ${links.length} liens d'annonces :`);
        console.log(links.slice(0, 5));
        
        // Regarder un échantillon du HTML d'un lien d'annonce ou d'un wrapper
        console.log('\nAnalyse d\'un élément d\'annonce dans la page (classes et attributs) :');
        const cards = [];
        $('.card, .ad-card, .listing-card, [class*="card"], [class*="ad"]').each((idx, el) => {
            const cls = $(el).attr('class');
            if (cls && cards.length < 5 && !cards.includes(cls)) {
                cards.push(cls);
            }
        });
        console.log('Classes candidates pour les cartes d\'annonces :', cards);
        
        if (links.length > 0) {
            const detailUrl = links[0].startsWith('http') ? links[0] : `https://sn.coinafrique.com${links[0]}`;
            console.log(`\nNavigation vers la première annonce de détail : ${detailUrl}`);
            await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(3000);
            
            const detailHtml = await page.content();
            const $detail = cheerio.load(detailHtml);
            
            console.log('Titre de la page de détail :', $detail('h1').text().trim());
            console.log('Description (snippet) :', ($detail('.description, .ad-description, [class*="description"]').text().trim().substring(0, 200) || 'Aucun'));
            console.log('Prix :', ($detail('.price, [class*="price"]').text().trim() || 'Aucun'));
            
            const images = [];
            $detail('img').each((idx, imgEl) => {
                const src = $detail(imgEl).attr('src') || $detail(imgEl).attr('data-src');
                if (src && !images.includes(src)) {
                    images.push(src);
                }
            });
            console.log(`Images trouvées (${images.length}) :`, images.slice(0, 5));
        }
        
    } catch (e) {
        console.error('Erreur :', e.message);
    } finally {
        await browser.close();
    }
}

test();
