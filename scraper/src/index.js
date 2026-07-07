require('dotenv').config();
const ApiClient = require('./apiClient');
const MockScraper = require('./scrapers/mockScraper');
const CoinAfriqueScraper = require('./scrapers/coinAfriqueScraper');

async function runPipeline() {

    // 1. Initialize API client and log in
    const apiClient = new ApiClient();
    try {
        await apiClient.login();
    } catch (err) {
        console.error('[Main] Impossible de démarrer le bot : Erreur d\'authentification.');
        process.exit(1);
    }

    // 2. Select scraper sources to run
    const useMock = process.env.USE_MOCK === 'true';
    const scrapersToRun = [];

    if (useMock) {
        scrapersToRun.push(new MockScraper());
    } else {
        scrapersToRun.push(new CoinAfriqueScraper());
    }
    
    console.log(`[Main] Scrapers configurés : ${scrapersToRun.map(s => s.name).join(', ')}`);

    // 3. Fetch existing owner properties to check for duplicates
    console.log('[Main] Récupération des biens existants pour vérification des doublons...');
    const existingProperties = await apiClient.getOwnerProperties();
    console.log(`[Main] ${existingProperties.length} bien(s) existant(s) trouvé(s) en base.`);

    // 4. Run scraping on all configured scrapers (passing existing properties to skip duplicates)
    let rawListings = [];
    for (const scraper of scrapersToRun) {
        console.log(`[Main] Démarrage du scraper : ${scraper.name}`);
        try {
            const listings = await scraper.scrape(existingProperties);
            rawListings = rawListings.concat(listings || []);
        } catch (err) {
            console.error(`[Main] Erreur lors de l'exécution du scraper ${scraper.name} :`, err.message);
        }
    }

    if (rawListings.length === 0) {
        console.log('[Main] Aucune nouvelle annonce récupérée. Arrêt du bot.');
        return;
    }

    console.log(`[Main] Traitement de ${rawListings.length} annonce(s)...`);
    let successCount = 0;

    // 5. Process each listing
    for (let i = 0; i < rawListings.length; i++) {
        const rawListing = rawListings[i];
        console.log(`\n--------------------------------------------------`);
        console.log(`[Main] Traitement de l'annonce ${i + 1}/${rawListings.length}`);
        console.log(`[Main] Source : ${rawListing.source} | URL : ${rawListing.url}`);

        // Vérification des doublons
        const isDuplicate = existingProperties.some(prop => 
            prop.description && prop.description.includes(rawListing.url)
        );
        if (isDuplicate) {
            console.log(`[Main] ⏭️ Annonce déjà importée (Doublon détecté). Passage à la suivante.`);
            continue;
        }

        try {
            // A. Send raw text to backend AI parse-listing endpoint
            const parsedData = await apiClient.parseListing(rawListing.rawText);
            
            if (!parsedData) {
                console.warn('[Main] ⚠️ Échec de la structuration par l\'IA. Annonce ignorée.');
                continue;
            }

            console.log('[Main] ✅ Annonce structurée avec succès par l\'IA.');
            console.log(`[Main] Titre généré : "${parsedData.name}"`);
            console.log(`[Main] Prix : ${parsedData.sale_price || parsedData.units?.[0]?.monthly_rent || 'Non spécifié'} XOF`);

            // B. Upload photos (if any) and get Cloudinary URLs
            let uploadedPhotos = [];
            if (rawListing.photos && rawListing.photos.length > 0) {
                uploadedPhotos = await apiClient.uploadPhotos(rawListing.photos);
            }

            // C. Build the property payload
            // Append original owner and source details to description for transparency & legal compliance
            let enrichedDescription = parsedData.description || '';
            enrichedDescription += `\n\n---\n*Source originale : [Annonce sur ${rawListing.source}](${rawListing.url})*`;
            
            const finalOwnerName = rawListing.sellerName || parsedData.original_owner_name;
            const finalOwnerPhone = rawListing.sellerPhone || parsedData.original_owner_phone;

            if (finalOwnerName) {
                enrichedDescription += `\n*Proposé par : ${finalOwnerName}*`;
            }
            if (finalOwnerPhone) {
                enrichedDescription += `\n*Contact direct : ${finalOwnerPhone}*`;
            }

            // Build payload for backend property creation
            const propertyPayload = {
                property_type: parsedData.property_type || 'appartement',
                listing_type: parsedData.listing_type || 'location',
                name: parsedData.name || 'Bien importé',
                address: parsedData.address || 'Dakar, Sénégal',
                description: enrichedDescription,
                photos: uploadedPhotos,
                photo_url: uploadedPhotos[0] || null, // First image serves as thumbnail
                equipments: parsedData.equipments || [],
                sale_price: parsedData.sale_price || null,
                units: parsedData.units || []
            };

            // D. Post to Samalocation database (created in draft mode)
            const createdProperty = await apiClient.createProperty(propertyPayload);

            if (createdProperty) {
                successCount++;
                console.log('[Main] ✅ Importation réussie !');
            } else {
                console.error('[Main] ❌ Échec de la publication de l\'annonce.');
            }

        } catch (itemError) {
            console.error(`[Main] ❌ Erreur lors du traitement de l'annonce ${i + 1} :`, itemError.message);
        }
    }

    console.log('\n==================================================');
    console.log(`[Main] Fin du traitement.`);
    console.log(`[Main] Annonces importées avec succès : ${successCount}/${rawListings.length}`);
    console.log('==================================================');
}

async function main() {
    console.log('==================================================');
    console.log('        SAMABOT - SCRAPER DE BIENS IMMOBILIERS     ');
    console.log('==================================================');

    const intervalHours = parseFloat(process.env.RUN_INTERVAL_HOURS || '0');

    if (intervalHours > 0) {
        console.log(`[Daemon] Mode démon activé. Planification toutes les ${intervalHours} heures.`);
        
        // Execute immediately on start
        try {
            await runPipeline();
        } catch (err) {
            console.error('[Daemon] Erreur lors de l\'exécution initiale :', err);
        }

        // Schedule subsequent runs
        setInterval(async () => {
            console.log(`\n[Daemon] Lancement automatique toutes les ${intervalHours} heures...`);
            try {
                await runPipeline();
            } catch (err) {
                console.error('[Daemon] Erreur lors de l\'exécution automatique :', err);
            }
        }, intervalHours * 60 * 60 * 1000);
    } else {
        await runPipeline();
    }
}

main().catch(err => {
    console.error('[Main] Erreur critique lors de l\'exécution :', err);
});
