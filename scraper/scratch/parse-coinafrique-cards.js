const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('scratch/coinafrique-category.html', 'utf8');
const $ = cheerio.load(html);

console.log('--- RECHERCHE DES CARTES D\'ANNONCES ---');
// Let's print parent wrappers that enclose the links
// Standard card wrapper in CoinAfrique contains '.card' or class names starting with 'card'
const cards = $('.card, [class*="card"], [class*="ad-card"], [class*="ad__card"]');
console.log(`Nombre de cartes trouvées : ${cards.length}`);

cards.each((idx, el) => {
    const cardEl = $(el);
    const href = cardEl.find('a').first().attr('href') || cardEl.attr('href') || '';
    
    // Check if card has a "TOP" element or class
    const hasTopText = cardEl.text().includes('TOP') || cardEl.html().includes('TOP');
    const hasVipClass = cardEl.find('.vip, [class*="vip"], [class*="top"], [class*="badge"]').length > 0;
    
    // Find specific class names inside this card
    const innerClasses = [];
    cardEl.find('*').each((i, subEl) => {
        const cls = $(subEl).attr('class');
        if (cls && !innerClasses.includes(cls)) {
            innerClasses.push(cls);
        }
    });

    if (hasTopText || hasVipClass || idx < 5) {
        console.log(`\nCARD ${idx}:`);
        console.log(`- Link: ${href}`);
        console.log(`- Text snippet (first 100): ${cardEl.text().trim().replace(/\s+/g, ' ').substring(0, 100)}`);
        console.log(`- Contient "TOP" ? ${hasTopText}`);
        console.log(`- Contient classe VIP/TOP/Badge ? ${hasVipClass}`);
        console.log(`- Classes internes :`, innerClasses.filter(c => c.includes('top') || c.includes('vip') || c.includes('badge') || c.includes('tag')));
    }
});
