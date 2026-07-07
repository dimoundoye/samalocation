const { chromium } = require('playwright');
const cheerio = require('cheerio');

class AppartSnScraper {
    constructor() {
        this.name = 'AppartSnScraper';
        this.baseUrl = 'https://appart.sn';
    }

    async scrape(existingProperties = []) {
        console.log('[Appart.sn Scraper] Lancement du navigateur...');
        const browser = await chromium.launch({
            headless: true,
            args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 800 }
        });

        const page = await context.newPage();
        const listings = [];

        try {
            // Default target is apartments in Dakar, customizable
            const categoryPath = process.env.APPART_SN_CATEGORY_PATH || 'appartements/dakar';
            const targetUrl = `${this.baseUrl}/${categoryPath}`;
            console.log(`[Appart.sn Scraper] Chargement de la page : ${targetUrl}`);
            
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
            await page.waitForTimeout(3000);

            const title = await page.title();
            console.log(`[Appart.sn Scraper] Page chargée : "${title}"`);

            const html = await page.content();
            const $ = cheerio.load(html);

            // Find all links to detail pages
            const detailLinks = [];
            $('a').each((index, element) => {
                const href = $(element).attr('href');
                // Appart.sn listing links typically have unique identifiers or subpaths
                if (href && (href.includes('/annonce/') || href.includes('/details/')) && !detailLinks.includes(href)) {
                    const absoluteUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                    if (!detailLinks.includes(absoluteUrl)) {
                        detailLinks.push(absoluteUrl);
                    }
                }
            });

            // Filter out duplicates
            const nonDuplicateLinks = detailLinks.filter(link => {
                const isDuplicate = existingProperties.some(prop => 
                    prop.description && prop.description.includes(link)
                );
                return !isDuplicate;
            });

            const selectedLinks = nonDuplicateLinks.slice(0, 3);
            console.log(`[Appart.sn Scraper] ${detailLinks.length} annonce(s) trouvée(s) (${nonDuplicateLinks.length} nouvelles). Analyse des ${selectedLinks.length} premières...`);

            for (const link of selectedLinks) {
                console.log(`[Appart.sn Scraper] Scraping de l'annonce : ${link}`);
                try {
                    const detailPage = await context.newPage();
                    await detailPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    await detailPage.waitForTimeout(2000);

                    const detailHtml = await detailPage.content();
                    const $detail = cheerio.load(detailHtml);

                    const title = $detail('h1').text().trim() || 'Sans titre';
                    const description = $detail('.description-content').text().trim() || $detail('article').text().trim() || '';
                    const priceText = $detail('.price').text().trim() || '';

                    // Extract contact phone
                    const phoneRegex = /(?:\+221|00221)?\s*(77|78|76|70|75)\s*\d{3}\s*\d{2}\s*\d{2}/g;
                    const phoneMatches = (description + ' ' + title).match(phoneRegex);
                    const phone = phoneMatches && phoneMatches.length > 0 ? phoneMatches[0].replace(/\s+/g, '') : null;

                    // Extract photos
                    const photos = [];
                    $detail('img').each((idx, imgEl) => {
                        const src = $detail(imgEl).attr('src') || $detail(imgEl).attr('data-src');
                        if (src && (src.includes('appart.sn/uploads/') || src.includes('cdn')) && !photos.includes(src)) {
                            photos.push(src);
                        }
                    });

                    const sellerName = $detail('.seller-name').text().trim() || 'Vendeur Appart.sn';

                    const rawText = `
                        Titre : ${title}
                        Prix : ${priceText}
                        Description : ${description}
                        Contact : ${phone || 'Non spécifié'}
                    `;

                    if (description.length > 10) {
                        listings.push({
                            source: 'Appart.sn',
                            url: link,
                            rawText: rawText.trim(),
                            photos: photos.slice(0, 30),
                            sellerName: sellerName,
                            sellerPhone: phone
                        });
                        console.log(`[Appart.sn Scraper] ✅ Importation réussie : "${title.substring(0, 40)}..."`);
                    }

                    await detailPage.close();
                } catch (detailErr) {
                    console.error(`[Appart.sn Scraper] ❌ Erreur sur la page de détail ${link} :`, detailErr.message);
                }

                await page.waitForTimeout(3000);
            }

        } catch (error) {
            console.error('[Appart.sn Scraper] ❌ Erreur de scraping :', error.message);
        } finally {
            await browser.close();
            console.log('[Appart.sn Scraper] Navigateur fermé.');
        }

        return listings;
    }
}

module.exports = AppartSnScraper;
