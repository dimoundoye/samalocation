const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('scratch/coinafrique-detail.html', 'utf8');
const $ = cheerio.load(html);

console.log('--- TITRE ---');
const title = $('h1').text().trim();
console.log('Titre :', title);

console.log('\n--- DESCRIPTION ---');
// Let's find elements containing description
const descEl = $('.ad-description, [class*="description"], [class*="details"], article');
descEl.each((idx, el) => {
    const cls = $(el).attr('class');
    const txt = $(el).text().trim().replace(/\s+/g, ' ');
    if (txt.length > 20) {
        console.log(`Cls: ${cls} | Text (first 100): ${txt.substring(0, 150)}`);
    }
});

console.log('\n--- PRIX ---');
const priceEl = $('.price, [class*="price"]');
priceEl.each((idx, el) => {
    const cls = $(el).attr('class');
    const txt = $(el).text().trim().replace(/\s+/g, ' ');
    console.log(`Cls: ${cls} | Price: ${txt}`);
});

console.log('\n--- CONTACTS (a[href]) ---');
const contacts = [];
$('a').each((idx, el) => {
    const href = $(el).attr('href');
    if (href && (href.startsWith('tel:') || href.includes('whatsapp') || href.includes('wa.me') || href.includes('phone='))) {
        contacts.push(href);
    }
});
console.log('Contacts found:', contacts);

console.log('\n--- IMAGES (img) ---');
const images = [];
// Look for slider / gallery images
$('img').each((idx, imgEl) => {
    const src = $(imgEl).attr('src') || $(imgEl).attr('data-src');
    const cls = $(imgEl).attr('class');
    if (src && (src.includes('coinafrique.com') || src.includes('static') || src.includes('media'))) {
        images.push({ src, cls });
    }
});
console.log(`Images found (${images.length}) :`);
images.slice(0, 15).forEach(img => console.log(`Cls: ${img.cls} | Src: ${img.src}`));

console.log('\n--- SELLER NAME ---');
const sellers = [];
$('[class*="seller"], [class*="user"], [class*="owner"], [class*="profile"]').each((idx, el) => {
    const cls = $(el).attr('class');
    const txt = $(el).text().trim().replace(/\s+/g, ' ');
    if (txt.length > 2 && txt.length < 50 && !sellers.includes(txt)) {
        sellers.push({ cls, txt });
    }
});
console.log('Seller candidates:', sellers.slice(0, 10));
