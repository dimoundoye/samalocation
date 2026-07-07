const { chromium } = require('playwright');
const fs = require('fs');

async function test() {
    console.log('Lancement...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        const url = 'https://sn.coinafrique.com/categorie/appartements';
        console.log('Navigation vers :', url);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000);
        
        const html = await page.content();
        fs.writeFileSync('scratch/coinafrique-category.html', html);
        console.log('HTML sauvegardé dans scratch/coinafrique-category.html');
        
    } catch (e) {
        console.error('Erreur :', e.message);
    } finally {
        await browser.close();
    }
}

test();
