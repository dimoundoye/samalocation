const Organization = require('../models/organizationModel');
const Subscription = require('../models/subscriptionModel');

/**
 * Organisations d'un utilisateur telles qu'envoyées à l'interface.
 * available = false quand le propriétaire de l'espace n'a plus l'option multi-utilisateur :
 * le serveur refuse alors d'y travailler (voir authMiddleware), l'interface ne le propose pas.
 */
async function listWorkspacesForUser(userId) {
    const organizations = await Organization.findForUser(userId);
    return Promise.all(organizations.map(async (org) => ({
        ...org,
        available: org.role === 'owner' || org.id === userId || Boolean(await Subscription.hasAccessToFeature(org.id, 'multi_user'))
    })));
}

const isProfessionalPlan = (planName) =>
    ['PROFESSIONAL', 'PROFESSIONNEL', 'PROFESSIONEL'].includes(String(planName || '').trim().toUpperCase());

// Règle provisoire : un agent (membre de l'équipe d'un propriétaire) ne peut pas avoir le plan Professionnel,
// et un compte Professionnel ne peut pas devenir agent. Évite qu'un même compte soit à la fois
// une "agence" avec son équipe et un collaborateur chez d'autres propriétaires.
const AGENT_PRO_MESSAGE = "Un compte agent (membre de l'équipe d'un propriétaire) ne peut pas souscrire au plan Professionnel.";
const PRO_AGENT_MESSAGE = "Ce compte a un abonnement Professionnel : il ne peut pas rejoindre l'équipe d'un autre propriétaire.";

async function hasProfessionalPlan(userId) {
    return Boolean(await Subscription.hasAccessToFeature(userId, 'multi_user'));
}

module.exports = {
    listWorkspacesForUser,
    isProfessionalPlan,
    hasProfessionalPlan,
    AGENT_PRO_MESSAGE,
    PRO_AGENT_MESSAGE
};
