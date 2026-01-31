const response = require('../utils/response');
const geminiService = require('../utils/geminiService');

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
            return response.success(res, { response: aiResponse }, "Réponse générée !");
        } catch (error) {
            next(error);
        }
    }
};

module.exports = aiController;
