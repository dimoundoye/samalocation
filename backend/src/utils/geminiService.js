const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Utility to get the best available model
const getModel = (options = {}) => {
    // gemini-flash-latest is confirmed to work and have quota for this key
    const defaultModel = "gemini-flash-latest";
    return genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || defaultModel,
        ...options
    });
};
// permet de générer une description pour un bien
const generatePropertyDescription = async (propertyData) => {
    try {
        const model = getModel();

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

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        return responseText.trim();
    } catch (error) {
        console.error("Gemini API Error (GenerateDescription):", error.message || error);
        if (error.response) console.error("Error Details:", JSON.stringify(error.response, null, 2));
        throw new Error("Erreur lors de la génération de la description avec l'IA.");
    }
};

const parseSearchQuery = async (query) => {
    try {
        const model = getModel();

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

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Parse Error:", error);
        return {};
    }
};

const getChatResponse = async (message, history = []) => {
    try {
        const systemInstruction = `
            Tu es l'assistant virtuel de "Samalocation", une plateforme de gestion locative au Sénégal.
            Ton but est d'aider les utilisateurs (locataires et propriétaires) avec courtoisie et professionnalisme.
            
            Informations clés :
            - Samalocation permet de louer des appartements, villas, studios et chambres au Sénégal.
            - Les propriétaires peuvent gérer leurs biens, générer des reçus et trouver des locataires.
            - Les locataires peuvent chercher des biens sur la carte et postuler.
            
            Directives :
            - Sois chaleureux et utilise un ton sénégalais accueillant ("Teranga").
            - RÉPONSE COURTE : Ne donne pas trop d'informations d'un coup.
            - TEXTE BRUT : N'utilise JAMAIS de balises HTML (<br>) ni de Markdown (**gras**, listes). Réponds en texte brut uniquement avec des sauts de ligne classiques.
            - GREETING : Si l'utilisateur dit simplement "Bonjour", "Salam" ou "Salut", réponds brièvement (ex: "Salam ! Comment puis-je vous aider aujourd'hui ?") sans réciter tes services.
            - Sois concis. Ne donne d'informations détaillées que si l'utilisateur pose une question spécifique.
            - Ne donne jamais d'informations confidentielles.
            - Si l'utilisateur demande de nous contacter, donne lui notre numéro de téléphone : +221 76 162 95 29 disponible sur whatsapp aussi et notre email : contact@samalocation.com. ne leur donne pas notre numéro de téléphone ou notre email si il ne le demande pas.
        `;

        const model = getModel({ systemInstruction });

        // Ensure history alternates: user, model, user, model...
        // And MUST start with 'user'
        let validHistory = history.filter(h => h.role === "user" || h.role === "model");

        // Strictly alternate: user, model, user, model
        const strictlyAlternated = [];
        let lastRole = null;

        for (const h of validHistory) {
            if (h.role !== lastRole) {
                strictlyAlternated.push(h);
                lastRole = h.role;
            }
        }

        // permet de s'assurer que l'historique commence par un message de l'utilisateur
        const firstUserIndex = strictlyAlternated.findIndex(h => h.role === "user");
        if (firstUserIndex !== -1) {
            validHistory = strictlyAlternated.slice(firstUserIndex);
        } else {
            validHistory = [];
        }

        console.log(`[AI Chat] Sending request with history length: ${validHistory.length}`);

        const chat = model.startChat({
            history: validHistory,
            generationConfig: {
                maxOutputTokens: 256,
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
            },
        });

        const result = await chat.sendMessage(message);
        return result.response.text();
    } catch (error) {
        console.error("Gemini Chat Error (getChatResponse):", error.message || error);
        if (error.response) console.error("Error Details:", JSON.stringify(error.response, null, 2));
        return "Désolé, je rencontre une petite difficulté technique. Puis-je vous aider autrement ?";
    }
};

module.exports = {
    generatePropertyDescription,
    parseSearchQuery,
    getChatResponse
};
