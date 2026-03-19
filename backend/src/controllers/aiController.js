const response = require('../utils/response');
const geminiService = require('../utils/geminiService');
const AIUsage = require('../models/aiUsageModel');

const aiController = {
    async generateDescription(req, res, next) {
        try {
            const { name, type, address, equipments, bedrooms, bathrooms, area } = req.body;

            if (!name && !type && !address) {
                return response.error(res, "Veuillez fournir au moins le nom, le type ou l'adresse du bien pour générer une description.", 400);
            }

            const description = await geminiService.generatePropertyDescription({
                name,
                type,
                address,
                equipments,
                bedrooms,
                bathrooms,
                area
            });

            // Log usage
            await AIUsage.log({
                user_id: req.user?.id,
                action: 'description_generation'
            });

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

            const filters = await geminiService.parseSearchQuery(q);

            // Log usage (user_id might be null for public search)
            await AIUsage.log({
                user_id: req.user?.id,
                action: 'smart_search'
            });

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

            const aiResponse = await geminiService.getChatResponse(message, history || []);

            // Log usage
            await AIUsage.log({
                user_id: req.user?.id,
                action: 'chat'
            });

            return response.success(res, { response: aiResponse }, "Réponse générée !");
        } catch (error) {
            next(error);
        }
    }
};

module.exports = aiController;
