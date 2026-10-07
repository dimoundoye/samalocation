/**
 * Identifiant Samalocation (custom_id) : 2 lettres + chiffres, ex. DV6544361.
 * Utilisé pour retrouver un locataire lors de l'affectation et pour se connecter.
 */

// Taille de la colonne custom_id (users et user_profiles), élargie au démarrage par User.migrate()
const CUSTOM_ID_MAX_LENGTH = 16;

// Lettres utilisées : sans I ni O, confondus avec 1 et 0 quand on dicte l'identifiant
const CUSTOM_ID_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const CUSTOM_ID_LETTER_COUNT = 2;

// Nombre de chiffres au départ (~5,8 milliards de combinaisons), augmenté automatiquement
// si la base se remplit, jusqu'à remplir la colonne (14 chiffres)
const CUSTOM_ID_MIN_DIGITS = 7;
const CUSTOM_ID_MAX_DIGITS = CUSTOM_ID_MAX_LENGTH - CUSTOM_ID_LETTER_COUNT;

module.exports = {
    CUSTOM_ID_MAX_LENGTH,
    CUSTOM_ID_LETTERS,
    CUSTOM_ID_LETTER_COUNT,
    CUSTOM_ID_MIN_DIGITS,
    CUSTOM_ID_MAX_DIGITS,
};
