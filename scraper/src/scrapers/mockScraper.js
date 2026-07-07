/**
 * Mock scraper for testing the pipeline end-to-end without making internet-blocked requests
 */
class MockScraper {
    constructor() {
        this.name = 'MockScraper';
    }

    async scrape() {
        console.log('[Mock Scraper] Simulation de la recherche d\'annonces immobilières...');

        // Wait a small moment to simulate network requests
        await new Promise(resolve => setTimeout(resolve, 1500));

        const listings = [
            {
                source: 'Expat-Dakar (Simulé)',
                url: 'https://www.expat-dakar.com/annonce/appartement-f3-meuble-a-mermoz-12345',
                rawText: `
                    Appartement F3 meublé de luxe à louer à Mermoz vers la boulangerie jaune.
                    Il est composé de :
                    - 2 chambres équipées de climatiseurs
                    - Un grand salon avec Smart TV, canapés en cuir
                    - 2 salles de bain avec eau chaude
                    - Une cuisine entièrement équipée (micro-ondes, frigo, four, vaisselle)
                    - Balcon, gardiennage 24h/24, connexion Wifi haut débit incluse.
                    
                    Loyer : 750 000 FCFA / mois.
                    Contacter l'hôtel résidence Keur Ndoye au 77 123 45 67 ou 76 987 65 43.
                    Disponible immédiatement pour les séjours de longue ou courte durée.
                `,
                photos: [
                    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
                ]
            },
            {
                source: 'Senegal Immobilier (Simulé)',
                url: 'https://www.senegal-immobilier.net/annonce/villa-a-vendre-almadies-67890',
                rawText: `
                    Urgent ! Belle villa F5 à vendre aux Almadies dans une zone résidentielle et calme.
                    Terrain de 400m2 avec titre foncier individuel.
                    
                    Caractéristiques :
                    - 4 chambres spacieuses avec salles de bain attenantes
                    - Grand salon lumineux + salle à manger
                    - Cuisine américaine moderne + cuisine africaine
                    - Espace familial à l'étage
                    - Garage pour 2 voitures, cour avant et arrière avec jardin
                    - Dépendance gardien, groupe électrogène, réservoir d'eau avec surpresseur.
                    
                    Prix de vente : 320 000 000 F CFA.
                    Visites sur rendez-vous uniquement avec l'agence Demba Immo. 
                    Téléphone : +221 78 555 12 34.
                `,
                photos: [
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
                ]
            }
        ];

        console.log(`[Mock Scraper] ✅ ${listings.length} annonces fictives générées pour le test.`);
        return listings;
    }
}

module.exports = MockScraper;
