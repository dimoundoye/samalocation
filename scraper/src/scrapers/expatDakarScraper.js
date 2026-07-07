const { chromium } = require('playwright');
const cheerio = require('cheerio');

class ExpatDakarScraper {
    constructor() {
        this.name = 'ExpatDakarScraper';
        this.baseUrl = 'https://www.expat-dakar.com';
    }

    async scrape(existingProperties = []) {
        console.log('[Expat-Dakar Scraper] Lancement du navigateur...');
        const browser = await chromium.launch({
            headless: true,
            args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
        });

        // Use a realistic user-agent to bypass basic checks
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 800 }
        });

        const page = await context.newPage();
        const listings = [];

        try {
            const categoryPaths = (process.env.EXPAT_DAKAR_CATEGORY_PATH || 'appartements-a-louer').split(',').map(p => p.trim());
            
            for (const categoryPath of categoryPaths) {
                try {
                    const targetUrl = `${this.baseUrl}/${categoryPath}`;
                    console.log(`[Expat-Dakar Scraper] Chargement de la page : ${targetUrl}`);
                    
                    // Go to page with timeout
                    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
                    await page.waitForTimeout(3000);

                    const title = await page.title();
                    console.log(`[Expat-Dakar Scraper] Titre de la page chargé : "${title}"`);

                    // Get HTML and load it in Cheerio
                    const html = await page.content();
                    
                    if (html.includes('cf-challenge') || html.includes('captcha-delivery') || title.includes('Attention Required') || title.includes('Cloudflare')) {
                        console.warn('[Expat-Dakar Scraper] ⚠️ Détecté par Cloudflare ou un CAPTCHA ! Le contenu de la page est bloqué.');
                    }

                    const $ = cheerio.load(html);

                    // Expat-Dakar uses listing cards. We parse card elements to skip sponsored/VIP/boosted sticky ads.
                    const detailLinks = [];
                    $('.listing-card').each((index, element) => {
                        const cardEl = $(element);
                        const cardClass = cardEl.attr('class') || '';
                        
                        // Skip VIP, boosted, gold, silver, and priority listings
                        const isFeatured = cardClass.includes('--priority') || 
                                           cardClass.includes('--silver') || 
                                           cardClass.includes('--gold') || 
                                           cardEl.find('.listing-card__header__tags__item--vip').length > 0 ||
                                           cardEl.text().trim().startsWith('VIP');
                        
                        if (isFeatured) {
                            return; // Skip featured listing
                        }
                        
                        const href = cardEl.find('a[href*="/annonce/"]').first().attr('href') || cardEl.attr('href');
                        if (href && href.includes('/annonce/')) {
                            const absoluteUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                            if (!detailLinks.includes(absoluteUrl)) {
                                detailLinks.push(absoluteUrl);
                            }
                        }
                    });

                    // Filter out links that are already in the database to only parse new ones
                    const nonDuplicateLinks = detailLinks.filter(link => {
                        const isDbDuplicate = existingProperties.some(prop => 
                            prop.description && prop.description.includes(link)
                        );
                        const isCurrentRunDuplicate = listings.some(item => item.url === link);
                        return !isDbDuplicate && !isCurrentRunDuplicate;
                    });

                    // Limit to the first 3 recent non-duplicate listings to avoid overloading
                    const selectedLinks = nonDuplicateLinks.slice(0, 3);
                    console.log(`[Expat-Dakar Scraper] [${categoryPath}] ${detailLinks.length} annonce(s) trouvée(s) (${nonDuplicateLinks.length} nouvelles). Analyse des ${selectedLinks.length} premières...`);

                    for (const link of selectedLinks) {
                        console.log(`[Expat-Dakar Scraper] Scraping de l'annonce : ${link}`);
                        try {
                            const detailPage = await context.newPage();
                            await detailPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
                            await detailPage.waitForTimeout(2000);

                            const detailHtml = await detailPage.content();
                            const $detail = cheerio.load(detailHtml);

                            // Extract Title
                            const title = $detail('h1').text().trim() || $detail('.listing-item__header-title').text().trim() || 'Sans titre';

                            // Extract Description
                            const description = $detail('.listing-item__description').text().trim() || 
                                                $detail('.listing-details__description').text().trim() || 
                                                $detail('article').text().trim() || '';

                            // Extract Price
                            const priceText = $detail('.listing-item__price').text().trim() || 
                                              $detail('.listing-card__price').text().trim() || 
                                              $detail('.price').text().trim() || '';

                            // Extract Phone Number
                            const phoneRegex = /(?:\+221|00221)?\s*(77|78|76|70|75)\s*\d{3}\s*\d{2}\s*\d{2}/g;
                            const phoneMatches = (description + ' ' + title).match(phoneRegex);
                            const phone = phoneMatches && phoneMatches.length > 0 ? phoneMatches[0].replace(/\s+/g, '') : null;

                            // Extract Images
                            const photos = [];
                            $detail('img').each((idx, imgEl) => {
                                const src = $detail(imgEl).attr('src') || $detail(imgEl).attr('data-src');
                                if (src && src.includes('roamcdn.net') && src.includes('listing-thumb') && !src.includes('listing-gallery-thumb') && !photos.includes(src)) {
                                    photos.push(src);
                                }
                            });

                            // Extract Seller Details
                            const sellerName = $detail('.listing-item-transparency__title').text().trim() || null;
                            const rawPhone = $detail('.listing-item-contact__contact-phone__number').text().trim() || 
                                             $detail('.contact-bar__contact__number').text().trim() || 
                                             '';
                            
                            let sellerPhone = null;
                            const sellerPhoneRegex = /(?:\+221|00221)?\s*(77|78|76|70|75|33)\s*\d{3}\s*\d{2}\s*\d{2}/g;
                            const sellerPhoneMatches = rawPhone.match(sellerPhoneRegex);
                            
                            if (sellerPhoneMatches && sellerPhoneMatches.length > 0) {
                                sellerPhone = [...new Set(sellerPhoneMatches.map(m => m.replace(/\s+/g, '')))].join(', ');
                            } else {
                                const telLink = $detail('a[href^="tel:"]').first().attr('href');
                                if (telLink) {
                                    sellerPhone = telLink.replace('tel:', '').replace(/\s+/g, '').trim();
                                }
                            }

                            // Build rawText for AI parsing
                            const rawText = `
                                Titre : ${title}
                                Prix : ${priceText}
                                Description : ${description}
                                Contact : ${phone || sellerPhone || 'Non spécifié directement dans le texte'}
                            `;

                            if (description.length > 10) {
                                listings.push({
                                    source: 'Expat-Dakar',
                                    url: link,
                                    rawText: rawText.trim(),
                                    photos: photos.slice(0, 30), // limit to 30 photos per listing
                                    sellerName: sellerName,
                                    sellerPhone: sellerPhone
                                });
                                console.log(`[Expat-Dakar Scraper] ✅ Importation réussie : "${title.substring(0, 40)}..." (Vendeur: ${sellerName || 'Inconnu'} | Tél: ${sellerPhone || 'Aucun'} | Photos: ${Math.min(photos.length, 30)})`);
                            }

                            await detailPage.close();
                        } catch (detailErr) {
                            console.error(`[Expat-Dakar Scraper] ❌ Erreur sur la page de détail ${link} :`, detailErr.message);
                        }

                        // Wait 3 seconds between requests to be gentle
                        await page.waitForTimeout(3000);
                    }
                } catch (categoryErr) {
                    console.error(`[Expat-Dakar Scraper] ❌ Erreur lors de la navigation dans la catégorie ${categoryPath} :`, categoryErr.message);
                }
            }

        } catch (error) {
            console.error('[Expat-Dakar Scraper] ❌ Erreur de scraping général :', error.message);
        } finally {
            await browser.close();
            console.log('[Expat-Dakar Scraper] Navigateur fermé.');
        }

        return listings;
    }
}

module.exports = ExpatDakarScraper;
