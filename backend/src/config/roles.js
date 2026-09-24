/**
 * Rôles qu'un utilisateur peut choisir lui-même à l'inscription.
 * Le rôle 'admin' n'en fait jamais partie : il s'attribue uniquement en base.
 */
const SIGNUP_ROLES = ['owner', 'tenant'];

module.exports = { SIGNUP_ROLES };
