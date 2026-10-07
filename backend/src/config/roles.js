/**
 * Rôles qu'un utilisateur peut choisir lui-même à l'inscription.
 * Le rôle 'admin' n'en fait jamais partie : il s'attribue uniquement en base.
 */
const SIGNUP_ROLES = ['owner', 'tenant'];

/**
 * Type de compte choisi à l'inscription -> rôle du compte + type de l'organisation créée.
 * Le rôle reste utilisé par le frontend pour choisir le tableau de bord.
 * Pas de type "agence" à l'inscription : le mode agence s'active depuis un compte
 * propriétaire avec l'abonnement Professionnel.
 */
const ACCOUNT_TYPES = {
    tenant: { role: 'tenant', orgType: null },          // Je cherche un logement
    owner:  { role: 'owner',  orgType: 'individual' }   // Je mets en location mon bien
};

module.exports = { SIGNUP_ROLES, ACCOUNT_TYPES };
