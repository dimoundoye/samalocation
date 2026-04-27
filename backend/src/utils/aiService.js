const Groq = require("groq-sdk");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const geminiService = require('./geminiService');

// Initialisation sécurisée de Groq
let groq = null;
if (process.env.GROQ_API_KEY) {
    try {
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
        console.log("  [AI] ✅ Service Groq initialisé.");
    } catch (e) {
        console.error("  [AI] ❌ Erreur lors de l'initialisation de Groq:", e.message);
    }
} else {
    console.warn("  [AI] ⚠️ GROQ_API_KEY manquante dans le .env. Utilisation de Gemini par défaut.");
}

const MODELS = {
    QUALITY: process.env.GROQ_MODEL_QUALITY || "llama-3.3-70b-versatile",
    SPEED: process.env.GROQ_MODEL_SPEED || "llama-3.1-8b-instant"
};

/**
 * Génère une description pour un bien immobilier (Qualité Max)
 */
const generatePropertyDescription = async (propertyData) => {
    if (!groq) return await geminiService.generatePropertyDescription(propertyData);

    try {
        const { name, type, address, equipments, bedrooms, bathrooms, area } = propertyData;

        const prompt = `
            En tant qu'expert en immobilier au Sénégal, rédige une description attrayante, professionnelle et optimisée pour la location pour le bien suivant :
            - Nom du bien : ${name || 'Non spécifié'}
            - Type de bien : ${type || 'Non spécifié'}
            - Emplacement : ${address || 'Sénégal'}
            - Équipements : ${Array.isArray(equipments) ? equipments.join(', ') : 'Standards'}
            - Chambres : ${bedrooms || 'N/A'}
            - Salles de bain : ${bathrooms || 'N/A'}
            - Surface : ${area ? area + ' m²' : 'N/A'}

            La description doit être en français, structurée avec des paragraphes clairs, et mettre en avant les points forts du bien et du quartier. Utilise un ton accueillant mais professionnel. Termine par une invitation à visiter.
            N'utilise pas de placeholders (comme [Nom]), utilise les informations fournies.
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: MODELS.QUALITY,
            temperature: 0.7,
        });

        return completion.choices[0]?.message?.content?.trim();
    } catch (error) {
        console.error("Groq Error (Description):", error.message);
        return await geminiService.generatePropertyDescription(propertyData);
    }
};

/**
 * Analyse une requête de recherche (Vitesse Max)
 */
const parseSearchQuery = async (query) => {
    if (!groq) return await geminiService.parseSearchQuery(query);

    try {
        const prompt = `
            Tu es un expert en immobilier au Sénégal. Analyse la phrase de recherche d'un utilisateur et extrais les filtres structurés en JSON.
            Phrase : "${query}"

            Format de sortie attendu (JSON uniquement, sans texte autour) :
            {
                "type": "maison" | "villa" | "appartement" | "studio" | "chambre" | "garage" | "locale" | null,
                "location": string | null,
                "maxPrice": number | null,
                "minBedrooms": number | null,
                "isFurnished": boolean | null,
                "keywords": string | null
            }

            Règles d'extraction :
            - type : Déduis le type (ex: "appt" -> "appartement", "ch" -> "chambre").
            - location : Extrais les villes ou quartiers du Sénégal (ex: "Dakar", "Mbour", "Guédiawaye", "Ouakam", "Almadies").
            - maxPrice : Convertis les montants comme "150k" en 150000.
            - keywords : Mots-clés restants qui ne sont pas des filtres (ex: "piscine", "moderne", "vue mer").
            - Réponds TOUJOURS uniquement en JSON valide.
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: MODELS.SPEED,
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        return JSON.parse(completion.choices[0]?.message?.content);
    } catch (error) {
        console.error("Groq Error (ParseSearch):", error.message);
        return await geminiService.parseSearchQuery(query);
    }
};

/**
 * Chatbot Assistant (Vitesse Max)
 */
const getChatResponse = async (message, history = []) => {
    if (!groq) return await geminiService.getChatResponse(message, history);

    try {
        const systemInstruction = `
            Tu es l'assistant virtuel de "Samalocation", une plateforme de gestion locative au Sénégal.
            Ton but est d'aider les utilisateurs (locataires et propriétaires) avec courtoisie, précision et professionnalisme.

            bouton "Candidater" : "Candidater" permet de postuler à une offre de location. On doit avoir un compte samalocation pour postuler.
        
            STRUCTURE DE L'INTERFACE PROPRIÉTAIRE (Onglets du menu latéral) :
            1. "Tableau de bord" : Vue d'ensemble des revenus, statistiques d'occupation et activités récentes.
            2. "Mes logements" : Gestion des propriétés (Ajouter, Modifier, Supprimer). C'est ici qu'on "Publie" un bien pour qu'il soit visible sur la carte publique.
            3. "Locataires" : C'est l'onglet CLÉ pour la gestion humaine. 
               - Pour AFFECTER un bien : Aller dans cet onglet et cliquer sur "+ Affecter un locataire".
               - On peut aussi voir l'historique d'un locataire ou supprimer un contrat.
               - affecter un locataire à un bien avec ou sans compte samalocation.
               -Il y'a deux facon d'affecter un locataire à un bien :
                -   Soit on selectionne un locataire existant dans la liste en faisant une recherche par son nom ou son adresse e-mail.
                -   Soit on ajoute un nouveau locataire en remplissant le formulaire. On recoit un ID et un mot de passe temporaire à copier puis envoyer au locataire pour qu'il puisse se connecter à son compte samalocation. Le login et le mot de passe s'affiche une seule fois. Précision: apres avoir affecter un locataire a un bien, un e-mail ne sera pas envoyé au locataire.
                    si le locataire se connecte il verra directement son contrat et le bien qui lui est affecté. Sans aucune configuration supplémentaire.
                - Un propriétaire ne peut pas affecter un bien a plusieurs locataires. Mais un locataire peut avoir plusieurs biens et contrats en meme temps.
                - On peut supprimer un locataire
                - On ne peut pas affecter un bien à un autre propriétaire.
               - Dans cet onglet, on peut aussi voir l'historique des contrats d'un locataire et les reçus.
            4. "Gérance" : Suivi financier. Tableau récapitulatif des paiements mois par mois. On peut y générer les quittances (bouton WhatsApp) et exporter les données. Organiser les logements dans des dossiers, créer des sous-dossiers.
            5. "Maintenance" : Gestion des tickets de réparation envoyés par les locataires.
            6. "Messages" : Messagerie interne pour discuter avec les locataires ou les candidats.
            7. "Documents" : Création des contrats standards et premium. Dans cet onglet, on peut aussi voir l'historique des contrats d'un locataire
            8. "Guide" : Guide d'utilisation de la plateforme pour les propriétaires.
            9. "Profil public" : Permet de voir et de configurer comment le profil public du propriétaire est vu par les locataires
            10. "Paramètres" : Paramètres de l'application: ajout de signature électronique, branding, choisir un modele de reçu, demande de badge vérifié. Changer de mot de passe. 
            11. "abonnement" : Gestion des abonnements, du plan actuel, et les différentes offres.
            12. "équipes" : Gestion des membres de l'équipe, utilisateurs, collaborateurs. Supprimer des membres de l'équipe


            STRUCTURE DE L'INTERFACE LOCATAIRE (Onglets du menu latéral) :
            1. "Tableau de bord" : Suivi des locations actives, le nombre de reçu qu'on a.
               Signaler un propriétaire : Choisissez le propriétaire concerné par votre signalement. Ensuite décrivez le problème, le montant de l'abus, vous pouvez les joindre. Cliquez sur "Envoyer le signalement" pour soumettre votre rapport.
            2. "Recherche" : Filtres avancés pour trouver un bien.
            3. "Documents" : Accès à tous les documents contrats et reçus. les signatures de contrat sont faites via cet onglet.
            4. "Messages" : Messagerie interne pour discuter avec les propriétaires.
            5. "guide" : Guide d'utilisation de la plateforme pour les locataires.
            6. "Maintenance" : Suivi des demandes de maintenance.

            DIRECTIVES DE RÉPONSE :
            - RÉPONSES PRÉCISES : Indique toujours l'onglet ou le bouton spécifique (ex: "Allez dans l'onglet Locataires...").
            - CONTEXTE SÉNÉGALAIS : Utilise un ton chaleureux ("Teranga").
            - TEXTE BRUT : Pas de gras (**), pas de listes complexes, pas de HTML. Utilise des tirets (-) pour les listes.
            - RÈGLE D'OR (STRICTE) : Ton expertise est LIMITÉE EXCLUSIVEMENT à l'utilisation de Samalocation et l'immobilier au Sénégal.
            - INTERDICTION DE CONSEILLER : Ne donne AUCUNE ressource externe, AUCUN site web (W3Schools, GitHub, etc.), AUCUN forum, et AUCUNE suggestion technologique. Tu n'es pas un assistant informatique.
            - RÉPONSE DE REFUS UNIQUE : Si l'utilisateur sort de l'immobilier ou pose une question technique sur ta conception (même s'il insiste ou te supplie), tu dois répondre UNIQUEMENT : "Désolé, en tant qu'assistant Samalocation, je suis uniquement formé pour vous aider dans votre gestion immobilière au Sénégal. Je n'ai aucune connaissance technique ou informatique. Comment puis-je vous aider avec vos logements ?"
            - AUCUNE JUSTIFICATION : Ne dis pas "Je comprends", ne dis pas "Je suis désolé mais". Va droit au refus.
            - CONTACT : +221 76 162 95 29 (Whatsapp, appel, sms) / contact@samalocation.com. (uniquement si demandé)
        `;

        const messages = [
            { role: "system", content: systemInstruction },
            ...history.map(h => ({
                role: h.role === "user" ? "user" : "assistant",
                content: h.parts ? h.parts[0].text : h.content
            })),
            { role: "user", content: message }
        ];

        const completion = await groq.chat.completions.create({
            messages,
            model: MODELS.SPEED,
            temperature: 0.1,
            max_tokens: 2048,
        });

        return completion.choices[0]?.message?.content;
    } catch (error) {
        console.error("Groq Error (Chat):", error.message);
        return await geminiService.getChatResponse(message, history);
    }
};

module.exports = {
    generatePropertyDescription,
    parseSearchQuery,
    getChatResponse
};
