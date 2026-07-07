const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('scratch/expat-category.html', 'utf8');
const $ = cheerio.load(html);

console.log('--- RECHERCHE DES CARTES D\'ANNONCES EXPAT-DAKAR ---');
// Expat-Dakar listings are typically inside cards
const cards = $('.listings-cards__list-item, [class*="listing"], [class*="card"]');
console.log(`Nombre de cartes trouvées : ${cards.length}`);

cards.each((idx, el) => {
    const cardEl = $(el);
    const href = cardEl.find('a').first().attr('href') || cardEl.attr('href') || '';
    
    // Check if card contains classes like 'featured', 'boosted', or badge text like 'Une'
    const text = cardEl.text().replace(/\s+/g, ' ').trim();
    const hasFeaturedText = text.includes('À la une') || text.includes('À LA UNE') || text.includes('VEDETTE');
    
    const innerClasses = [];
    cardEl.find('*').each((i, subEl) => {
        const cls = $(subEl).attr('class');
        if (cls && !innerClasses.includes(cls)) {
            innerClasses.push(cls);
        }
    });

    const isFeaturedClass = innerClasses.some(c => c.includes('featured') || c.includes('boosted') || c.includes('badge') || c.includes('highlight'));

    if (hasFeaturedText || isFeaturedClass || idx < 5) {
        console.log(`\nCARD ${idx}:`);
        console.log(`- Link: ${href}`);
        console.log(`- Text snippet (first 100): ${text.substring(0, 100)}`);
        console.log(`- Contient texte Vedette/Une ? ${hasFeaturedText}`);
        console.log(`- Contient classe Vedette/Boost ? ${isFeaturedClass}`);
        console.log(`- Classes internes :`, innerClasses.filter(c => c.includes('featured') || c.includes('boost') || c.includes('badge') || c.includes('tag') || c.includes('highlight') || c.includes('label')));
    }
});
