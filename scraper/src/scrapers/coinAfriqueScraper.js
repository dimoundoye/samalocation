const { chromium } = require('playwright');
const cheerio = require('cheerio');

class CoinAfriqueScraper {
    constructor() {
        this.name = 'CoinAfriqueScraper';
        this.baseUrl = 'https://sn.coinafrique.com';
    }

    async scrape(existingProperties = []) {
        console.log('[CoinAfrique Scraper] Lancement du navigateur...');
        const browser = await chromium.launch({
            headless: true,
            args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
        });

        // realistic user-agent to bypass bot checks
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 800 }
        });

        const page = await context.newPage();
        const listings = [];

        try {
            const categoryPaths = (process.env.COINAFRIQUE_CATEGORY_PATH || 'categorie/appartements').split(',').map(p => p.trim());
            
            for (const categoryPath of categoryPaths) {
                try {
                    const targetUrl = `${this.baseUrl}/${categoryPath}`;
                    console.log(`[CoinAfrique Scraper] Chargement de la page : ${targetUrl}`);
                    
                    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
                    await page.waitForTimeout(3000);

                    const title = await page.title();
                    console.log(`[CoinAfrique Scraper] Page de catégorie chargée : "${title}"`);

                    const html = await page.content();
                    const $ = cheerio.load(html);

                    // Find all links to detail pages, skipping sponsored "TOP" ads
                    const detailLinks = [];
                    $('.card, [class*="card"], [class*="ad-card"], [class*="ad__card"]').each((index, el) => {
                        const cardEl = $(el);
                        
                        // Skip TOP and VIP promoted ads
                        const isTop = cardEl.find('.badge_top, [class*="badge_top"], [class*="vip"], [class*="top"]').length > 0;
                        if (isTop) {
                            return; // Skip this card
                        }
                        
                        const href = cardEl.find('a[href*="/annonce/"]').first().attr('href') || cardEl.attr('href');
                        if (href && href.includes('/annonce/')) {
                            const absoluteUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                            if (!detailLinks.includes(absoluteUrl)) {
                                detailLinks.push(absoluteUrl);
                            }
                        }
                    });

                    // Filter out duplicates (checking both the DB and what we already found in this run)
                    const nonDuplicateLinks = detailLinks.filter(link => {
                        const isDbDuplicate = existingProperties.some(prop => 
                            prop.description && prop.description.includes(link)
                        );
                        const isCurrentRunDuplicate = listings.some(item => item.url === link);
                        return !isDbDuplicate && !isCurrentRunDuplicate;
                    });

                    // Limit to top 3 new listings
                    const selectedLinks = nonDuplicateLinks.slice(0, 3);
                    console.log(`[CoinAfrique Scraper] [${categoryPath}] ${detailLinks.length} annonce(s) trouvée(s) (${nonDuplicateLinks.length} nouvelles). Analyse des ${selectedLinks.length} premières...`);

                    for (const link of selectedLinks) {
                        console.log(`[CoinAfrique Scraper] Scraping de l'annonce : ${link}`);
                        try {
                            const detailPage = await context.newPage();
                            await detailPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
                            await detailPage.waitForTimeout(2000);

                            const detailHtml = await detailPage.content();
                            const $detail = cheerio.load(detailHtml);

                            // Title
                            const titleText = $detail('h1').text().trim() || 'Sans titre';

                            // Description
                            const descriptionText = $detail('.ad__info__box-descriptions').text().trim()
                                .replace(/^Détails du produit\s*/i, '')
                                .trim();

                            // Price
                            const priceText = $detail('.price').first().text().trim() || 'Prix sur demande';

                            // Seller name
                            const sellerName = $detail('.username').first().text().trim() || 'Vendeur CoinAfrique';

                            // Extract seller phone number
                            let sellerPhone = null;
                            $detail('a[href]').each((idx, aEl) => {
                                const href = $detail(aEl).attr('href');
                                if (href && (href.startsWith('tel:') || href.includes('whatsapp') || href.includes('wa.me') || href.includes('phone='))) {
                                    const match = href.match(/(?:\+221|00221)?\s*(77|78|76|70|75|33)\s*\d{3}\s*\d{2}\s*\d{2}/) || href.match(/phone=(\+?\d+)/) || href.match(/tel:(\+?\d+)/);
                                    if (match && match[0]) {
                                        sellerPhone = match[0].replace(/phone=/, '').replace(/tel:/, '').replace(/\s+/g, '');
                                        if (!sellerPhone.startsWith('+') && !sellerPhone.startsWith('00') && sellerPhone.length === 9) {
                                            sellerPhone = `+221${sellerPhone}`;
                                        }
                                    }
                                }
                            });

                            // Photos
                            const photos = [];
                            $detail('[style*="background-image"]').each((idx, divEl) => {
                                const style = $detail(divEl).attr('style') || '';
                                const match = style.match(/url\(['"]?(https?:\/\/[^'"]+?)['"]?\)/i) || style.match(/url\((https?:\/\/[^)]+?)\)/i);
                                if (match && match[1]) {
                                    let imgUrl = match[1].replace(/&quot;/g, '').replace(/"/g, '').trim();
                                    if (imgUrl.includes('images.coinafrique.com')) {
                                        if (imgUrl.includes('thumb_')) {
                                            imgUrl = imgUrl.replace('thumb_', '');
                                        }
                                        if (!photos.includes(imgUrl)) {
                                            photos.push(imgUrl);
                                        }
                                    }
                                }
                            });

                            $detail('img').each((idx, imgEl) => {
                                const src = $detail(imgEl).attr('src') || $detail(imgEl).attr('data-src') || '';
                                if (src.includes('images.coinafrique.com') && !src.includes('profil')) {
                                    let imgUrl = src.trim();
                                    if (imgUrl.includes('thumb_')) {
                                        imgUrl = imgUrl.replace('thumb_', '');
                                    }
                                    if (!photos.includes(imgUrl)) {
                                        photos.push(imgUrl);
                                    }
                                }
                            });

                            const rawText = `
                                Titre : ${titleText}
                                Prix : ${priceText}
                                Description : ${descriptionText}
                                Contact : ${sellerPhone || 'Non spécifié'}
                            `;

                            if (descriptionText.length > 10) {
                                listings.push({
                                    source: 'CoinAfrique',
                                    url: link,
                                    rawText: rawText.trim(),
                                    photos: photos.slice(0, 30),
                                    sellerName: sellerName,
                                    sellerPhone: sellerPhone
                                });
                                console.log(`[CoinAfrique Scraper] ✅ Importation réussie : "${titleText.substring(0, 40)}..." (Vendeur: ${sellerName} | Tél: ${sellerPhone || 'Aucun'} | Photos: ${Math.min(photos.length, 30)})`);
                            }

                            await detailPage.close();
                        } catch (detailErr) {
                            console.error(`[CoinAfrique Scraper] ❌ Erreur sur la page de détail ${link} :`, detailErr.message);
                        }

                        await page.waitForTimeout(3000);
                    }
                } catch (categoryErr) {
                    console.error(`[CoinAfrique Scraper] ❌ Erreur lors de la navigation dans la catégorie ${categoryPath} :`, categoryErr.message);
                }
            }

        } catch (error) {
            console.error('[CoinAfrique Scraper] ❌ Erreur de scraping :', error.message);
        } finally {
            await browser.close();
            console.log('[CoinAfrique Scraper] Navigateur fermé.');
        }

        return listings;
    }
}

module.exports = CoinAfriqueScraper;
