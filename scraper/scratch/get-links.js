const { chromium } = require('playwright');
const cheerio = require('cheerio');

async function test() {
    console.log('Lancement du test...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://www.expat-dakar.com/appartements-a-louer', { waitUntil: 'networkidle', timeout: 60000 });
        const html = await page.content();
        const $ = cheerio.load(html);
        
        console.log('Titre de la page :', await page.title());
        
        const annonceLinks = [];
        const otherLinks = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href) {
                if (href.includes('/annonce/')) {
                    annonceLinks.push(href);
                } else {
                    otherLinks.push(href);
                }
            }
        });
        
        console.log(`Nombre total de liens : ${annonceLinks.length + otherLinks.length}`);
        console.log(`Nombre de liens contenant '/annonce/' : ${annonceLinks.length}`);
        console.log('Les liens /annonce/ trouvés :');
        console.log(annonceLinks.slice(0, 15));
        
    } catch (e) {
        console.error('Erreur :', e.message);
    } finally {
        await browser.close();
    }
}

test();
