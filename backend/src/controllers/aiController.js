const response = require('../utils/response');
const aiService = require('../utils/aiService');
const AIUsage = require('../models/aiUsageModel');

// ─── Prompt Injection Guard ────────────────────────────────────────────────────
// Normalize text: remove all accents so "régler","règles","regle" all match the same pattern
const normalizeText = (str) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const INJECTION_PATTERNS = [
    // "quelles sont les règles / régler / règles données / reçues..."
    /regle[s]?r?\s*(qu[e']on|que\s*vous|recue[s]?|donn[e]?e[s]?|impos[e]?e[s]?)/,
    // "quel sont les règles / quelles sont tes instructions..."
    /quel[s]?\s*sont\s*(les|tes|vos)\s*(regle[s]?r?|instruction[s]?|directive[s]?|parametre[s]?|consigne[s]?)/,
    /quell?e[s]?\s*(sont|etaient)\s*(les|tes|vos)\s*(regle[s]?|instruction[s]?|directive[s]?|parametre[s]?)/,
    // "instructions données / reçues / de base / on vous a données..."
    /instruction[s]?\s*(recue[s]?|donn[e]?e[s]?|qu[e']on|de\s*base|initiale[s]?)/,
    /instruction[s]?\s*(on\s*(vous|t[e'])\s*a|qu[e']on\s*(t[e']?\s*a|vous\s*a))/,
    // "system prompt / prompt system"
    /system\s*prompt/,
    /prompt\s*system/,
    // "montre moi tes instructions / règles / directives"
    /montre[- ]?moi\s*(tes|vos|les|mes)?\s*(instruction[s]?|regle[s]?|directive[s]?|parametre[s]?|consigne[s]?)/,
    // "tes / vos instructions / règles / directives"
    /(tes|vos)\s*(instruction[s]?|directive[s]?|consigne[s]?|regle[s]?)\s*(de\s*base|initiale[s]?|recue[s]?|donn[e]?e[s]?)?/,
    // "comment tu fonctionnes / as été programmé..."
    /comment\s*(tu\s*fonctionn|tu\s*as\s*ete\s*(program|configur|cree))/,
    // "qui t'a créé / programmé / fait..." (apostrophe becomes space after normalize)
    /qui\s+t\s*a\s+(cree|programme?|configure?|fait|developp|concu)/,
    // "ignore / oublie tes instructions..."
    /ignore\s*(tes|les|toutes)\s*(instruction[s]?|regle[s]?|directive[s]?)/,
    /oublie\s*(tes|les|toutes)\s*(instruction[s]?|regle[s]?|directive[s]?)/,
    // Manipulation / role play
    /act\s*as\s*(if|a|an)/,
    /pretend\s*(you|to)/,
    /jeu\s*de\s*role/,
    /tu\s*n.es\s*(plus|pas)\s*(un|une?\s*assistant)/,
    /desactive\s*(tes|les)\s*(restriction[s]?|filtre[s]?|limite[s]?)/,
    // "révèle tes règles / secrets..."
    /revele\s*(tes|les|vos)\s*(instruction[s]?|regle[s]?|secret[s]?)/,
    // "quelles consignes t'ont-ils données..."
    /quell?e[s]?\s*(consigne[s]?|contrainte[s]?)\s*(as[- ]tu|t.ont)/,
    // "on t'a dit / donné..."
    /\s*(on|vous|ils)\s*(t.a|vous\s*a|t.ont)\s*(dit|donn[e]?|impose)\s*(quoi|quelles?|tes|des\s*(regle[s]?|instruction[s]?))/,
];

const REFUSAL_RESPONSE = "Désolé, en tant qu'assistant Samalocation, je suis uniquement formé pour vous aider dans votre gestion immobilière. Comment puis-je vous aider avec vos logements ?";

const isInjectionAttempt = (message) => {
    const normalized = normalizeText(message);
    return INJECTION_PATTERNS.some(p => p.test(normalized));
};
// ──────────────────────────────────────────────────────────────────────────────


const aiController = {
    async generateDescription(req, res, next) {
        try {
            const { name, type, address, equipments, bedrooms, bathrooms, area } = req.body;

            if (!name && !type && !address) {
                return response.error(res, "Veuillez fournir au moins le nom, le type ou l'adresse du bien pour générer une description.", 400);
            }

            const description = await aiService.generatePropertyDescription({
                name, type, address, equipments, bedrooms, bathrooms, area
            });

            await AIUsage.log({ user_id: req.ownerId, action: 'description_generation' });
            return response.success(res, { description }, "Description générée avec succès !");
        } catch (error) {
            next(error);
        }
    },

    async parseSearch(req, res, next) {
        try {
            const { q } = req.body;
            if (!q || q.trim().length < 3) {
                return response.error(res, "Requête trop courte.", 400);
            }

            const filters = await aiService.parseSearchQuery(q);
            await AIUsage.log({ user_id: req.ownerId || req.user?.id, action: 'smart_search' });
            return response.success(res, { filters }, "Requête analysée avec succès !");
        } catch (error) {
            next(error);
        }
    },

    async chat(req, res, next) {
        try {
            const { message, history } = req.body;
            if (!message) {
                return response.error(res, "Message requis.", 400);
            }

            // 🛡️ Guard: intercept prompt injection BEFORE any AI call
            if (isInjectionAttempt(message)) {
                console.warn(`[AI Controller] 🚨 Prompt injection bloquée : "${message.substring(0, 100)}"`);
                await AIUsage.log({ user_id: req.ownerId || req.user?.id || null, action: 'chat_blocked' });
                return response.success(res, { response: REFUSAL_RESPONSE }, "Réponse générée !");
            }

            const aiResponse = await aiService.getChatResponse(message, history || []);
            await AIUsage.log({ user_id: req.ownerId || req.user?.id || null, action: 'chat' });
            return response.success(res, { response: aiResponse }, "Réponse générée !");
        } catch (error) {
            next(error);
        }
    }
};

module.exports = aiController;

