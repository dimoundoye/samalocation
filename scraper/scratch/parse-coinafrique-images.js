const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('scratch/coinafrique-detail.html', 'utf8');
const $ = cheerio.load(html);

console.log('--- RECHERCHE D\'IMAGES DANS LE DETAIL ---');
$('img').each((idx, el) => {
    const attrs = el.attribs;
    const src = attrs.src || '';
    const dataSrc = attrs['data-src'] || '';
    const alt = attrs.alt || '';
    if (src.includes('media') || dataSrc.includes('media') || src.includes('images') || dataSrc.includes('images') || alt) {
        console.log(`IMG ${idx}: src="${src}" data-src="${dataSrc}" alt="${alt}" class="${attrs.class || ''}"`);
    }
});

console.log('\n--- AUTRES ELEMENTS CONTENANT DU RECONSTRUCTIBLE ---');
// Sometimes pictures are inside slider-item or have dynamic tags
$('[class*="slide"], [class*="gallery"], [class*="carousel"], [class*="swiper"]').each((idx, el) => {
    console.log(`Tag: ${el.tagName} | Class: ${$(el).attr('class')} | HTML (first 100): ${$(el).html().substring(0, 150).replace(/\s+/g, ' ')}`);
});
